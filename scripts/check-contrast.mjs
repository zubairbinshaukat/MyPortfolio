#!/usr/bin/env node
/**
 * Text contrast, measured in the browser rather than reasoned about.
 *
 * PLAN §2.1 sets a floor: "Body copy contrast floor is `rgba(255,255,255,0.6)`.
 * The old site used 20–30% opacity text that failed 4.5:1. Do not reintroduce
 * it." §2.5's done-condition restates it as "Accessibility 100; body text
 * contrast ≥ 4.5:1 everywhere".
 *
 * A token table cannot prove that. Opacity composites: white at 62% over the
 * ground is 6.9:1, but the same 62% over a 3% white surface inside a card on
 * an elevated footer is a different number, and a nested opacity is different
 * again. So this walks every text node on every route in a real browser,
 * composites the computed colour against the first opaque background behind
 * it, and computes the WCAG 2.1 ratio.
 *
 * Thresholds are WCAG AA: 4.5:1 for normal text, 3:1 for large text (18.66px
 * bold or 24px regular and above). Anything below fails, and the failure names
 * the element and the string so it can be found.
 *
 * Usage:  node scripts/check-contrast.mjs [route ...]     # needs a server on :3000
 * Exit:   0 clean, 1 on any failure.
 */

import puppeteer from "puppeteer";
import { INTRO_COOKIE } from "../lib/intro.mjs";

const BASE = process.env.URL || "http://localhost:3000";

const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "/",
      "/about",
      "/services/gohighlevel",
      "/services/mobile",
      "/projects",
      "/projects/blueboost",
      "/blog",
      "/blog/gohighlevel-two-way-sync-echo",
      "/contact",
    ];

/**
 * Runs in the page. Returns one record per text-bearing element that is
 * visible, with its composited foreground, its composited background, and the
 * ratio between them.
 *
 * Passed to `page.evaluate` as a function rather than a string: puppeteer
 * serialises it either way, and as a function the backticks and `${}` in its
 * own comments are not a syntax hazard in this file.
 */
function audit() {
  const parse = (value) => {
    const m = String(value).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const luminance = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (a, b) => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  /** The effective background behind an element: composite every layer up to the root. */
  const backgroundFor = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) layers.push(bg);
      if (bg && bg.a === 1) break;
      node = node.parentElement;
    }
    let result = { r: 0, g: 0, b: 0, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
    return result;
  };

  const out = [];

  for (const el of document.querySelectorAll("body *")) {
    // Only elements with their own visible text, so a string is measured once
    // at the element that actually paints it.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!own) continue;

    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (parseFloat(cs.opacity) === 0) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Visually-hidden helpers (skip links, sr-only headings) are not painted.
    if (rect.width <= 1 && rect.height <= 1) continue;
    if (cs.clip === "rect(0px, 0px, 0px, 0px)") continue;

    const fg = parse(cs.color);
    if (!fg) continue;

    const bg = backgroundFor(el);
    const elementOpacity = parseFloat(cs.opacity);
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = isLarge ? 3 : 4.5;

    const base = {
      tag: el.tagName,
      cls: (el.getAttribute("class") || "").slice(0, 60),
      text: own.slice(0, 50),
      color: cs.color,
      size,
      weight,
      isLarge,
      required,
    };

    /**
     * Gradient-filled text — `background-clip: text` with a transparent
     * fill, which is how the hero paints "Bin Shaukat" and how every gradient
     * heading works. The computed `color` is rgba(0,0,0,0); measuring it
     * would report 1:1 for text that is plainly legible, which is why axe
     * reports these as incomplete rather than failing them.
     *
     * There is still a right answer, so it is computed rather than skipped:
     * every colour stop in the gradient is checked against the background and
     * the worst one is reported. If the darkest stop clears the threshold, so
     * does every pixel of the text.
     */
    const clipSource = (() => {
      // background-clip is not inherited, and the pattern puts it on a wrapper
      // — `text-transparent` on a div, the words in a span inside it — so the
      // ancestor that actually paints the glyphs has to be found.
      let node = el;
      while (node && node !== document.body) {
        const s = getComputedStyle(node);
        const clip =
          s.getPropertyValue("background-clip") +
          " " +
          s.getPropertyValue("-webkit-background-clip");
        if (/text/.test(clip) && s.backgroundImage !== "none") return s;
        node = node.parentElement;
      }
      return null;
    })();

    if (fg.a === 0 && clipSource) {
      const stops = [...String(clipSource.backgroundImage).matchAll(/rgba?\(([^)]+)\)/g)]
        .map((m) => parse("rgb(" + m[1] + ")"))
        .filter((c) => c && c.a > 0);

      if (!stops.length) continue;

      const ratios = stops.map((stop) => ratio(over(stop, bg), bg));
      out.push({
        ...base,
        gradient: true,
        color: "gradient, " + stops.length + " stops",
        ratio: Math.round(Math.min(...ratios) * 100) / 100,
      });
      continue;
    }

    // Element opacity multiplies through; fold it into the alpha.
    const composited = over({ ...fg, a: fg.a * elementOpacity }, bg);

    out.push({ ...base, ratio: Math.round(ratio(composited, bg) * 100) / 100 });
  }

  return out;
}

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--hide-scrollbars"],
});

let failures = 0;
let checked = 0;
let worst = null;

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  /*
    PLAN §3.3's intro overlay is suppressed, by setting the session flag the
    reader's second page view sets. It is on screen for 1.6 seconds of a first
    visit and then removes itself, so whether a run caught it would depend on
    how busy the machine was — and a contrast gate that samples a different set
    of elements on different runs is not a gate.

    Its own two text colours are audited deliberately, while it is on screen,
    by scripts/check-preloader.mjs.
  */
  await page.setCookie({
    name: INTRO_COOKIE,
    value: "1",
    domain: new URL(BASE).hostname,
    path: "/",
  });

  await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);

  const records = await page.evaluate(audit);
  const bad = records.filter((r) => r.ratio < r.required);
  checked += records.length;

  for (const r of records) {
    if (!worst || r.ratio < worst.ratio) worst = { ...r, route };
  }

  console.log(
    `${route.padEnd(28)} ${String(records.length).padStart(4)} text elements  ${
      bad.length ? `${bad.length} BELOW AA` : "all pass"
    }`
  );

  for (const r of bad) {
    failures++;
    console.error(
      `    FAIL ${r.ratio}:1 (needs ${r.required}) <${r.tag}> ${r.size}px/${r.weight} ${r.color}\n` +
        `         "${r.text}"\n         class="${r.cls}"`
    );
  }

  // Gradient-filled text is reported whether it passes or not, so the worst
  // stop is a number in the log rather than a thing nobody looked at.
  for (const r of records.filter((x) => x.gradient)) {
    console.log(
      `    gradient text: worst stop ${r.ratio}:1 (needs ${r.required}) — "${r.text}"`
    );
  }

  await page.close();
}

await browser.close();

console.log(`\n${checked} text elements measured, ${failures} below AA.`);
if (worst) {
  console.log(
    `lowest measured ratio: ${worst.ratio}:1 on ${worst.route} — <${worst.tag}> "${worst.text}"`
  );
}

if (failures) {
  console.error("\ncheck-contrast FAILED");
  process.exit(1);
}

console.log("check-contrast OK");
