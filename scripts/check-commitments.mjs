#!/usr/bin/env node
/**
 * Unconfirmed commitments must not reach a page.
 *
 * lib/commitments.mjs holds every claim that promises a prospective client
 * something — a price, a timeframe, a transfer of credentials or code, a
 * guarantee — and gates it behind a per-item `confirmed` flag. The gate is
 * enforced at the data layer, so an unconfirmed item cannot render through the
 * normal path. This check closes the other door: it reads the prerendered HTML
 * and fails if any gated string appears in it at all, however it got there.
 *
 * That covers the two ways the gate could be defeated without anyone noticing:
 * text pasted straight into a component, and text reaching JSON-LD by a route
 * that does not read the register.
 *
 * The search runs over the same files a crawler would receive: the prerendered
 * markup and the structured data in it, plus the static files in public/ —
 * llms.txt among them, which is handed to AI crawlers verbatim.
 *
 * Usage:  npm run build && node scripts/check-commitments.mjs
 * Exit:   0 clean, 1 if any unconfirmed commitment is on the site.
 */

import fs from "node:fs";
import path from "node:path";
import { commitments, unconfirmedStrings } from "../lib/commitments.mjs";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");

/**
 * `public/` is scanned too. Nothing there passes through the register, and
 * llms.txt in particular is handed to AI crawlers verbatim — a commitment
 * copied into it would be quoted back as fact while the rendered site stayed
 * clean.
 */
const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Decode the entities React emits, so escaped text still matches. */
function decode(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

/** Tags out, whitespace collapsed — catches a claim split across elements. */
function flatten(html) {
  return decode(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function collapse(value) {
  return value.replace(/\s+/g, " ").trim();
}

/** Every file in a tree whose name matches, recursively. */
function filesUnder(dir, pattern) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full, pattern));
    else if (pattern.test(entry.name)) out.push(full);
  }
  return out;
}

if (!fs.existsSync(APP_DIR)) {
  console.error(`No build found at ${APP_DIR}. Run \`npm run build\` before this script.`);
  process.exit(1);
}

const gated = unconfirmedStrings();
const confirmedCount = commitments.filter((c) => c.confirmed).length;

/**
 * What to search for.
 *
 * Each registered string whole, plus every sentence in it of forty characters
 * or more. Matching whole strings alone would let half a gated FAQ answer be
 * pasted into a component and still pass; forty characters is long enough that
 * a sentence out of this register will not turn up by coincidence.
 */
function needles(claim) {
  const whole = collapse(claim);
  const sentences = whole
    .split(/(?<=[.!?])\s+/)
    .map(collapse)
    .filter((part) => part.length >= 40 && part !== whole);
  return [whole, ...sentences];
}

/**
 * What the site is allowed to say anyway.
 *
 * Several fallbacks are the confirmed sentence with the promise clause cut
 * out, so they share whole sentences with the gated text they replace. Those
 * sentences are on the page by design and must not be reported. Only the parts
 * of a claim that the fallback does not carry are actually gated.
 */
const rendered = [];
for (const entry of commitments) {
  const walk = (value) => {
    if (typeof value === "string") rendered.push(collapse(value));
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(entry.confirmed ? entry.text : entry.fallback);
}

const searchFor = [...new Set(gated.flatMap(needles))].filter(
  (needle) => !rendered.some((allowed) => allowed.includes(needle))
);

console.log(
  `check-commitments: ${commitments.length} registered, ${confirmedCount} confirmed, ` +
    `${commitments.length - confirmedCount} gated ` +
    `(${gated.length} strings, ${searchFor.length} phrases searched for)\n`
);

const files = [
  ...filesUnder(APP_DIR, /\.(html|body|rsc)$/),
  ...filesUnder(PUBLIC_DIR, /\.(txt|json|xml|svg|html)$/),
];
let failures = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const decoded = decode(raw);
  const flat = flatten(raw);
  const relative = path.relative(process.cwd(), file);

  for (const needle of searchFor) {
    if (decoded.includes(needle) || flat.includes(needle)) {
      failures++;
      console.error(
        `  FAIL  ${relative}\n` +
          `        renders an unconfirmed commitment: "${needle.slice(0, 90)}…"\n` +
          `        Confirm it in lib/commitments.mjs, or take the text out of the page.`
      );
    }
  }
}

console.log(
  `\ncheck-commitments: ${files.length} files scanned, ${failures} unconfirmed commitments found.`
);

if (failures) {
  console.error("\ncheck-commitments FAILED");
  process.exit(1);
}

console.log("check-commitments OK");
