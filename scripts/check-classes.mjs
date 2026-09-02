#!/usr/bin/env node
/**
 * Every Tailwind class written in the source must exist in the built CSS.
 *
 * Tailwind fails silently. A class it cannot generate a rule for is simply
 * absent from the stylesheet — no warning at build time, no error in the
 * console, nothing in the page except an element that quietly does not have
 * the style you wrote. Phase 2 shipped three of them before this existed:
 * `bg-accent/85` and `text-accent/55`, where the opacity modifier cannot apply
 * to a colour declared as a bare `var(--c-accent)`, so the bullet points and
 * the testimonial quote marks rendered with no colour at all. A screenshot
 * caught it; nothing else would have.
 *
 * This closes that gap. It scans every `className` in app/ and components/,
 * collects the static class names, escapes each one the way Tailwind escapes
 * selectors, and asserts the escaped form appears in the generated CSS.
 *
 * It reads the awkward forms too, not only `className="…"`: template literals,
 * ternaries, `cn()` calls, and expressions nested inside a template's `${…}`.
 * Reading only the simple form would be worse than useless — it would report a
 * clean run while the classes most likely to be wrong, the ones written inside
 * an expression, went unchecked.
 *
 * WHAT IT CANNOT SEE
 *
 * A class assembled at runtime — `text-${size}` — is invisible to it, and
 * invisible to Tailwind for the same reason, which is why the Tailwind docs
 * say not to build class names that way.
 *
 * WHAT IS ALLOWED TO PRODUCE NO CSS
 *
 * `group` and `peer`, and their named forms like `group/band`, are hooks for
 * `group-*`/`peer-*` variants and generate nothing themselves. Everything else
 * that is allowed to be ruleless is listed by name below, so adding one is a
 * decision rather than an accident.
 *
 * Usage:  npm run build && node scripts/check-classes.mjs
 * Exit:   0 clean, 1 if any class produced no CSS.
 */

import fs from "node:fs";
import path from "node:path";

const SRC_DIRS = ["app", "components"];
const CSS_DIR = path.join(process.cwd(), ".next", "static", "chunks");

/**
 * Markers that intentionally generate no rule of their own.
 *
 * `group` and `peer` — and their named forms, `group/band` — exist for other
 * selectors to reference. The rest are classes app/globals.css defines by hand
 * rather than through Tailwind.
 */
const NO_RULE = new Set(["dark", "dot-grid", "heading-anchor"]);
const isMarker = (name) => /^(group|peer)(\/[\w-]+)?$/.test(name);

if (!fs.existsSync(CSS_DIR)) {
  console.error(`No build found at ${CSS_DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

const css = fs
  .readdirSync(CSS_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => fs.readFileSync(path.join(CSS_DIR, f), "utf8"))
  .join("\n");

if (!css) {
  console.error(`No CSS found in ${CSS_DIR}.`);
  process.exit(1);
}

function sourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Tailwind escapes every character in a selector that CSS does not allow bare.
 * The set below covers what the classes in this project use: brackets, slashes,
 * colons, dots, percent signs, parentheses, quotes, commas and hashes.
 */
function escapeClass(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, (ch) => "\\" + ch);
}

/**
 * Every string literal inside a `className` value.
 *
 * `className="…"` is the easy case. The rest are not: a className can be a
 * template literal, a ternary picking between two strings, or a `cn()` call
 * with several. Reading only the simple form is worse than useless, because it
 * reports a clean run while the classes most likely to be wrong — the ones
 * someone wrote inside an expression — go unchecked.
 *
 * So this takes the whole value after `className=`, balanced to its closing
 * quote or brace, and pulls every double-quoted and backticked literal out of
 * it. Scanned over the whole file rather than line by line, because a long
 * className wraps.
 */
function scanExpression(text, emit) {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < text.length && text[j] !== ch) {
        if (text[j] === "\\") j++;
        j++;
      }
      emit(text.slice(i + 1, j));
      i = j;
      continue;
    }

    if (ch !== "`") continue;

    // A template literal is static chunks with expressions between them. The
    // chunks are class names; each `${…}` is another expression to walk, so a
    // ternary inside one is read rather than shredded into "index", "===", "0".
    let j = i + 1;
    let chunk = "";
    while (j < text.length && text[j] !== "`") {
      if (text[j] === "\\") {
        chunk += text.slice(j, j + 2);
        j += 2;
        continue;
      }
      if (text[j] === "$" && text[j + 1] === "{") {
        emit(chunk);
        chunk = "";
        let depth = 0;
        let k = j + 1;
        for (; k < text.length; k++) {
          if (text[k] === "{") depth++;
          else if (text[k] === "}") {
            depth--;
            if (depth === 0) break;
          }
        }
        scanExpression(text.slice(j + 2, k), emit);
        j = k + 1;
        continue;
      }
      chunk += text[j];
      j++;
    }
    emit(chunk);
    i = j;
  }
}

function classNameLiterals(source) {
  const out = [];
  const re = /className=/g;
  let match;

  while ((match = re.exec(source))) {
    let i = match.index + match[0].length;

    if (source[i] === '"') {
      const end = source.indexOf('"', i + 1);
      if (end === -1) continue;
      out.push({ value: source.slice(i + 1, end), index: i });
      continue;
    }

    if (source[i] !== "{") continue;

    // Balance the braces so a nested object or template does not end it early.
    let depth = 0;
    const start = i;
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }

    scanExpression(source.slice(start + 1, i), (value) =>
      out.push({ value, index: start })
    );
  }

  return out;
}

const found = new Map(); // class -> [file:line]

for (const dir of SRC_DIRS) {
  for (const file of sourceFiles(dir)) {
    const source = fs.readFileSync(file, "utf8");

    for (const { value, index } of classNameLiterals(source)) {
      const line = source.slice(0, index).split("\n").length;
      for (const raw of value.split(/\s+/)) {
        const name = raw.trim();
        // Anything left holding an interpolation is assembled at runtime, and
        // is invisible to Tailwind for exactly the same reason it is invisible
        // here — which is why the Tailwind docs say not to build class names
        // that way.
        if (!name || name.includes("${")) continue;
        if (!found.has(name)) found.set(name, []);
        found.get(name).push(`${file}:${line}`);
      }
    }
  }
}

let missing = 0;

for (const [name, locations] of [...found].sort()) {
  if (NO_RULE.has(name) || isMarker(name)) continue;

  const escaped = escapeClass(name);
  // A rule can be `.name{`, `.name:hover`, `.name>`, `.name .child`, or part of
  // a compound selector, so the class is matched followed by any character CSS
  // uses to end a class name.
  const present =
    css.includes("." + escaped + "{") ||
    css.includes("." + escaped + ":") ||
    css.includes("." + escaped + " ") ||
    css.includes("." + escaped + ",") ||
    css.includes("." + escaped + ">") ||
    css.includes("." + escaped + "+") ||
    css.includes("." + escaped + "~") ||
    css.includes("." + escaped + ".");

  if (!present) {
    missing++;
    console.error(`  MISSING  "${name}"  produced no CSS`);
    console.error(`           ${[...new Set(locations)].slice(0, 3).join(", ")}`);
  }
}

console.log(`\ncheck-classes: ${found.size} static classes, ${missing} with no rule.`);

if (missing) {
  console.error("\ncheck-classes FAILED");
  process.exit(1);
}

console.log("check-classes OK");
