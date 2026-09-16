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
 * Title length window, measured decoded, the same way `text()` measures a
 * description and the same way a search engine counts one.
 *
 * The floor is 30 because Bing's site scan flagged three of these as "title
 * too short" at 25–29 characters — "Blog — Zubair Bin Shaukat" described the
 * brand and nothing about the page. The ceiling is 60, which is roughly where
 * Google stops rendering and starts rewriting.
 *
 * A post title is prose written by a human and gets 70: its words are the
 * page, and truncating one to fit a template would be the wrong trade.
 */
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const POST_TITLE_MAX = 70;


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
  "/projects/blueboost": "projects/blueboost.html",
  "/blog": "blog.html",
  "/blog/gohighlevel-two-way-sync-echo": "blog/gohighlevel-two-way-sync-echo.html",
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
 * CLOSED IN PHASE 3 — the hero's four <h1> elements.
 *
 * `/` used to ship four: HeroText renders a mobile and a desktop variant, only
 * one of which is ever visible, and each contained the HelloCard "Hi!" badge,
 * which was also marked up as an <h1>. They lived in files PLAN §0.2 froze
 * until Phase 3, so Phase 1 pinned the number here rather than quietly
 * breaking the freeze, and Phase 2 inherited the pin.
 *
 * §0.2 lifts in Phase 3. The badge is a <p>, the desktop lockup is a <p>, and
 * the heading is the mobile variant's — the one a mobile-first crawl renders.
 * Every route now wants exactly one, so there is no deviation left to record
 * and the table is empty rather than deleted: an empty exception list states
 * that there are no exceptions, where no list at all only states that nobody
 * wrote one.
 */
const KNOWN_H1_COUNTS = {};

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

/**
 * Open Graph tags carry `property`, not `name`. They were never read here
 * before, which is how every inner page came to ship the homepage's og:title,
 * og:description and og:url for as long as it did — nothing was looking.
 */
function ogContent(html, property) {
  const tag = html.match(
    new RegExp(`<meta[^>]*property="${property}"[^>]*>`, "i")
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
  /*
    Exactly one. Two <title>s is not a style problem: Bing reported this site
    as having "2 identical titles", and the second one came from a page that
    rendered its own <head> content inside the layout's. Whichever a crawler
    picks, it picked without being told which was meant.

    <svg> is cut out first. An inline diagram's <title> is the SVG element of
    that name — the accessible name a screen reader announces for the graphic,
    nothing to do with the document's — and this post's echo diagram carries
    one. Counting it would have failed a correct page.
  */
  const withoutSvg = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  const titleTags = withoutSvg.match(/<title[^>]*>[\s\S]*?<\/title>/gi) || [];
  check(route, titleTags.length === 1, `${titleTags.length} <title> elements, want exactly 1`);

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

    // Decoded, for the same reason the description is. See the note below.
    const max = route.startsWith("/blog/") ? POST_TITLE_MAX : TITLE_MAX;
    check(
      route,
      title.length >= TITLE_MIN && title.length <= max,
      `title is ${title.length} chars, want ${TITLE_MIN}-${max}: "${title}"`
    );

    /*
      The brand must appear once, not twice. A page that sets a title already
      ending in the name and forgets `absolute` gets the layout's template
      appended on top of it, and the failure is invisible in the source.
    */
    const brandHits = title.split("Zubair Bin Shaukat").length - 1;
    check(route, brandHits <= 1, `title names the brand ${brandHits} times: "${title}"`);
  }

  // --- robots ------------------------------------------------------------
  /*
    Exactly one. Bing's scan found a page emitting both `index,follow` and
    `noindex` — two directives, opposite meanings, one crawler having to guess.
  */
  const robotsTags = html.match(/<meta[^>]*name="robots"[^>]*>/gi) || [];
  check(
    route,
    robotsTags.length === 1,
    `${robotsTags.length} <meta name="robots"> tags, want exactly 1`
  );

  // --- description -------------------------------------------------------
  /*
    `text()` before measuring, and it matters.

    `metaContent` returns the raw attribute, where an apostrophe is `&#x27;` —
    six characters where a reader and a search engine both see one. Measured
    raw, this post's description came to 163 against a 160 ceiling and failed;
    decoded it is 153 and comfortably inside the window. Two apostrophes were
    the entire overrun.

    Nothing here was loosened to make that pass. The window is the length
    Google truncates a snippet at, Google counts the decoded string, and this
    check now counts the same thing it claims to. Every description that
    happened to be apostrophe-free was already being measured correctly, which
    is why the bug survived to the fourth piece of content.
  */
  const description = text(metaContent(html, "description") || "") || null;
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
  let canonicalHref = null;
  if (canonicals.length === 1) {
    canonicalHref = attr(canonicals[0], "href");
    const want = route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
    check(
      route,
      canonicalHref === want || canonicalHref === want.replace(/\/$/, ""),
      `canonical is ${canonicalHref}, want ${want}`
    );
  }

  // --- Open Graph must describe THIS page --------------------------------
  /*
    The regression this exists to catch: Next shallow-merges `openGraph`, so a
    page that sets none inherits the layout's entire object. Every inner page
    was shipping the homepage's og:title, og:description and og:url next to its
    own <title> and canonical — /about told every share card and every AI
    crawler that it was the homepage. Three equalities close it, and og:url is
    the one with no fallback of its own: Next does not derive it from the
    canonical, so a page that forgets it inherits the root's instead.
  */
  const ogTitle = text(ogContent(html, "og:title") || "") || null;
  check(route, Boolean(ogTitle), "no og:title");
  if (ogTitle && title) {
    check(route, ogTitle === title, `og:title "${ogTitle}" !== <title> "${title}"`);
  }

  const ogDescription = text(ogContent(html, "og:description") || "") || null;
  check(route, Boolean(ogDescription), "no og:description");
  if (ogDescription && description) {
    check(
      route,
      ogDescription === description,
      `og:description differs from meta description: "${ogDescription.slice(0, 60)}…"`
    );
  }

  const ogUrl = ogContent(html, "og:url");
  check(route, Boolean(ogUrl), "no og:url");
  if (ogUrl && canonicalHref) {
    const same = ogUrl.replace(/\/$/, "") === canonicalHref.replace(/\/$/, "");
    check(route, same, `og:url is ${ogUrl}, canonical is ${canonicalHref}`);
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

    /*
      Every <lastmod> is a real, written-down date.

      `lastModified: new Date()` stamped the build time on all eleven URLs, and
      Google printed one of them — "01-Sept-2026" — on the Contact snippet.

      What actually separates a written date from a build clock is precision,
      not age. A date written in lib/site.js or in frontmatter is `2026-09-16`;
      `new Date()` serialises to `2026-09-16T14:22:07.314Z`. So the test is two
      parts: the value must parse, and it must carry no time of day.

      A plain "within 24 hours of now" window was the first attempt and it is
      wrong by construction — the day a route's date is bumped is the day it
      equals today, and the check would fail the correct change and pass
      tomorrow for no reason anybody could act on. Requiring midnight-precision
      says the same thing without the false positive: a build clock cannot
      produce it, and the start-of-day bound below still rejects a future date.
    */
    const startOfToday = Date.parse(new Date().toISOString().slice(0, 10));
    const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
      loc: (m[1].match(/<loc>([^<]*)<\/loc>/) || [])[1],
      lastmod: (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1],
    }));

    check("sitemap.xml", entries.length > 0, "no <url> entries");

    for (const entry of entries) {
      const parsed = entry.lastmod ? Date.parse(entry.lastmod) : NaN;
      check(
        "sitemap.xml",
        Number.isFinite(parsed),
        `${entry.loc} has no valid <lastmod> (got "${entry.lastmod}")`
      );
      if (Number.isFinite(parsed)) {
        check(
          "sitemap.xml",
          /^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod),
          `${entry.loc} lastmod ${entry.lastmod} carries a time of day — build-clock date?`
        );
        check(
          "sitemap.xml",
          parsed <= startOfToday,
          `${entry.loc} lastmod ${entry.lastmod} is in the future`
        );
      }
    }

    /*
      And for the two content routes it is the frontmatter's date, not some
      other real-looking one. Read straight out of the MDX rather than through
      lib/, which is written for the bundler's "@/" alias and not for node.
    */
    for (const [collection, prefix] of [
      ["projects", "/projects/"],
      ["blog", "/blog/"],
    ]) {
      const dir = path.join(process.cwd(), "content", collection);
      if (!fs.existsSync(dir)) continue;

      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
        const slug = file.replace(/\.mdx$/, "");
        const entry = entries.find((e) => e.loc === `${SITE_URL}${prefix}${slug}`);
        if (!entry) continue; // a draft, correctly absent from the sitemap

        const source = fs.readFileSync(path.join(dir, file), "utf8");
        const frontmatter = (source.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || "";
        const field = (name) =>
          (frontmatter.match(new RegExp(`^${name}:\\s*"?([0-9-]+)"?`, "m")) || [])[1];
        const want = field("updatedAt") || field("publishedAt");

        check(
          "sitemap.xml",
          Boolean(want) && entry.lastmod.slice(0, 10) === want,
          `${entry.loc} lastmod ${entry.lastmod} does not match frontmatter ${want}`
        );
      }
    }
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
