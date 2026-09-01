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
  "projects.html": ["Selected Work", "OpenCinema", "Biz-Xpert"],
  "projects/opencinema.html": ["OpenCinema", "The problem", "Approach", "Outcome"],
  // Every post is drafted, so /blog is its empty state. These phrases are the
  // designed panel: the page has to read as finished, not as a list that
  // failed to load, and it has to do that with no JavaScript at all.
  "blog.html": [
    "Engineering Notes",
    "No notes published yet",
    "There is nothing to read on this page today",
    "Selected work",
    "thedevzubair@gmail.com",
  ],
  "blog/idempotency-keys.html": [
    "Idempotency keys",
    "claim before you work",
    "Upstream duplicates",
    "processed_events",
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

console.log(`\ncheck-nojs: ${checks} phrases present, ${failures} missing.`);
if (failures) {
  console.error("check-nojs FAILED");
  process.exit(1);
}
console.log("check-nojs OK");
