#!/usr/bin/env node
/**
 * PLAN §3.3's defining condition, measured.
 *
 *   "PageSpeed scores must be identical with it on and off. If they aren't,
 *    the implementation broke the rule — that's a bug, not a tradeoff."
 *
 * PageSpeed itself runs against production (§0.5). This measures the two lab
 * metrics a PageSpeed performance score is mostly made of and that a
 * full-screen overlay could plausibly move — Largest Contentful Paint and
 * Cumulative Layout Shift — plus the identity of the LCP element, which is the
 * thing an overlay is most likely to change without changing a number.
 *
 * HOW THE COMPARISON IS MADE FAIR
 *
 * Both arms load the same URL in the same browser at the same viewport on the
 * same machine. The only difference is one cookie, and that cookie is the
 * component's own off switch rather than a test-only branch: `lib/intro.mjs`
 * is imported by the component and by this file, so there is no second
 * implementation of "off" that could drift from the first.
 *
 * WHY THE TIMING TOLERANCE IS MEASURED AND NOT CHOSEN
 *
 * A single LCP figure from a laptop that is also serving the site is noise
 * with a number on it. Measured here, repeated loads of the *same* arm span
 * several hundred milliseconds, and LCP equals FCP on every one of them — the
 * portrait finishes loading in about 60ms and then waits for first paint — so
 * what this records locally is mostly how busy the machine was. The first
 * version of this check failed on a 200ms gap that reversed sign on the next
 * run.
 *
 * A fixed tolerance against that either fails at random or would pass a real
 * regression. So the tolerance is the control arm's own spread: the two arms
 * must differ by less than the preloader-off arm differs from itself across
 * the same number of runs.
 *
 * THE ASSERTIONS THAT DO NOT DEPEND ON TIMING
 *
 * These are the ones that actually settle §3.3, because they are properties
 * rather than measurements:
 *
 *   LCP happens before the overlay exists. Recorded per run, in the same
 *   clock. An event that has already been reported cannot be affected by an
 *   element that has not been created yet, and this is what makes "identical
 *   with it on and off" a fact about the code rather than a hope about a
 *   machine.
 *
 *   No LCP candidate is recorded at or after the moment the overlay exists.
 *   Candidate timestamps and the mount timestamp come from the same clock, so
 *   this says outright that nothing the overlay did produced a candidate — a
 *   layer that became contentful would be recorded after it appeared, by
 *   definition. Comparing the two arms' candidate *sets* was tried first and
 *   flaked one run in three: the intermediate candidates are the hero lockup
 *   either side of the font swap, and whether the browser catches them is
 *   machine noise that lands in whichever arm gets the frame.
 *
 *   CLS is compared exactly, to four decimal places. The overlay is
 *   `position: fixed` and animates only transform and opacity, so its
 *   contribution is structurally zero; this is what proves it.
 *
 * Four further structural claims the overlay makes about itself are checked
 * first: no markup in the prerendered HTML, nothing at all under
 * `prefers-reduced-motion`, once per session, and its own text clearing WCAG
 * AA against the ground it paints on.
 *
 * Usage:  npm run serve  (in another shell), then node scripts/check-preloader.mjs
 * Exit:   0 clean, 1 on any divergence or failed structural claim.
 */

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { INTRO_COOKIE } from "../lib/intro.mjs";

const BASE = process.env.BASE || "http://localhost:3000";
const RUNS = 5;

/**
 * The same conditions scripts/measure-vitals.mjs uses, and for the same
 * reason: PageSpeed's mobile run is a throttled emulation, and an overlay's
 * cost is a main-thread cost. Measured on an unthrottled desktop viewport this
 * check passed comfortably and was measuring the wrong machine — a 4x CPU
 * penalty is where the preloader's own work would show up if it had any.
 */
const MOBILE = {
  width: 412,
  height: 823,
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
};
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};
const CPU_THROTTLE = 4;

/** §3.3's ceiling for the whole sequence. */
const MAX_SEQUENCE_MS = 2200;

/**
 * A floor under the measured tolerance, for a run where the control arm
 * happens to be unusually consistent. Two loads of the same page are never
 * identical to the millisecond, and demanding it would be measuring the
 * machine rather than the code.
 */
const LCP_TOLERANCE_FLOOR_MS = 60;

let failures = 0;
const lines = [];

function report(ok, label, detail) {
  const line = `${ok ? "  ok  " : "  FAIL"}  ${label}${detail ? `  —  ${detail}` : ""}`;
  lines.push(line);
  console.log(line);
  if (!ok) failures++;
}

/**
 * One instrumented page load.
 *
 * The observers go in through `evaluateOnNewDocument` so they exist before the
 * document does; `buffered: true` would cover the gap anyway, and relying on
 * both is free.
 *
 * `introMountedAt` is written by a MutationObserver rather than polled, so the
 * mount timestamp and the LCP timestamp come from the same clock and can be
 * compared directly.
 */
async function measure(browser, { intro }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(MOBILE);
  await page.setCacheEnabled(false);

  const client = await page.createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", SLOW_4G);
  await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });

  if (!intro) {
    await page.setCookie({
      name: INTRO_COOKIE,
      value: "1",
      domain: new URL(BASE).hostname,
      path: "/",
    });
  }

  await page.evaluateOnNewDocument(() => {
    window.__vitals = {
      lcp: 0,
      lcpElement: null,
      // Every candidate the observer reports, not only the last. A new one in
      // the preloader arm is the failure this is looking for.
      candidates: [],
      cls: 0,
      introMountedAt: null,
    };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const el = entry.element;
        const name = el
          ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}`
          : "(none)";
        window.__vitals.lcp = entry.startTime;
        window.__vitals.lcpElement = name;
        window.__vitals.candidates.push({
          label: `${name}@${Math.round(entry.size)}`,
          at: entry.startTime,
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__vitals.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });

    const watch = new MutationObserver(() => {
      if (window.__vitals.introMountedAt !== null) return;
      if (!document.querySelector("[data-intro-overlay]")) return;
      window.__vitals.introMountedAt = performance.now();
      watch.disconnect();
    });
    document.addEventListener("DOMContentLoaded", () =>
      watch.observe(document.body, { childList: true, subtree: true })
    );
  });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  // Long enough for the whole sequence and its exit at 4x CPU throttling, so
  // any shift or late LCP candidate the overlay could produce has happened
  // before the read.
  await new Promise((r) => setTimeout(r, 8000));

  const vitals = await page.evaluate(() => window.__vitals);
  await context.close();
  return vitals;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// ---------------------------------------------------------------------------
// 1. The prerendered HTML carries none of it.

const indexHtml = path.join(process.cwd(), ".next", "server", "app", "index.html");
if (!fs.existsSync(indexHtml)) {
  console.error(`No build found at ${indexHtml}. Run \`npm run build\` first.`);
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, "utf8");
const MARKERS = ["data-intro-overlay", "animate-intro-", "init zubyr.dev", INTRO_COOKIE];
const present = MARKERS.filter((m) => html.includes(m));
report(
  present.length === 0,
  "zero preloader markup in the prerendered HTML",
  present.length ? `found ${present.join(", ")}` : `${MARKERS.length} markers checked`
);

// ---------------------------------------------------------------------------

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--font-render-hinting=none", "--force-color-profile=srgb"],
});

// 2. Reduced motion: nothing mounts, nothing is written, the hero is untouched.
{
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));

  const state = await page.evaluate(() => ({
    overlay: Boolean(document.querySelector("[data-intro-overlay]")),
    intro: document.documentElement.dataset.intro ?? null,
    cookies: document.cookie,
    lockup: getComputedStyle(document.querySelector("[data-hero-lockup]")).opacity,
  }));

  report(!state.overlay, "reduced motion: the overlay never mounts");
  report(state.intro === null, "reduced motion: no data-intro on <html>");
  report(
    !state.cookies.includes(INTRO_COOKIE),
    "reduced motion: no session cookie written",
    state.cookies || "(no cookies)"
  );
  report(
    state.lockup === "1",
    "reduced motion: the hero lockup is untouched",
    `opacity ${state.lockup}`
  );
  await context.close();
}

// 3. Duration, contrast, and once-per-session — all from one browser context,
//    because "once per session" is a claim about a context and not a page.
{
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });

  const seen = await page.evaluate(async () => {
    const out = { mounted: null, gone: null, samples: null };
    const started = performance.now();
    while (performance.now() - started < 9000) {
      await new Promise((r) => requestAnimationFrame(r));
      const overlay = document.querySelector("[data-intro-overlay]");
      if (overlay && out.mounted === null) {
        out.mounted = performance.now();
        // Read what it actually paints, while it is painting it.
        const ground = getComputedStyle(document.documentElement).backgroundColor;
        out.samples = [...overlay.querySelectorAll("li, p")]
          .filter((el) => el.textContent.trim())
          .map((el) => {
            const style = getComputedStyle(el);
            return {
              text: el.textContent.trim().slice(0, 24),
              color: style.color,
              size: parseFloat(style.fontSize),
              weight: Number(style.fontWeight) || 400,
              ground,
            };
          });
      }
      if (out.mounted !== null && !overlay) {
        out.gone = performance.now();
        break;
      }
    }
    return out;
  });

  const duration =
    seen.mounted !== null && seen.gone !== null
      ? Math.round(seen.gone - seen.mounted)
      : null;

  report(seen.mounted !== null, "first visit: the overlay mounts");
  report(
    duration !== null && duration <= MAX_SEQUENCE_MS,
    `first visit: the whole sequence is within ${MAX_SEQUENCE_MS}ms`,
    duration === null ? "it never removed itself" : `${duration}ms`
  );

  // WCAG AA on the overlay's own text, composited against the ground.
  const rgb = (value) => {
    const parts = (value.match(/-?[\d.]+/g) || []).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ({ r, g, b }) =>
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  });

  let worst = null;
  for (const sample of seen.samples || []) {
    const bg = rgb(sample.ground);
    const l1 = luminance(composite(rgb(sample.color), bg));
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const large = sample.size >= 24 || (sample.size >= 18.66 && sample.weight >= 700);
    const required = large ? 3 : 4.5;
    if (!worst || ratio - required < worst.ratio - worst.required) {
      worst = { ...sample, ratio, required };
    }
  }

  report(
    Boolean(worst) && worst.ratio >= worst.required,
    "the overlay's own text clears WCAG AA",
    worst
      ? `worst ${worst.ratio.toFixed(2)}:1 against ${worst.required}:1, on "${worst.text}"`
      : "no text sampled"
  );

  // Same context, second view.
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1200));
  const again = await page.evaluate(() =>
    Boolean(document.querySelector("[data-intro-overlay]"))
  );
  report(!again, "second view in the same session: no overlay");
  await context.close();
}

// ---------------------------------------------------------------------------
// 4. The metrics, on and off.
//
// Interleaved, so a machine that gets busier partway through penalises both
// arms equally rather than whichever one happened to go second. The first pair
// is discarded: the first navigation in a fresh browser pays for a cold
// connection and a cold image decode, and that cost lands on whichever arm
// runs first.

const arms = { off: [], on: [] };
for (let run = 0; run <= RUNS; run++) {
  const offRun = await measure(browser, { intro: false });
  const onRun = await measure(browser, { intro: true });
  if (run === 0) continue;
  arms.off.push(offRun);
  arms.on.push(onRun);
}

await browser.close();

const summarise = (runs) => {
  const lcps = runs.map((r) => r.lcp);
  return {
    lcp: median(lcps),
    spread: Math.max(...lcps) - Math.min(...lcps),
    cls: median(runs.map((r) => r.cls)),
    elements: [...new Set(runs.map((r) => r.lcpElement))],
    candidates: [...new Set(runs.flatMap((r) => r.candidates.map((c) => c.label)))].sort(),
    // Candidates the browser recorded at or after the overlay existed. An
    // empty list is the assertion: nothing the overlay did produced one.
    afterMount: runs.flatMap((r) =>
      r.introMountedAt === null
        ? []
        : r.candidates.filter((c) => c.at >= r.introMountedAt).map((c) => c.label)
    ),
  };
};

const off = summarise(arms.off);
const on = summarise(arms.on);
const tolerance = Math.max(off.spread, LCP_TOLERANCE_FLOOR_MS);
const gap = Math.abs(on.lcp - off.lcp);

const table = [
  "",
  `  ${RUNS} runs per arm, interleaved, first pair discarded`,
  `  412x823, Slow 4G, ${CPU_THROTTLE}x CPU — the same emulation as check:vitals`,
  "",
  "                   LCP median   LCP spread   CLS median   LCP element",
  `  preloader off    ${off.lcp.toFixed(0).padStart(8)} ms  ${off.spread
    .toFixed(0)
    .padStart(8)} ms   ${off.cls.toFixed(4).padStart(10)}   ${off.elements.join(" / ")}`,
  `  preloader on     ${on.lcp.toFixed(0).padStart(8)} ms  ${on.spread
    .toFixed(0)
    .padStart(8)} ms   ${on.cls.toFixed(4).padStart(10)}   ${on.elements.join(" / ")}`,
  "",
];
lines.push(...table);
console.log(table.join("\n"));

// The causal assertion. Every run in the preloader arm must have recorded its
// LCP before the overlay existed.
const ordered = arms.on.filter(
  (r) => r.introMountedAt !== null && r.lcp > 0 && r.lcp < r.introMountedAt
);
const margins = arms.on
  .filter((r) => r.introMountedAt !== null)
  .map((r) => Math.round(r.introMountedAt - r.lcp));
report(
  ordered.length === arms.on.length,
  "LCP is recorded before the overlay exists, in every run",
  `${ordered.length}/${arms.on.length}; margins ${margins.join(", ")} ms`
);

report(
  gap <= tolerance,
  "LCP difference is inside the control arm's own noise",
  `${gap.toFixed(0)} ms apart, tolerance ${tolerance.toFixed(0)} ms (the off arm's spread)`
);

/*
  The overlay must contribute no LCP candidate, and this asks that directly
  rather than by comparing the two arms' candidate sets.

  Comparing the sets was the first version and it was wrong. The candidates
  recorded before the portrait paints are the hero lockup at whatever size the
  font swap had it at that instant — `div@13920` and `div@17889` are the same
  element either side of the swap — and whether the browser gets a frame in
  during that window is machine noise. It lands in whichever arm happens to
  catch it, so the check failed roughly one run in three on a difference that
  had nothing to do with the overlay.

  Timestamps settle it. Every candidate carries the time it was recorded and
  every run carries the time the overlay first existed, on the same clock; a
  candidate recorded before the overlay existed cannot be the overlay's. So the
  assertion is that no candidate was recorded at or after the mount — which is
  a fact about causation rather than a comparison between two noisy samples.
*/
report(
  on.afterMount.length === 0,
  "the overlay contributes no LCP candidate",
  on.afterMount.length
    ? `recorded after the mount: ${[...new Set(on.afterMount)].join(", ")}`
    : `all candidates predate the overlay — off [${off.candidates.join(
        ", "
      )}] on [${on.candidates.join(", ")}]`
);

report(
  on.cls.toFixed(4) === off.cls.toFixed(4),
  "CLS identical",
  `${off.cls.toFixed(4)} vs ${on.cls.toFixed(4)}`
);

report(
  on.elements.length === 1 &&
    off.elements.length === 1 &&
    on.elements[0] === off.elements[0],
  "LCP element identical",
  `${off.elements.join(" / ")} vs ${on.elements.join(" / ")}`
);

const outDir = path.join(process.cwd(), "docs", "phase3");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "preloader.txt"),
  `check-preloader — PLAN §3.3\n${new Date().toISOString()}\n${BASE}\n\n${lines.join("\n")}\n`
);

console.log(
  failures
    ? `\ncheck-preloader FAILED — ${failures} condition(s).`
    : "\ncheck-preloader OK"
);
process.exit(failures ? 1 : 0);
