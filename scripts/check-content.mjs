#!/usr/bin/env node
/**
 * Frontmatter guard for content/.
 *
 * The three case studies carry a `year`, a `publishedAt` and an `updatedAt`
 * that nobody has checked against anything — they were set to plausible values
 * so the routes and the schema could be exercised. Each is marked `# UNVERIFIED`
 * inline, and each file carries `datesVerified: false`.
 *
 * A comment cannot stop anything being published, because turning `draft: true`
 * into `draft: false` is a one-word change and the comment sits three lines
 * away. This check is what makes that word insufficient: publish a file whose
 * dates are still flagged and the build fails, naming the file and the fields.
 *
 * It runs before `next build` rather than after it, because it reads source
 * files rather than output and there is no reason to spend a build on content
 * that is going to fail.
 *
 * Usage:  node scripts/check-content.mjs
 * Exit:   0 clean, 1 on any failure.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** The marker that says a frontmatter value is a placeholder. */
const UNVERIFIED = "UNVERIFIED";

/** Fields every entry in a collection must declare. */
const REQUIRED = {
  projects: ["title", "slug", "summary", "publishedAt", "draft", "datesVerified"],
  blog: ["title", "slug", "summary", "publishedAt", "draft"],
};

let failures = 0;
let checks = 0;

function fail(file, message) {
  failures++;
  console.error(`  FAIL  ${file}\n        ${message}`);
}

function pass() {
  checks++;
}

function check(file, condition, message) {
  if (condition) pass();
  else fail(file, message);
}

if (!fs.existsSync(CONTENT_ROOT)) {
  console.error(`No content directory at ${CONTENT_ROOT}.`);
  process.exit(1);
}

console.log("check-content: reading frontmatter from content/\n");

for (const collection of Object.keys(REQUIRED)) {
  const dir = path.join(CONTENT_ROOT, collection);
  if (!fs.existsSync(dir)) continue;

  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const file = path.join("content", collection, name);
    const raw = fs.readFileSync(path.join(dir, name), "utf8");
    const { data } = matter(raw);

    // The raw frontmatter block, so the inline markers are visible. YAML
    // comments are stripped by the parser and never reach `data`.
    const frontmatter = raw.split(/^---\s*$/m)[1] || "";
    const flagged = frontmatter.includes(UNVERIFIED);

    for (const key of REQUIRED[collection]) {
      check(file, key in data, `frontmatter is missing required field "${key}"`);
    }

    check(
      file,
      typeof data.draft === "boolean",
      `"draft" must be true or false, got ${JSON.stringify(data.draft)}`
    );

    check(
      file,
      data.slug === name.replace(/\.mdx$/, ""),
      `"slug" is "${data.slug}" but the file is ${name}`
    );

    const published = data.draft === false;

    // --- the guard this file exists for --------------------------------
    if (collection === "projects") {
      check(
        file,
        !(published && data.datesVerified !== true),
        `draft is false but datesVerified is ${JSON.stringify(data.datesVerified)}. ` +
          `year, publishedAt and updatedAt are still unconfirmed placeholders — check them ` +
          `against the real project, remove the ${UNVERIFIED} markers, then set ` +
          `datesVerified: true.`
      );
    }

    check(
      file,
      !(published && flagged),
      `draft is false but the frontmatter still carries a "${UNVERIFIED}" marker. ` +
        `Correct the flagged values and delete the marker before publishing.`
    );

    // A stale marker on a file that claims to be verified is the same bug in
    // the other direction: one of the two is lying.
    check(
      file,
      !(data.datesVerified === true && flagged),
      `datesVerified is true but a "${UNVERIFIED}" marker is still in the frontmatter. ` +
        `Delete the marker, or set datesVerified back to false.`
    );

    const status = published ? "published" : "draft";
    const dates =
      collection === "projects"
        ? data.datesVerified === true
          ? "dates verified"
          : "dates unverified"
        : "";
    console.log(`  ${file.padEnd(44)} ${status}${dates ? `, ${dates}` : ""}`);
  }
}

console.log(`\ncheck-content: ${checks} checks passed, ${failures} failed.`);

if (failures) {
  console.error("\ncheck-content FAILED");
  process.exit(1);
}

console.log("check-content OK");
