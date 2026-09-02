#!/usr/bin/env node
/**
 * The hero contract, measured.
 *
 * PLAN §0.2 freezes the hero through Phase 2, and §0.5 says verification is
 * measured rather than asserted. This is the instrument: it drives a real
 * browser at the four captured widths, pins every animation to a deterministic
 * end state, and records two things per viewport — a screenshot of the first
 * viewport, and a geometry/typography probe of every element painting in it.
 *
 * It is deliberately scoped to *what is on screen at scroll 0*, not to a DOM
 * subtree. Phase 2 rewrites everything below the hero, so a whole-document
 * probe would report hundreds of intended differences and drown the one signal
 * that matters. An element is in the contract if it paints in the first
 * viewport — which is exactly what the screenshot shows, and on the homepage
 * the first viewport is exactly the hero.
 *
 * Derived from docs/post-migration/capture2.js and compare3.js, which produced
 * the migration baseline. The freeze CSS, the probe fields, the 3px tolerance
 * and the pixel limits are carried over unchanged so the numbers stay
 * comparable across phases.
 *
 * Usage:
 *   node scripts/visual-hero.mjs capture <outDir>            # needs a server on :3000
 *   node scripts/visual-hero.mjs compare <before> <after> [label]
 *
 * `compare` accepts one or more `--region <viewport>=<x,y,w,h>:<label>` flags,
 * and more than one for the same viewport. A region does not change pass or
 * fail — the thresholds are still applied to the whole frame — it splits the
 * reported figure so a known, intended change can be shown to be confined to
 * the elements it was made to, and the rest of the hero shown to be untouched. Phase 2 uses it for the portrait, whose
 * swap from a 7.3 MB PNG to a WebP is a locked decision in PLAN §1 and
 * therefore expected to move pixels.
 *
 * Exit: 0 clean, 1 if any viewport fails.
 */

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { PNG } from "pngjs";
import { INTRO_COOKIE } from "../lib/intro.mjs";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "639x900", width: 639, height: 900 },
  { name: "640x900", width: 640, height: 900 },
  { name: "1440x900", width: 1440, height: 900 },
];

/** Tolerances, carried over from docs/post-migration/compare3.js. */
const TOL = 3; // px — absorbs sub-pixel animation settle jitter
const MAX_STRONG = 0.05; // % strongly-differing pixels
const MAX_DIFF = 1.0; // % any-differing pixels

/**
 * Pin every CSS animation and transition to its end state, and hide the two
 * layers that are random by design: the tsParticles canvas and the beam
 * collision debris. Without this nothing is ever pixel-stable.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  canvas { visibility: hidden !important; }                       /* tsParticles field */
  .absolute.left-0.top-20.w-px { visibility: hidden !important; } /* beams in flight */
  .absolute.z-50.h-2.w-2 { visibility: hidden !important; }       /* collision debris */
`;

/**
 * Fields recorded per element: tag, leaf text, x, y, w, h, font family, font
 * size, weight, colour, background image. The last five catch a font swap or a
 * gradient change that geometry alone would miss.
 *
 * Passed to `page.evaluate` as a function rather than as a string of source.
 * Puppeteer serialises it either way, and as a function a backtick in one of
 * its own comments cannot terminate the file's template literal — which it did,
 * twice, while this was a string.
 */
function probe() {
  const out = [];
  const vh = window.innerHeight;
  document.querySelectorAll('body *').forEach((el) => {
    if (el.tagName === 'CANVAS') {
      const r0 = el.getBoundingClientRect();
      if (r0.bottom <= 0 || r0.top >= vh) return;
      out.push(['CANVAS','',Math.round(r0.x),Math.round(r0.y),Math.round(r0.width),Math.round(r0.height)].join('|'));
      return;
    }
    const r = el.getBoundingClientRect();
    // Zero area paints nothing. Testing width AND height, rather than width
    // OR height, let through the closed index panel — the browser lays it out
    // at zero width beside its summary, which put 53 elements of invisible
    // markup into a contract that is meant to list what is on screen.
    if (r.width === 0 || r.height === 0) return;
    if (r.bottom <= 0 || r.top >= vh) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    // The content of a closed <details> is not rendered, but the browser still
    // lays it out and reports boxes for it — the site index alone put 20 more
    // invisible elements into the contract. Only the summary of a closed
    // disclosure is on screen.
    if (el.closest('details:not([open])') && !el.closest('summary')) return;
    if (el.tagName === 'SPAN' && r.width <= 4 && r.height <= 4) return;
    const txt = (el.children.length === 0 ? (el.textContent||'').trim().slice(0,40) : '');
    out.push([el.tagName, txt, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height),
      cs.fontFamily.slice(0,40), cs.fontSize, cs.fontWeight, cs.color, cs.backgroundImage.slice(0,60)].join('|'));
  });
  return out;
};

async function capture(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--hide-scrollbars"],
  });
  const consoleLog = {};

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    const msgs = [];
    page.on("console", (m) => msgs.push(`[${m.type()}] ${m.text()}`));
    page.on("pageerror", (e) => msgs.push(`[pageerror] ${e.message}`));
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

    /*
      Suppress PLAN §3.3's intro overlay by pre-setting its session flag.

      This contract measures the hero. The overlay is not the hero: it is a
      first-visit-only layer in front of it that removes itself, and a capture
      that caught it would be comparing a curtain against a stage. Setting the
      cookie is the same thing a reader's second page view does, and it is the
      component's own documented off switch rather than a test-only hook — the
      name is imported from lib/intro.mjs, which is also where the component
      reads it, so a rename cannot leave this silently suppressing nothing.

      The overlay's own effect on the numbers that matter is measured
      separately and deliberately, by scripts/check-preloader.mjs.
    */
    const target = new URL(process.env.URL || "http://localhost:3000/");
    await page.setCookie({
      name: INTRO_COOKIE,
      value: "1",
      domain: target.hostname,
      path: "/",
    });

    await page.goto(target.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(outDir, `live-${vp.name}.png`) });
    await page.addStyleTag({ content: FREEZE_CSS });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, `frozen-${vp.name}.png`) });
    fs.writeFileSync(
      path.join(outDir, `geometry-${vp.name}.txt`),
      (await page.evaluate(probe)).join("\n")
    );
    consoleLog[vp.name] = msgs;
    await page.close();
  }

  fs.writeFileSync(path.join(outDir, "console.json"), JSON.stringify(consoleLog, null, 2));
  await browser.close();
  console.log("captured ->", outDir);
}

function compare(a, b, label, regions = {}) {
  let failed = 0;
  console.log(`\n===== HERO CONTRACT: ${label || `${a} -> ${b}`} =====`);

  for (const vp of VIEWPORTS) {
    const name = vp.name;
    const ga = fs.readFileSync(path.join(a, `geometry-${name}.txt`), "utf8").split("\n");
    const gb = fs.readFileSync(path.join(b, `geometry-${name}.txt`), "utf8").split("\n");
    const diffs = [];

    if (ga.length !== gb.length) diffs.push(`ELEMENT COUNT: ${ga.length} -> ${gb.length}`);

    for (let i = 0; i < Math.min(ga.length, gb.length); i++) {
      const fa = ga[i].split("|");
      const fb = gb[i].split("|");
      // 0 tag, 1 text, 2 x, 3 y, 4 w, 5 h, 6 family, 7 size, 8 weight, 9 colour, 10 gradient
      for (const k of [0, 1, 6, 7, 8, 9, 10]) {
        if ((fa[k] || "") !== (fb[k] || "")) {
          diffs.push(`[${name} #${i}] field${k}: "${fa[k]}" -> "${fb[k]}"`);
          break;
        }
      }
      for (const k of [2, 3, 4, 5]) {
        if (Math.abs((+fa[k] || 0) - (+fb[k] || 0)) > TOL) {
          diffs.push(
            `[${name} #${i}] ${fa[0]}"${(fa[1] || "").slice(0, 20)}" geom ${fa
              .slice(2, 6)
              .join(",")} -> ${fb.slice(2, 6).join(",")}`
          );
          break;
        }
      }
    }

    const ia = PNG.sync.read(fs.readFileSync(path.join(a, `frozen-${name}.png`)));
    const ib = PNG.sync.read(fs.readFileSync(path.join(b, `frozen-${name}.png`)));
    let any = 0;
    let strong = 0;
    /*
     * More than one region per viewport, because Phase 3 changed two separate
     * places in the same frame — the band gained the social pill and the right
     * edge lost the dot rail — and a single bounding box around both would be
     * most of the hero, which proves nothing.
     */
    const viewportRegions = regions[name] || [];
    const inside = viewportRegions.map(() => ({ any: 0, strong: 0 }));
    const outside = { any: 0, strong: 0 };

    if (ia.width !== ib.width || ia.height !== ib.height) {
      diffs.push("DIMENSION MISMATCH");
    } else {
      for (let y = 0; y < ia.height; y++) {
        for (let x = 0; x < ia.width; x++) {
          const i = (ia.width * y + x) << 2;
          const d =
            Math.abs(ia.data[i] - ib.data[i]) +
            Math.abs(ia.data[i + 1] - ib.data[i + 1]) +
            Math.abs(ia.data[i + 2] - ib.data[i + 2]);
          if (d <= 12) continue;
          any++;
          if (d > 90) strong++;
          if (!viewportRegions.length) continue;
          const hit = viewportRegions.findIndex(
            (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
          );
          const bucket = hit === -1 ? outside : inside[hit];
          bucket.any++;
          if (d > 90) bucket.strong++;
        }
      }
    }

    const total = ia.width * ia.height;
    const pct = (any / total) * 100;
    const spct = (strong / total) * 100;
    const ok = diffs.length === 0 && spct <= MAX_STRONG && pct <= MAX_DIFF;
    if (!ok) failed++;

    console.log(`\n### ${name}  ${ok ? "PASS" : "*** FAIL ***"}`);
    console.log(`  contract elements  : ${ga.length}`);
    console.log(
      `  geometry/typography: ${
        diffs.length === 0 ? `IDENTICAL (within ${TOL}px)` : `${diffs.length} DIFFERENCES`
      }`
    );
    diffs.slice(0, 12).forEach((d) => console.log("    " + d));
    console.log(
      `  frozen pixels      : ${pct.toFixed(4)}% differ / ${spct.toFixed(
        4
      )}% strong  (limit ${MAX_DIFF}% / ${MAX_STRONG}%)`
    );

    if (viewportRegions.length) {
      const p = (n) => ((n / total) * 100).toFixed(4).padStart(7);
      viewportRegions.forEach((r, i) => {
        console.log(
          `    in ${r.label.padEnd(16)}: ${p(inside[i].any)}% differ / ${p(
            inside[i].strong
          )}% strong`
        );
      });
      console.log(
        `    everywhere else  : ${p(outside.any)}% differ / ${p(outside.strong)}% strong`
      );
    }
  }

  console.log(
    failed ? `\nRESULT: ${failed} viewport(s) FAILED` : "\nRESULT: ALL VIEWPORTS PASS"
  );
  return failed;
}

const [mode, ...rest] = process.argv.slice(2);

if (mode === "capture") {
  if (!rest[0]) {
    console.error("usage: node scripts/visual-hero.mjs capture <outDir>");
    process.exit(1);
  }
  await capture(rest[0]);
} else if (mode === "compare") {
  const regions = {};
  const positional = [];

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] !== "--region") {
      positional.push(rest[i]);
      continue;
    }
    // --region 1440x900=730,0,710,900:portrait
    const spec = rest[++i] || "";
    const match = spec.match(/^([^=]+)=(\d+),(\d+),(\d+),(\d+):(.+)$/);
    if (!match) {
      console.error(`bad --region: ${spec}\nexpected <viewport>=<x,y,w,h>:<label>`);
      process.exit(1);
    }
    const [, viewport, x, y, w, h, label] = match;
    (regions[viewport] ||= []).push({ x: +x, y: +y, w: +w, h: +h, label });
  }

  if (!positional[1]) {
    console.error(
      "usage: node scripts/visual-hero.mjs compare <before> <after> [label] [--region vp=x,y,w,h:label]"
    );
    process.exit(1);
  }
  process.exit(compare(positional[0], positional[1], positional[2], regions) ? 1 : 0);
} else {
  console.error("usage: node scripts/visual-hero.mjs capture|compare ...");
  process.exit(1);
}
