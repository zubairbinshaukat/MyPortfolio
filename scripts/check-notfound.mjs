#!/usr/bin/env node
/**
 * The 404 page, measured.
 *
 * Before `app/not-found.js` existed, an unmatched URL returned a 404 whose
 * HTML carried two <title> elements — the root layout's homepage title and
 * Next's own "404: This page could not be found." — the homepage meta
 * description, and two contradicting robots directives (`index, follow` from
 * the root layout, `noindex` injected by Next). Bing's site scan reported that
 * as "2 identical titles / 2 identical descriptions / 2 pages with
 * insufficient content", which is the whole of that finding.
 *
 * That regression is invisible: the response code stays 404, every page in
 * scripts/check-meta.mjs's route table keeps passing, and nothing in the build
 * output complains. Deleting `app/not-found.js`, or letting the root layout's
 * robots block win again, would put it straight back. This script is the guard
 * against that.
 *
 * It also asserts the four legacy draft redirects in next.config.mjs, because
 * they are part of the same fix: those URLs were crawled while served noindex
 * and then deleted, so they need a permanent destination rather than a 404.
 *
 * Like check-meta, it reads the HTML `next build` wrote rather than crawling a
 * server — that is exactly the markup a crawler receives, and it needs no port.
 *
 * Usage:  npm run build && node scripts/check-notfound.mjs
 * Exit:   0 clean, 1 on any failure.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");

/**
 * The 404's prerendered file. Next names the root not-found route `_not-found`
 * — the leading underscore keeps it out of the URL space — so the build writes
 * `.next/server/app/_not-found.html`. The alternatives are listed rather than
 * hard-coded to one name so a rename in a future Next release fails with a
 * useful message instead of "file missing".
 */
const CANDIDATES = ["_not-found.html", "not-found.html", "404.html"];

const EXPECTED_TITLE = "Page Not Found - Zubair Bin Shaukat";

/** Same window as check-meta: the spec asks 150–160, 140 is the hard floor. */
const DESC_MIN = 140;
const DESC_MAX = 160;

/**
 * The opening of the homepage description, from lib/site.js. Its presence on
 * the 404 is the exact symptom Bing flagged, so it is checked as a string
 * rather than by comparing to the import — the point is that this sentence
 * must not be on this page, whatever lib/site.js currently says.
 */
const HOME_DESCRIPTION_FRAGMENT =
  "Zubair Bin Shaukat is a software engineer in Lahore, Pakistan building automation systems";

/** Legacy draft URLs deleted in 6d34286. Source -> destination. */
const LEGACY_REDIRECTS = {
  "/projects/biz-xpert-mobile": "/projects",
  "/projects/biz-xpert-web": "/projects",
  "/projects/opencinema": "/projects",
  "/blog/idempotency-keys": "/blog",
};

let failures = 0;
let checks = 0;

function fail(scope, message) {
  failures++;
  console.error(`  FAIL  ${scope}  ${message}`);
}

function check(scope, condition, message) {
  if (condition) checks++;
  else fail(scope, message);
}

/** Strip tags and decode the entities that show up in titles and descriptions. */
function text(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim();
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------

if (!fs.existsSync(APP_DIR)) {
  console.error(
    `No build found at ${APP_DIR}. Run \`npm run build\` before this script.`
  );
  process.exit(1);
}

console.log("check-notfound: reading the prerendered 404 from .next/server/app\n");

const file = CANDIDATES.find((name) => fs.existsSync(path.join(APP_DIR, name)));

if (!file) {
  console.error(
    `No prerendered 404 found. Looked for ${CANDIDATES.join(", ")} in ${APP_DIR}.\n` +
      "If Next has renamed the route, add the new name to CANDIDATES."
  );
  process.exit(1);
}

const html = fs.readFileSync(path.join(APP_DIR, file), "utf8");
const scope = `404 (${file})`;

// --- title -----------------------------------------------------------------
{
  const tags = html.match(/<title[^>]*>[\s\S]*?<\/title>/gi) || [];
  check(
    scope,
    tags.length === 1,
    `${tags.length} <title> elements, want exactly 1 — this is the Bing "2 identical titles" bug`
  );
  if (tags.length) {
    const titles = tags.map((t) => text(t.replace(/<\/?title[^>]*>/gi, "")));
    check(
      scope,
      titles[0] === EXPECTED_TITLE,
      `title is "${titles[0]}", want "${EXPECTED_TITLE}"`
    );
  }
}

// --- robots ----------------------------------------------------------------
/*
  Not "exactly one", and the difference is measured rather than conceded.

  Next injects `<meta name="robots" content="noindex">` for any 404 response,
  and a page's own metadata renders alongside that injection, not instead of
  it. So the built 404 always carries two robots tags and no configuration
  makes it carry one.

  What the page controls is what the second one says. With `robots` removed
  from app/not-found.js the second tag is the root layout's `index, follow`,
  plus its googlebot line — a page telling crawlers both to index it and not
  to, which is the half of the Bing finding that survives having a custom 404
  at all. So the assertion is that EVERY robots directive on the page says
  noindex. Two tags that agree are harmless; one that disagrees is the bug.
*/
{
  const tags = html.match(/<meta[^>]*name="(robots|googlebot)"[^>]*>/gi) || [];
  check(scope, tags.length > 0, "no robots meta at all");

  for (const tag of tags) {
    const name = attr(tag, "name");
    const content = (attr(tag, "content") || "").toLowerCase();
    check(
      scope,
      content.includes("noindex"),
      `<meta name="${name}" content="${content}"> does not say noindex — the root layout's indexing directives are leaking onto the 404`
    );
  }
}

// --- description -----------------------------------------------------------
{
  const tags = html.match(/<meta[^>]*name="description"[^>]*>/gi) || [];
  check(scope, tags.length === 1, `${tags.length} meta descriptions, want exactly 1`);
  if (tags.length) {
    const description = text(attr(tags[0], "content") || "");
    const len = description.length;
    check(
      scope,
      len >= DESC_MIN && len <= DESC_MAX,
      `description is ${len} chars, want ${DESC_MIN}-${DESC_MAX}: "${description.slice(0, 70)}…"`
    );
  }
}

// --- the homepage description must not be here -----------------------------
check(
  scope,
  !html.includes(HOME_DESCRIPTION_FRAGMENT),
  "carries the homepage description — the root layout's description is leaking onto the 404"
);

// --- structure -------------------------------------------------------------
{
  const h1s = html.match(/<h1[\s>]/gi) || [];
  check(scope, h1s.length === 1, `${h1s.length} <h1> elements, want exactly 1`);

  const mains = html.match(/<main[\s>]/gi) || [];
  check(scope, mains.length === 1, `${mains.length} <main> landmarks, want exactly 1`);
  check(scope, /<main[^>]*id="main"/i.test(html), 'no <main id="main"> for the skip link to target');
}

// --- it must lead somewhere ------------------------------------------------
for (const target of ["/", "/projects"]) {
  const pattern = target === "/" ? /href="\/"/ : new RegExp(`href="${target}"`);
  check(scope, pattern.test(html), `does not link to ${target}`);
}

// --- there must be no canonical --------------------------------------------
{
  const canonicals = html.match(/<link[^>]*rel="canonical"[^>]*>/gi) || [];
  check(
    scope,
    canonicals.length === 0,
    `${canonicals.length} canonical links, want 0 — a 404 has no canonical URL`
  );
}

// --- legacy draft redirects ------------------------------------------------
{
  const configPath = path.join(process.cwd(), "next.config.mjs");
  const { default: config } = await import(pathToFileURL(configPath).href);
  const rules = typeof config.redirects === "function" ? await config.redirects() : [];

  for (const [source, destination] of Object.entries(LEGACY_REDIRECTS)) {
    const rule = rules.find((r) => r.source === source);
    check("next.config.mjs", Boolean(rule), `no redirect for ${source}`);
    if (rule) {
      check(
        "next.config.mjs",
        rule.destination === destination,
        `${source} redirects to ${rule.destination}, want ${destination}`
      );
      check(
        "next.config.mjs",
        rule.permanent === true,
        `${source} is not permanent — a deleted, already-crawled URL wants a 308`
      );
    }
  }
}

// ---------------------------------------------------------------------------

console.log(`\n${checks} checks passed, ${failures} failed.`);

if (failures) {
  console.error("\ncheck-notfound FAILED");
  process.exit(1);
}

console.log("check-notfound OK");
