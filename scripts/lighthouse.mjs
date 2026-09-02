#!/usr/bin/env node
/**
 * Lighthouse against a URL, mobile and desktop, summarised.
 *
 * PLAN §0.5 makes PageSpeed Insights against `https://www.zubyr.dev` the
 * authoritative number. The PSI public API answers 429 —
 * "Quota exceeded for quota metric 'Queries' and limit 'Queries per day'" on
 * the shared anonymous project — and there is no API key in this repository.
 *
 * So this runs the same thing locally: Lighthouse is the engine PSI runs, with
 * the same audits and the same mobile emulation (Moto G Power, 1.6 Mbps, 4x
 * CPU). What it does not reproduce is PSI's network location and its server's
 * CPU, so the timings will differ from a PSI run by some constant; the
 * category scores and the audit findings are the same analysis.
 *
 * Report it as "Lighthouse <version>, run locally against <url>", never as a
 * PageSpeed Insights score. When a key is available, PSI is still the number
 * §0.5 asks for.
 *
 * Lighthouse is not a dependency of this project. It is fetched by `npx` for
 * the duration of the run, which keeps a 50 MB measurement tool out of
 * `package.json` — §2.3's budget is about what ships, but a dev dependency
 * that large for one command is still worth not having.
 *
 * Usage:
 *   node scripts/lighthouse.mjs <url> [label]
 *   node scripts/lighthouse.mjs https://www.zubyr.dev/ prod
 *
 * Writes docs/phase3/lighthouse-<label>.json for each strategy and prints a
 * table. Exit code is always 0 — this reports, it does not gate.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer";

const url = process.argv[2];
const label = process.argv[3] || "run";

if (!url) {
  console.error("usage: node scripts/lighthouse.mjs <url> [label]");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "docs", "phase3");
fs.mkdirSync(outDir, { recursive: true });

const chromePath = await puppeteer.executablePath();

const METRICS = [
  ["first-contentful-paint", "FCP"],
  ["largest-contentful-paint", "LCP"],
  ["total-blocking-time", "TBT"],
  ["cumulative-layout-shift", "CLS"],
  ["speed-index", "SI"],
];

const CATEGORIES = [
  ["performance", "Perf"],
  ["accessibility", "A11y"],
  ["best-practices", "Best"],
  ["seo", "SEO"],
];

function run(strategy) {
  const file = path.join(outDir, `lighthouse-${label}-${strategy}.json`);
  const args = [
    "--yes",
    "lighthouse@12",
    url,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--quiet",
    "--output=json",
    `--output-path=${file}`,
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
  ];
  if (strategy === "desktop") args.push("--preset=desktop");

  try {
    execFileSync("npx", args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, CHROME_PATH: chromePath },
      shell: true,
      timeout: 10 * 60 * 1000,
    });
  } catch (error) {
    // chrome-launcher's temp-directory cleanup throws EPERM on Windows after a
    // run that otherwise completed. The report on disk is the source of truth,
    // so a thrown error only matters if the file is missing.
    if (!fs.existsSync(file)) {
      console.error(`  ${strategy}: lighthouse failed`);
      console.error(String(error.stderr || error.message).split("\n").slice(0, 4).join("\n"));
      return null;
    }
  }

  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    strategy,
    file,
    version: report.lighthouseVersion,
    finalUrl: report.finalDisplayedUrl,
    scores: Object.fromEntries(
      CATEGORIES.map(([id]) => [id, Math.round((report.categories[id]?.score ?? 0) * 100)])
    ),
    metrics: Object.fromEntries(
      METRICS.map(([id]) => [id, report.audits[id]?.displayValue ?? "—"])
    ),
    // The opportunities and diagnostics worth naming, so the report can quote a
    // finding rather than a hunch.
    findings: Object.values(report.audits)
      .filter(
        (a) =>
          a.score !== null &&
          a.score < 0.9 &&
          (a.details?.type === "opportunity" || a.details?.type === "table") &&
          a.title
      )
      .map((a) => `${a.title}${a.displayValue ? ` — ${a.displayValue}` : ""}`),
    lcpElement:
      report.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]
        ?.node?.snippet ?? null,
  };
}

const results = [];
for (const strategy of ["mobile", "desktop"]) {
  process.stdout.write(`  running ${strategy}…\n`);
  const result = run(strategy);
  if (result) results.push(result);
}

if (!results.length) process.exit(0);

const lines = [];
lines.push(`Lighthouse ${results[0].version} — ${url}`);
lines.push(`${new Date().toISOString()}  ·  ${os.platform()} ${os.arch()}`);
lines.push("");
lines.push("            " + CATEGORIES.map(([, l]) => l.padStart(6)).join("") +
  "   " + METRICS.map(([, l]) => l.padStart(9)).join(""));
for (const r of results) {
  lines.push(
    r.strategy.padEnd(12) +
      CATEGORIES.map(([id]) => String(r.scores[id]).padStart(6)).join("") +
      "   " +
      METRICS.map(([id]) => String(r.metrics[id]).padStart(9)).join("")
  );
}
for (const r of results) {
  lines.push("");
  lines.push(`${r.strategy} — LCP element: ${r.lcpElement ?? "(not reported)"}`);
  if (r.findings.length) {
    lines.push(`${r.strategy} — findings:`);
    for (const f of r.findings.slice(0, 14)) lines.push(`    ${f}`);
  }
}

const text = lines.join("\n");
console.log("\n" + text);
fs.writeFileSync(path.join(outDir, `lighthouse-${label}.txt`), text + "\n");
