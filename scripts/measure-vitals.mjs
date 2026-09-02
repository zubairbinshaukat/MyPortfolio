#!/usr/bin/env node
/**
 * Core Web Vitals, measured in a real browser.
 *
 * PLAN §2.2 requires the <h1> to be the LCP element and CLS to be 0.00, and
 * §0.5 says these are measured, not asserted. Lighthouse in Edge DevTools is
 * the manual instrument; this is the automated one, so a regression is caught
 * on the machine rather than in a panel someone has to remember to open.
 *
 * It reports, per route:
 *
 *   LCP      the largest contentful paint time, and — the part that matters
 *            here — the tag, class and text of the element that produced it
 *   CLS      the sum of every layout shift not following a user interaction
 *   fonts    every font file the page requested, with its transfer size
 *   origins   every distinct origin the page fetched from, so a third-party
 *            request cannot appear unnoticed
 *
 * Throttling mirrors Lighthouse's mobile preset (4x CPU, Slow 4G) so the
 * numbers are in the same ballpark as PageSpeed rather than the ~0ms a local
 * unthrottled run reports. They are still lab numbers on a different machine:
 * use them to compare before against after, and PageSpeed against production
 * for the absolute figures.
 *
 * Usage:  node scripts/measure-vitals.mjs [route ...]      # needs a server on :3000
 */

import puppeteer from "puppeteer";

const BASE = process.env.URL || "http://localhost:3000";
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/about", "/services/gohighlevel", "/projects", "/blog", "/contact"];

/** Lighthouse's mobile emulation: 412x823 at DPR 1.75, 4x CPU, Slow 4G. */
const MOBILE = { width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true };
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};

/**
 * Installed before any page script runs, so no paint is missed. Buffered
 * observers would also catch earlier entries, but registering first is what
 * makes the layout-shift stream complete.
 */
const COLLECT = `
  window.__vitals = { lcp: null, cls: 0, shifts: [], candidates: [] };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const el = e.element;
      window.__vitals.candidates.push({
        size: e.size,
        tag: el ? el.tagName : null,
        url: e.url || null,
        text: el ? (el.textContent || '').trim().slice(0, 60) : null,
      });
      window.__vitals.candidates.sort((a, b) => b.size - a.size);
      window.__vitals.lcp = {
        time: e.startTime,
        size: e.size,
        url: e.url || null,
        tag: el ? el.tagName : null,
        cls: el ? (el.getAttribute('class') || '').slice(0, 70) : null,
        text: el ? (el.textContent || '').trim().slice(0, 60) : null,
      };
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__vitals.cls += e.value;
      if (e.value > 0.0001) {
        window.__vitals.shifts.push({
          value: e.value,
          sources: (e.sources || []).map((s) =>
            s.node ? s.node.nodeName + '.' + (s.node.getAttribute ? (s.node.getAttribute('class') || '').slice(0, 40) : '') : '?'
          ),
        });
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
`;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--hide-scrollbars"],
});

let failures = 0;

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport(MOBILE);
  await page.setCacheEnabled(false);

  const client = await page.createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", SLOW_4G);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const requests = [];
  page.on("response", (res) => {
    requests.push({ url: res.url(), type: res.request().resourceType(), status: res.status() });
  });

  await page.evaluateOnNewDocument(COLLECT);
  await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2500));

  const vitals = await page.evaluate(() => window.__vitals);

  const origins = [
    ...new Set(
      requests
        .filter((r) => /^https?:/.test(r.url))
        .map((r) => new URL(r.url).origin)
        .filter((o) => o !== BASE)
    ),
  ];
  const fonts = requests.filter((r) => r.type === "font" || /\.(woff2?|ttf|otf)(\?|$)/.test(r.url));

  console.log(`\n=== ${route}`);
  if (vitals.lcp) {
    console.log(
      `  LCP      ${vitals.lcp.time.toFixed(0)} ms  <${vitals.lcp.tag}>  ${vitals.lcp.size.toLocaleString()} px²  "${
        vitals.lcp.text || vitals.lcp.url || ""
      }"`
    );
    console.log(`           class="${vitals.lcp.cls || ""}"`);
    /*
      Every candidate the browser considered, largest first. PLAN §2.2 wants
      the <h1> to be the LCP element; when it is not, this is the evidence for
      why — LCP is decided by painted area, so the answer is a list of sizes
      rather than an opinion.
    */
    for (const c of vitals.candidates.slice(0, 4)) {
      console.log(
        `             candidate ${String(c.size).padStart(8)} px²  <${c.tag}> "${(c.text || c.url || "").slice(0, 40)}"`
      );
    }
  } else {
    console.log("  LCP      not reported");
  }
  console.log(`  CLS      ${vitals.cls.toFixed(4)}`);
  for (const s of vitals.shifts.slice(0, 5)) {
    console.log(`             shift ${s.value.toFixed(4)} from ${s.sources.join(", ")}`);
  }
  console.log(`  fonts    ${fonts.length}`);
  for (const f of fonts) console.log(`             ${f.url.replace(BASE, "")}`);
  console.log(`  origins  ${origins.length ? origins.join(", ") : "none (all first-party)"}`);

  if (vitals.cls > 0.005) failures++;
  await page.close();
}

await browser.close();
console.log(
  failures ? `\n${failures} route(s) with a non-zero CLS.` : "\nCLS is zero on every route."
);
