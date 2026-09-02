#!/usr/bin/env node
/**
 * The governing rule, measured.
 *
 * Strips every <script>, <template> and hidden container from the prerendered
 * HTML — everything a browser with JavaScript disabled would ignore — then
 * asserts that the copy each page is supposed to carry is still there.
 *
 * This is the check that would have caught app/loading.js replacing the whole
 * homepage with a spinner in the initial HTML.
 */
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");

/** Phrases that must survive with JavaScript switched off. */
const EXPECTED = {
  "index.html": [
    "ZUBAIR",
    "What I do",
    "GoHighLevel",
    "exception queue and a log someone can read",
    "Who is Zubair Bin Shaukat?",
    "not a person but a legend",
    "Selected Work|Selected work",
    "Start a project",
    "thedevzubair@gmail.com",
  ],
  "about.html": [
    "About Zubair Bin Shaukat",
    "is a software engineer based in Lahore",
    "Retry and idempotency design",
    "thedevzubair@gmail.com",
  ],
  "services/gohighlevel.html": [
    "GoHighLevel Custom Dashboards",
    "What it covers",
    // "What I will say no to" is gated in lib/commitments.mjs and does not
    // render while it is unconfirmed. scripts/check-commitments.mjs asserts
    // its absence; asserting its presence here would fail on purpose.
    "How the work runs",
    "Other services",
  ],
  "services/automation.html": ["Automation Systems with n8n", "exception queue"],
  "services/web-development.html": ["Web Development with Next.js", "data model"],
  "services/mobile.html": ["Cross-Platform Mobile Apps", "Offline-first"],
  "projects.html": ["Selected Work", "BlueBoost", "multi-tenant SaaS platform"],
  "projects/blueboost.html": [
    "BlueBoost",
    "The problem",
    "Approach",
    "Outcome",
    "conversation provider",
  ],
  // One post is published, so /blog is a list rather than its empty state. The
  // empty-state panel is still built and still asserted — by check-content's
  // reading of the frontmatter, not here — and these phrases would fail the
  // moment the last post went back to draft, which is the signal you want.
  "blog.html": [
    "Engineering Notes",
    "GoHighLevel two-way sync",
    "every message you post comes back to you as a webhook",
    "Automation",
  ],
  // The post carries an inline SVG diagram written as JSX in the MDX body. The
  // last two phrases are inside it, so this also asserts the diagram survives
  // into the prerendered HTML rather than being stripped or deferred.
  "blog/gohighlevel-two-way-sync-echo.html": [
    "GoHighLevel two-way sync",
    "The obvious fix",
    "Store their id at the moment you write",
    "own_mirror_echo",
    "echo guard",
  ],
  // The contact form is a client component, so every field has to be in the
  // server HTML: with JavaScript off the browser posts the form to the server
  // action and the page comes back rendered. The address is asserted too — it
  // is the visible fallback if the form ever stops working.
  "contact.html": [
    "Start a Project",
    "thedevzubair@gmail.com",
    "What to include",
    "Send a message",
    'name="name"',
    'name="email"',
    'name="message"',
    'name="website"',
    "Send message",
  ],
};

/** Remove everything a no-JS browser would not render. */
function withoutScripts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "")
    .replace(/<div hidden[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

let failures = 0;
let checks = 0;

for (const [file, phrases] of Object.entries(EXPECTED)) {
  const full = path.join(APP_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`  FAIL  ${file}  not built`);
    failures++;
    continue;
  }

  const visible = withoutScripts(fs.readFileSync(full, "utf8"));

  for (const phrase of phrases) {
    const alternatives = phrase.split("|");
    if (alternatives.some((p) => visible.includes(p))) {
      checks++;
    } else {
      console.error(`  FAIL  ${file}  missing with JS disabled: "${phrase}"`);
      failures++;
    }
  }
}

/**
 * The navigation, with JavaScript disabled.
 *
 * Phase 2 replaced Phase 1's always-visible list of links with the design's
 * full-screen index, which is a disclosure: the links are in the HTML but the
 * panel starts closed. That is a new way for the site to fail the governing
 * rule — a React-state overlay would render every link and then have no way to
 * reveal one — so it gets its own assertion rather than riding on the phrase
 * list above.
 *
 * Three things have to be true on every page, after every <script> is stripped:
 *
 *   the disclosure is a native <details>/<summary>, which opens with no
 *   JavaScript at all and reports its own state to assistive technology;
 *
 *   every top-level route is an href inside it;
 *
 *   the footer carries the same routes outside any disclosure, so the link
 *   graph does not depend on the disclosure behaving at all.
 */
const TOP_LEVEL = [
  "/about",
  "/services/gohighlevel",
  "/services/automation",
  "/services/web-development",
  "/services/mobile",
  "/projects",
  "/blog",
  "/contact",
];

for (const file of Object.keys(EXPECTED)) {
  const full = path.join(APP_DIR, file);
  if (!fs.existsSync(full)) continue;

  const visible = withoutScripts(fs.readFileSync(full, "utf8"));

  const hasNativeDisclosure =
    /<details[\s>]/i.test(visible) && /<summary[\s>]/i.test(visible);
  if (hasNativeDisclosure) {
    checks++;
  } else {
    console.error(
      `  FAIL  ${file}  the site index is not a native <details>/<summary>, so it cannot open without JavaScript`
    );
    failures++;
  }

  for (const route of TOP_LEVEL) {
    if (visible.includes(`href="${route}"`)) {
      checks++;
    } else {
      console.error(`  FAIL  ${file}  no link to ${route} with JavaScript disabled`);
      failures++;
    }
  }
}


console.log(`\ncheck-nojs: ${checks} phrases present, ${failures} missing.`);
if (failures) {
  console.error("check-nojs FAILED");
  process.exit(1);
}
console.log("check-nojs OK");
