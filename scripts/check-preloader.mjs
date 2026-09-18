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
 * WHAT CHANGED, AND WHAT §3.3 NO LONGER SAYS
 *
 * §3.3 also said the overlay is "a cosmetic overlay on top of already-rendered
 * HTML, never a gate in front of it", and two assertions here enforced that:
 * LCP had to be recorded before the overlay existed, and no LCP candidate
 * could be recorded at or after the overlay appeared. Both passed. Both were
 * measuring the bug.
 *
 * A client component cannot render before it hydrates, and hydration on this
 * route lands about a second after the paint. Measured at 1440x900 on a
 * production build, across warm loads:
 *
 *     content painted     740ms   524ms   1120ms
 *     overlay in the DOM 1583ms  1469ms   1539ms
 *     -------------------------------------------
 *     uncovered page on   843ms   945ms    419ms
 *     screen before the
 *     curtain dropped
 *
 * So the rule was satisfied and the result was that a reader watched the hero
 * arrive, get covered up, and arrive again. The curtain moved into the
 * prerendered HTML — see components/IntroCurtain.js — and those two
 * assertions were rewritten rather than deleted or skipped:
 *
 *   The curtain is displayed BEFORE LCP is recorded, in every run. Same
 *   clocks, opposite sign. This is the property the fix depends on, and it
 *   would regress silently — fine on a fast machine, wrong on a slow one —
 *   which is exactly why it is asserted rather than assumed.
 *
 *   No LCP candidate's element is inside the overlay. Asked of the element,
 *   not of a timestamp: every candidate is now "after the mount" by
 *   construction, so the old form failed on every healthy build. The curtain
 *   is eligible for candidacy and never wins it, because the portrait is
 *   larger at 412x823. This is the assertion that would fail first if the
 *   curtain's type grew, which is the real risk the change introduced.
 *
 * WHAT THE CHANGE COST, MEASURED
 *
 * LCP median 1784ms with the curtain off against 1900ms with it on: 116ms
 * apart, against the control arm's own spread of 128ms across the same number
 * of runs. CLS 0.0000 either way. Same LCP element, `img`, in both arms.
 * Chrome does not test occlusion when it picks a candidate, which is why the
 * portrait still wins from behind an opaque layer.
 *
 * THE ASSERTION THAT NEVER DEPENDED ON TIMING
 *
 *   CLS is compared exactly, to four decimal places. The overlay is
 *   `position: fixed` and animates only transform and opacity, so its
 *   contribution is structurally zero; this is what proves it.
 *
 * Five structural claims are checked before any of that: the curtain is in the
 * prerendered HTML, it ships inert with no `data-intro` on <html>, nothing is
 * displayed under `prefers-reduced-motion`, it runs once per session, and its
 * own text clears WCAG AA against the ground it paints on.
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
          // The causal test, asked of the element itself rather than of a
          // timestamp. See the memo on the assertion that reads this.
          inOverlay: Boolean(el && el.closest && el.closest("[data-intro-overlay]")),
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__vitals.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });

    /*
      When the overlay is first DISPLAYED, which is no longer the same question
      as when it first exists.

      It used to be a MutationObserver on <body>, because the overlay was
      appended by React after hydration and the insertion was the event. The
      curtain now ships in the prerendered HTML, so nothing is ever inserted
      and that observer would never fire. What matters — and what the
      assertions below compare against LCP — is the first frame in which the
      element has boxes, so this polls computed style per frame from the
      earliest point a frame can be requested.
    */
    const poll = () => {
      if (window.__vitals.introMountedAt === null) {
        const el = document.querySelector("[data-intro-overlay]");
        if (el && getComputedStyle(el).display !== "none") {
          window.__vitals.introMountedAt = performance.now();
        }
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
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
// 1. The prerendered HTML carries all of it, and none of it is switched on.
//
// THIS ASSERTION USED TO SAY THE OPPOSITE
//
// It read "zero preloader markup in the prerendered HTML", and it passed for
// as long as the overlay was a client component that mounted after hydration.
// That was the bug: hydration lands about a second after the paint on this
// route, so the reader watched the hero arrive, watched it get covered, and
// watched it arrive again. Measured at 1440x900 on a production build, the
// finished page was on screen uncovered for 419, 843 and 945ms across three
// warm loads.
//
// The curtain is therefore in the HTML now, painted in the same frame as
// everything under it. What replaces the old rule is the pair below: the
// markup must be present, and it must be inert — no `data-intro` on <html> in
// the served document, because that attribute is what gives the curtain boxes
// and only the inline script may set it, at runtime, after its three checks.
// A reader with no JavaScript, and every crawler, gets the finished page with
// a `display: none` div in it.

const indexHtml = path.join(process.cwd(), ".next", "server", "app", "index.html");
if (!fs.existsSync(indexHtml)) {
  console.error(`No build found at ${indexHtml}. Run \`npm run build\` first.`);
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, "utf8");
const MARKERS = ["data-intro-overlay", "animate-intro-", "init zubyr.dev", INTRO_COOKIE];
const missing = MARKERS.filter((m) => !html.includes(m));
report(
  missing.length === 0,
  "the curtain is in the prerendered HTML",
  missing.length ? `missing ${missing.join(", ")}` : `${MARKERS.length} markers found`
);

/*
  `data-intro` must not be in the served markup. The regex is deliberately
  loose about what follows the attribute name, so `data-intro`, `data-intro=""`
  and `data-intro="playing"` all fail it. `data-intro-overlay`, `-panel`,
  `-content` and `-counter` are the element hooks and must not trip it, hence
  the negative lookahead on a hyphen.
*/
const armed = /<html[^>]*\sdata-intro(?!-)/.test(html);
report(!armed, "the curtain ships inert — no data-intro on <html>");

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

  /*
    `displayed`, not `present`. The curtain is in the HTML on every page view
    including this one; what reduced motion has to guarantee is that it never
    gets a box. §3.3 says the overlay is skipped entirely, and `display: none`
    on the element the whole sequence hangs off is what "entirely" means when
    the markup is static.
  */
  const state = await page.evaluate(() => {
    const el = document.querySelector("[data-intro-overlay]");
    return {
      present: Boolean(el),
      displayed: Boolean(el) && getComputedStyle(el).display !== "none",
      intro: document.documentElement.dataset.intro ?? null,
      cookies: document.cookie,
      lockup: getComputedStyle(document.querySelector("[data-hero-lockup]")).opacity,
    };
  });

  report(state.present, "reduced motion: the markup is still served");
  report(!state.displayed, "reduced motion: the overlay is never displayed");
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

  /*
    THE SEQUENCE IS TIMED FROM THE BROWSER'S OWN CLOCK, NOT FROM FRAMES

    Two earlier versions of this got it wrong, in the same direction both
    times, and the failure mode is worth recording because it looked like a
    pass.

    It was first a `page.evaluate` loop entered after `page.goto` resolved.
    Sound while the overlay arrived after hydration — the instrument was always
    looking before there was anything to see — and wrong the moment the curtain
    started shipping in the HTML: `goto` plus a CDP round trip does not return
    for a second or more, by which point the curtain has been up the whole
    time, so the loop logged its first observation as the mount and reported a
    216ms sequence.

    Moving the poll into `evaluateOnNewDocument` did not fix it. It reported
    144ms, because `requestAnimationFrame` is starved while the main thread
    hydrates: the first callback can be more than a second late, which is a
    thing this codebase already knew — the old Preloader's counter had the
    same problem and its notes say so. A poll cannot time something that
    happens while the poll is not running.

    So it asks the browser. Every movement in the exit is a CSS animation, and
    the Web Animations API hands back each one's `startTime` on the document
    timeline plus its computed `endTime`, which is what the compositor is
    actually using. The first start and the last end are the sequence, measured
    by the thing performing it. No frames involved, and it cannot be skewed by
    a busy main thread.

    It has to be captured before the end, because `data-intro="done"` sets
    `display: none` and an element with no boxes has no animations. Reading it
    from Node after `page.goto` resolved was the third version of this mistake:
    `load` fires around 1200ms on the throttled arm and the sequence is over at
    1580ms, so a 900ms wait after it found nothing at all.

    So the capture is injected ahead of the document and runs on
    `DOMContentLoaded`, which is before the bundle arrives and therefore before
    hydration's long tasks, and it reads each animation's resolved timing
    rather than waiting for any of them to actually start.
  */
  await page.evaluateOnNewDocument(() => {
    window.__seq = { mounted: null, gone: null, samples: null, names: [] };
    document.addEventListener("DOMContentLoaded", async () => {
      const out = window.__seq;
      const overlay = document.querySelector("[data-intro-overlay]");
      if (!overlay || getComputedStyle(overlay).display === "none") return;

      const animations = [
        overlay,
        ...overlay.querySelectorAll("[data-intro-panel], [data-intro-content]"),
        ...document.querySelectorAll("[data-hero-lockup]"),
      ].flatMap((el) => el.getAnimations());

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

      /*
        The declared timing, not the wall clock.

        `animation.startTime` is null until the animation is ready, and
        `animation.ready` resolves on the first frame — which is the one thing
        that cannot be relied on here, because frames are starved while the
        page hydrates. Awaiting it was the fourth version of this mistake: the
        promise never settled inside the window, so everything after the await
        simply never ran and the check reported "none found" on a healthy page.

        `getComputedTiming()` needs none of that. It is the resolved timing of
        the effect — delay plus duration plus end delay — available the moment
        the animation exists, and it is what the browser will use whenever the
        frames do arrive. All of these animations start together, when the
        element is first styled, so the largest `endTime` across the set IS the
        length of the sequence.
      */
      let last = 0;
      for (const a of animations) {
        const endTime = Number(a.effect.getComputedTiming().endTime);
        if (!Number.isFinite(endTime)) continue;
        out.names.push(a.animationName || "(unnamed)");
        last = Math.max(last, endTime);
      }
      if (out.names.length) {
        out.mounted = 0;
        out.gone = last;
      }
    });
  });

  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
  const seen = await page.evaluate(() => window.__seq);

  const duration =
    seen.mounted !== null && seen.gone !== null
      ? Math.round(seen.gone - seen.mounted)
      : null;

  report(
    seen.mounted !== null,
    "first visit: the curtain is displayed and animating",
    seen.names.length ? `${seen.names.length} animations` : "none found"
  );
  report(
    duration !== null && duration <= MAX_SEQUENCE_MS,
    `first visit: the whole sequence is within ${MAX_SEQUENCE_MS}ms`,
    duration === null ? "no animation timeline to read" : `${duration}ms`
  );

  // Every animation the exit needs must be one the browser actually created.
  // A typo in a keyframe name is otherwise silent: the element simply never
  // moves, and the curtain stays over the page.
  const REQUIRED = [
    "intro-panel-out",
    "intro-content-out",
    "intro-layer-out",
    "intro-lockup-in",
  ];
  const absent = REQUIRED.filter((n) => !seen.names.includes(n));
  report(
    absent.length === 0,
    "every exit animation exists on the element that needs it",
    absent.length ? `missing ${absent.join(", ")}` : REQUIRED.join(", ")
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
  const again = await page.evaluate(() => {
    const el = document.querySelector("[data-intro-overlay]");
    return Boolean(el) && getComputedStyle(el).display !== "none";
  });
  report(!again, "second view in the same session: the overlay is not displayed");
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
    // Candidates whose element is inside the overlay. An empty list is the
    // assertion: nothing the curtain paints ever became a candidate.
    fromOverlay: runs.flatMap((r) =>
      r.candidates.filter((c) => c.inOverlay).map((c) => c.label)
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

/*
  The ordering assertion, now pointing the other way.

  It used to require that LCP was recorded before the overlay existed, which
  was §3.3's "never a gate in front of content" expressed as a measurement.
  That is the condition this change deliberately gives up, so asserting it
  would be asserting the bug: measured, the old arrangement ran the overlay
  830 to 991ms AFTER the paint it was supposed to precede, and what the reader
  saw in that window was the finished page being covered up.

  What is worth guarding is the property the fix depends on: the curtain has
  boxes before the browser records the paint underneath it, in every run. If
  that ever stops being true the flash is back, and it would come back
  silently — the page would still look right on a fast machine and wrong on a
  slow one, which is the shape of bug this file exists to catch.
*/
const ordered = arms.on.filter(
  (r) => r.introMountedAt !== null && r.lcp > 0 && r.introMountedAt < r.lcp
);
const margins = arms.on
  .filter((r) => r.introMountedAt !== null)
  .map((r) => Math.round(r.lcp - r.introMountedAt));
report(
  ordered.length === arms.on.length,
  "the curtain is displayed before LCP is recorded, in every run",
  `${ordered.length}/${arms.on.length}; margins ${margins.join(", ")} ms`
);

report(
  gap <= tolerance,
  "LCP difference is inside the control arm's own noise",
  `${gap.toFixed(0)} ms apart, tolerance ${tolerance.toFixed(0)} ms (the off arm's spread)`
);

/*
  The curtain must contribute no LCP candidate.

  This used to be asked with timestamps: no candidate recorded at or after the
  moment the overlay first existed. That worked while the overlay arrived a
  second late, and it is meaningless now — the curtain exists before the first
  paint, so every candidate in the run is "after the mount" by construction and
  the check reported a failure on every healthy build.

  So it asks the element instead. Each candidate records whether its element is
  inside `[data-intro-overlay]`, evaluated in the page at the moment the entry
  is delivered, which is a fact about what painted rather than an inference
  from when. Measured across five runs per arm, the answer is none of them: the
  portrait is larger than the curtain's own lockup at 412x823, so the name and
  the counter never win the candidacy they are now technically eligible for.

  Two things follow that are worth writing down. This is the assertion that
  would fail first if the curtain's typography grew, which is the real risk the
  change introduced. And it says nothing about occlusion: Chrome does not check
  whether an element is covered when it picks an LCP candidate, which is why
  the portrait still wins from behind an opaque layer and why the medians below
  stayed inside the control arm's own noise.
*/
report(
  on.fromOverlay.length === 0,
  "the curtain contributes no LCP candidate",
  on.fromOverlay.length
    ? `candidates inside the overlay: ${[...new Set(on.fromOverlay)].join(", ")}`
    : `no candidate is inside it — off [${off.candidates.join(
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
