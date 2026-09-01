#!/usr/bin/env node
/**
 * Metadata and structure regression guard.
 *
 * Reads the prerendered HTML that `next build` wrote to .next/server/app and
 * asserts the things that are cheap to break and expensive to notice: title
 * uniqueness, description length, canonical correctness, heading hierarchy,
 * the homepage internal link graph, and byte-identity between the visible FAQ
 * and the FAQPage schema.
 *
 * It reads the built files rather than crawling a running server on purpose —
 * that is exactly the HTML a crawler receives, and it needs no port.
 *
 * Usage:  npm run build && node scripts/check-meta.mjs
 * Exit:   0 clean, 1 on any failure.
 */

import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");
const SITE_URL = "https://www.zubyr.dev";

/** Description length window. The spec asks for 150–160; 140 is the hard floor. */
const DESC_MIN = 140;
const DESC_MAX = 160;

/**
 * Route -> prerendered file. Every route the site claims to have must be here,
 * so deleting a page fails the check instead of silently shrinking the site.
 */
const ROUTES = {
  "/": "index.html",
  "/about": "about.html",
  "/services/gohighlevel": "services/gohighlevel.html",
  "/services/automation": "services/automation.html",
  "/services/web-development": "services/web-development.html",
  "/services/mobile": "services/mobile.html",
  "/projects": "projects.html",
  "/projects/opencinema": "projects/opencinema.html",
  "/projects/biz-xpert-web": "projects/biz-xpert-web.html",
  "/projects/biz-xpert-mobile": "projects/biz-xpert-mobile.html",
  "/blog": "blog.html",
  "/blog/idempotency-keys": "blog/idempotency-keys.html",
  "/contact": "contact.html",
};

/** The nine top-level paths the homepage must link to, for sitelink eligibility. */
const TOP_LEVEL = [
  "/",
  "/about",
  "/services/gohighlevel",
  "/services/automation",
  "/services/web-development",
  "/services/mobile",
  "/projects",
  "/blog",
  "/contact",
];

/**
 * Strings that must not survive anywhere in the built output: the superseded
 * email, the removed phone number, the retired Blogger domain, and the
 * non-canonical vercel.app host.
 */
const FORBIDDEN = [
  "zubairbinshaukat4455@gmail.com",
  "+92 314 87 97 500",
  "923148797500",
  "blogspot.com",
  "vercel.app",
];

/**
 * KNOWN DEVIATION — the hero.
 *
 * `/` ships four <h1> elements: HeroText renders a mobile and a desktop
 * variant (only one is ever visible), and each contains the HelloCard "Hi!"
 * badge, which is also marked up as an <h1>.
 *
 * These live in files PLAN §0.2 freezes until Phase 3, and §0.2 is stated as
 * non-negotiable, so Phase 1 left them alone rather than quietly breaking the
 * freeze. The number is pinned here so the deviation is visible and any change
 * to it — in either direction — fails this check.
 */
const KNOWN_H1_COUNTS = { "/": 4 };

let failures = 0;
let checks = 0;

function fail(route, message) {
  failures++;
  console.error(`  FAIL  ${route}  ${message}`);
}

function pass() {
  checks++;
}

function check(route, condition, message) {
  if (condition) pass();
  else fail(route, message);
}

/** Strip tags and decode the handful of entities that show up in titles. */
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

function metaContent(html, name) {
  const tag = html.match(
    new RegExp(`<meta[^>]*name="${name}"[^>]*>`, "i")
  );
  return tag ? attr(tag[0], "content") : null;
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);
  return blocks;
}

// ---------------------------------------------------------------------------

if (!fs.existsSync(APP_DIR)) {
  console.error(
    `No build found at ${APP_DIR}. Run \`npm run build\` before this script.`
  );
  process.exit(1);
}

console.log("check-meta: reading prerendered HTML from .next/server/app\n");

const titles = new Map();
const pages = new Map();

for (const [route, file] of Object.entries(ROUTES)) {
  const full = path.join(APP_DIR, file);
  if (!fs.existsSync(full)) {
    fail(route, `expected prerendered file ${file} does not exist`);
    continue;
  }
  pages.set(route, fs.readFileSync(full, "utf8"));
}

for (const [route, html] of pages) {
  // --- title -------------------------------------------------------------
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleTag ? text(titleTag[1]) : null;

  check(route, Boolean(title), "no <title>");
  if (title) {
    if (titles.has(title)) {
      fail(route, `duplicate title, also used by ${titles.get(title)}`);
    } else {
      titles.set(title, route);
      pass();
    }
  }

  // --- description -------------------------------------------------------
  const description = metaContent(html, "description");
  check(route, Boolean(description), "no meta description");
  if (description) {
    const len = description.length;
    check(
      route,
      len >= DESC_MIN && len <= DESC_MAX,
      `description is ${len} chars, want ${DESC_MIN}-${DESC_MAX}: "${description.slice(0, 70)}…"`
    );
  }

  // --- canonical ---------------------------------------------------------
  const canonicals = html.match(/<link[^>]*rel="canonical"[^>]*>/gi) || [];
  check(route, canonicals.length === 1, `${canonicals.length} canonical links, want exactly 1`);
  if (canonicals.length === 1) {
    const href = attr(canonicals[0], "href");
    const want = route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
    check(
      route,
      href === want || href === want.replace(/\/$/, ""),
      `canonical is ${href}, want ${want}`
    );
  }

  // --- headings ----------------------------------------------------------
  const h1s = html.match(/<h1[\s>]/gi) || [];
  const expectedH1 = KNOWN_H1_COUNTS[route] ?? 1;
  check(
    route,
    h1s.length === expectedH1,
    `${h1s.length} <h1> elements, want ${expectedH1}`
  );

  const levels = [...html.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
  let previous = 0;
  let skipped = null;
  for (const level of levels) {
    if (previous && level > previous + 1) {
      skipped = `h${previous} followed by h${level}`;
      break;
    }
    previous = level;
  }
  check(route, !skipped, `skipped heading level: ${skipped}`);

  // --- landmarks ---------------------------------------------------------
  const mains = html.match(/<main[\s>]/gi) || [];
  check(route, mains.length === 1, `${mains.length} <main> landmarks, want exactly 1`);
  check(route, /id="main"/.test(html), 'no id="main" for the skip link to target');
  check(route, /<footer[\s>]/i.test(html), "no <footer> landmark");
  check(route, /<nav[\s>]/i.test(html), "no <nav> landmark");
  check(route, /href="#main"/.test(html), "no skip-to-content link");

  // --- structured data ---------------------------------------------------
  for (const block of jsonLdBlocks(html)) {
    try {
      JSON.parse(block);
      pass();
    } catch (error) {
      fail(route, `unparseable JSON-LD: ${error.message}`);
    }
  }

  // --- forbidden strings -------------------------------------------------
  for (const needle of FORBIDDEN) {
    check(route, !html.includes(needle), `contains forbidden string "${needle}"`);
  }
}

// --- homepage internal link graph -----------------------------------------
{
  const home = pages.get("/");
  if (home) {
    for (const target of TOP_LEVEL) {
      const pattern =
        target === "/" ? /href="\/"/ : new RegExp(`href="${target}"`);
      check("/", pattern.test(home), `homepage does not link to ${target}`);
    }
  }
}

// --- FAQ: visible text must equal the schema, byte for byte ----------------
{
  const home = pages.get("/");
  if (home) {
    const faqBlock = jsonLdBlocks(home)
      .map((b) => JSON.parse(b))
      .find((g) => g["@type"] === "FAQPage");

    check("/", Boolean(faqBlock), "no FAQPage JSON-LD on the homepage");

    if (faqBlock) {
      const visibleQuestions = [...home.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(
        (m) => text(m[1])
      );

      for (const entry of faqBlock.mainEntity) {
        check(
          "/",
          visibleQuestions.includes(entry.name),
          `FAQ schema question is not present as visible <h3> text: "${entry.name}"`
        );
        check(
          "/",
          home.includes(
            entry.acceptedAnswer.text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/'/g, "&#x27;")
          ) || home.includes(entry.acceptedAnswer.text),
          `FAQ schema answer is not present in the visible HTML: "${entry.acceptedAnswer.text.slice(0, 60)}…"`
        );
      }
    }
  }
}

// --- sitemap and robots ----------------------------------------------------
{
  const sitemapPath = path.join(APP_DIR, "sitemap.xml.body");
  const robotsPath = path.join(APP_DIR, "robots.txt.body");

  if (fs.existsSync(sitemapPath)) {
    const xml = fs.readFileSync(sitemapPath, "utf8");
    for (const route of TOP_LEVEL) {
      const url = route === "/" ? SITE_URL : `${SITE_URL}${route}`;
      check("sitemap.xml", xml.includes(`<loc>${url}</loc>`), `missing <loc> for ${url}`);
    }
    check("sitemap.xml", !xml.includes("vercel.app"), "still lists a vercel.app URL");
  } else {
    fail("sitemap.xml", "not found in the build output");
  }

  if (fs.existsSync(robotsPath)) {
    const txt = fs.readFileSync(robotsPath, "utf8");
    for (const bot of [
      "GPTBot",
      "ClaudeBot",
      "PerplexityBot",
      "Google-Extended",
      "OAI-SearchBot",
      "Applebot-Extended",
    ]) {
      check("robots.txt", txt.includes(bot), `does not name ${bot}`);
    }
    check("robots.txt", txt.includes(`${SITE_URL}/sitemap.xml`), "wrong sitemap URL");
  } else {
    fail("robots.txt", "not found in the build output");
  }

  check(
    "robots.txt",
    !fs.existsSync(path.join(process.cwd(), "app", "robots.txt")),
    "a static app/robots.txt still exists alongside app/robots.js"
  );
}

// ---------------------------------------------------------------------------

console.log(`\n${checks} checks passed, ${failures} failed.`);

if (failures) {
  console.error("\ncheck-meta FAILED");
  process.exit(1);
}

console.log("check-meta OK");
