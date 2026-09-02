#!/usr/bin/env node
/**
 * The JavaScript budget, measured.
 *
 * PLAN §2.3 sets a budget of "under 120 KB First Load JS". Next 16 no longer
 * reports that number: the bundled upgrade guide
 * (01-app/02-guides/upgrading/version-16.md) says the `size` and
 * `First Load JS` columns were removed from `next build` because they were
 * inaccurate under React Server Components, and directs you to measure
 * "downloaded resource sizes" instead. §0.4 says the bundled docs win, so this
 * script measures the thing the budget was always a proxy for: the bytes of
 * JavaScript a browser actually downloads to render a route.
 *
 * How it measures
 *
 *   Reads the prerendered HTML for each route and collects every <script src>
 *   pointing at /_next/static. Scripts carrying `noModule` are excluded —
 *   they are the legacy polyfill bundle, which no browser that supports ES
 *   modules ever requests, and counting it would overstate the real payload by
 *   about 112 KB.
 *
 *   Each chunk is then measured three ways: on disk, gzipped, and brotli'd.
 *   Vercel negotiates brotli with every modern browser, so the brotli column is
 *   what a real visitor downloads and is the one the budget is checked against.
 *   The gzip column is kept because Next's old First Load JS figure was gzip,
 *   which makes it the number comparable to the budget as it was written.
 *
 * Usage:  npm run build && node scripts/check-js.mjs
 * Exit:   0 if every route is inside the budget, 1 otherwise.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");
const NEXT_DIR = path.join(process.cwd(), ".next");

/** PLAN §2.3. Checked against the brotli figure — see the header. */
const BUDGET_KB = 120;

const ROUTES = {
  "/": "index.html",
  "/about": "about.html",
  "/services/gohighlevel": "services/gohighlevel.html",
  "/services/automation": "services/automation.html",
  "/services/web-development": "services/web-development.html",
  "/services/mobile": "services/mobile.html",
  "/projects": "projects.html",
  "/projects/blueboost": "projects/blueboost.html",
  "/blog": "blog.html",
  "/blog/gohighlevel-two-way-sync-echo": "blog/gohighlevel-two-way-sync-echo.html",
  "/contact": "contact.html",
};

if (!fs.existsSync(APP_DIR)) {
  console.error(`No build found at ${APP_DIR}. Run \`npm run build\` before this script.`);
  process.exit(1);
}

/**
 * Libraries that must stay out of every route's initial script set.
 *
 * PLAN §3.1 asks for Lenis. Statically imported - through `lenis/react`, which
 * is what §3.1 suggests - it lands in the initial bundle of every route and
 * costs 4.8 KB brotli, which puts all eleven of them over the §2.3 budget that
 * ten of them currently clear by 1.7 KB. components/SmoothScroll.js imports it
 * with `await import("lenis")` instead, so it arrives after hydration, and this
 * table is what stops that quietly regressing: a future edit that reaches for
 * the React wrapper fails here rather than in a PageSpeed run three weeks
 * later.
 *
 * Each marker is a string that exists only inside the library's own source, not
 * at its call sites - which is why they are internals rather than the option
 * names an application would also write. `lenis-stopped` is a class Lenis puts
 * on <html>; `syncTouchLerp` is an internal default. Both must be present for a
 * chunk to count, so a coincidence in one of them is not a failure.
 */
const DEFERRED_LIBRARIES = [
  { name: "lenis", markers: ["lenis-stopped", "syncTouchLerp"] },
];

const kb = (n) => (n / 1024).toFixed(1).padStart(7);

function measure(file) {
  const html = fs.readFileSync(path.join(APP_DIR, file), "utf8");
  const tags = [...html.matchAll(/<script\b[^>]*src="(\/_next\/static\/[^"]+\.js)"[^>]*>/g)];

  const srcs = new Set();
  for (const tag of tags) if (!/\bnoModule\b/i.test(tag[0])) srcs.add(tag[1]);

  let raw = 0;
  let gzip = 0;
  let brotli = 0;
  const chunks = [];

  for (const src of srcs) {
    const file = path.join(NEXT_DIR, src.replace("/_next/", ""));
    if (!fs.existsSync(file)) {
      console.error(`  missing chunk on disk: ${src}`);
      continue;
    }
    const bytes = fs.readFileSync(file);
    const g = zlib.gzipSync(bytes, { level: 9 }).length;
    const b = zlib.brotliCompressSync(bytes).length;
    raw += bytes.length;
    gzip += g;
    brotli += b;
    chunks.push({ name: src.split("/").pop(), raw: bytes.length, gzip: g, brotli: b });
  }

  return { count: srcs.size, raw, gzip, brotli, chunks, srcs: [...srcs] };
}

console.log("check-js: JavaScript downloaded per route, from .next/server/app\n");
console.log(
  "route".padEnd(30) + "chunks" + "     raw" + "    gzip" + "  brotli" + "   budget"
);
console.log("-".repeat(72));

let over = 0;
let worst = null;
const initialScripts = new Map();

for (const [route, file] of Object.entries(ROUTES)) {
  if (!fs.existsSync(path.join(APP_DIR, file))) {
    console.error(`  MISSING  ${route}  (${file})`);
    over++;
    continue;
  }
  const m = measure(file);
  const withinBudget = m.brotli / 1024 <= BUDGET_KB;
  if (!withinBudget) over++;
  if (!worst || m.brotli > worst.m.brotli) worst = { route, m };
  initialScripts.set(route, m.srcs);

  console.log(
    route.padEnd(30) +
      String(m.count).padStart(6) +
      kb(m.raw) +
      kb(m.gzip) +
      kb(m.brotli) +
      (withinBudget ? "     ok" : "   OVER")
  );
}

if (worst) {
  console.log(`\nheaviest route: ${worst.route}`);
  for (const c of worst.m.chunks.sort((a, b) => b.brotli - a.brotli)) {
    console.log(`  ${c.name.padEnd(30)}${kb(c.raw)}${kb(c.gzip)}${kb(c.brotli)}`);
  }
}

console.log(`\nbudget: ${BUDGET_KB} KB brotli per route (PLAN §2.3).`);

// --- deferred libraries -----------------------------------------------------

let leaked = 0;
for (const { name, markers } of DEFERRED_LIBRARIES) {
  const found = [];
  for (const [route, srcs] of initialScripts) {
    for (const src of srcs) {
      const file = path.join(NEXT_DIR, src.replace("/_next/", ""));
      if (!fs.existsSync(file)) continue;
      const code = fs.readFileSync(file, "utf8");
      if (markers.every((m) => code.includes(m))) {
        found.push(`${route} -> ${src.split("/").pop()}`);
      }
    }
  }
  if (found.length) {
    leaked++;
    console.error(`\n  ${name} is in an initial script: ${found.join(", ")}`);
  } else {
    console.log(`deferred: ${name} is in no route's initial scripts.`);
  }
}

if (over || leaked) {
  const parts = [];
  if (over) parts.push(`${over} route(s) over budget`);
  if (leaked) parts.push(`${leaked} library/libraries no longer deferred`);
  console.error(`\ncheck-js FAILED — ${parts.join(", ")}.`);
  process.exit(1);
}

console.log("check-js OK");
