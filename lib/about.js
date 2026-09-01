import { site } from "./site";
import { gate } from "./commitments.mjs";

/**
 * Content for /about.
 *
 * Every row and sentence here is either verifiable from the repository and the
 * live profiles, or a description of how the work is run. Nothing asserts a
 * number.
 *
 * Two kinds of blank exist in this file and they are not the same thing:
 *
 *   `pendingFacts` and `timeline` are facts nobody has supplied yet (C1–C4 in
 *   CONTENT-REVIEW.md §1). Fill them in and they render.
 *
 *   `gate("…")` is a commitment that has been written but not confirmed. Those
 *   live in lib/commitments.mjs and are switched on there, not here.
 */

/**
 * C1–C3 — the numeric facts, waiting on confirmation.
 *
 * Set `v` on a row and it appears in the fact table on /about, in the position
 * shown below. Leave it null and the row does not render — no label, no dash,
 * no placeholder. Values are strings, written exactly as they should read on
 * the page, because they are also the fragment an AI system quotes.
 *
 * The design prototype's values are quoted in `example` for reference only.
 * They are mockup filler and must not be used.
 */
export const pendingFacts = [
  {
    ref: "C1",
    k: "Experience",
    v: null,
    example: "6 years",
    hint: "Years working professionally as an engineer, written as you would say it.",
  },
  {
    ref: "C2a",
    k: "Systems shipped",
    v: null,
    example: "34",
    hint: "How many systems you have delivered in total.",
  },
  {
    ref: "C2b",
    k: "Still in production",
    v: null,
    example: "28",
    hint: "How many of those are still running today.",
  },
  {
    ref: "C3",
    k: "Longest engagement",
    v: null,
    example: "4 years, 1 month",
    hint: "The longest single client relationship, as a duration.",
  },
];

/** Identity rows. First in the table, because the entity answer leads. */
const identityFacts = [
  { k: "Name", v: site.name },
  { k: "Role", v: site.jobTitle },
];

/** How and where the work runs. */
const workingFacts = [
  { k: "Based", v: `${site.location.locality}, ${site.location.country}` },
  { k: "Timezone", v: site.location.timezone },
  { k: "Works with", v: "Founders and agencies" },
  // "Fixed scope" is confirmed by FAQ answer 1; "fixed price" is not.
  { k: "Engagement", v: gate("about-engagement-fixed-price") },
  { k: "Email", v: site.email, href: `mailto:${site.email}` },
];

/**
 * Fact table. Keys are short because they render as a definition list.
 *
 * The C1–C3 rows sit between identity and working facts, so the numbers read
 * immediately after the name and role. Unfilled rows are dropped here rather
 * than in the page, so the page never has to know they exist.
 */
export const facts = [
  ...identityFacts,
  ...pendingFacts.filter((f) => f.v),
  ...workingFacts,
].filter((f) => f.v);

/**
 * C4 — the year-by-year timeline.
 *
 * Empty until the entries are supplied. /about renders no timeline section at
 * all while this array is empty: no heading, no placeholder, no "coming soon".
 *
 * ENTRY SHAPE — one object per year, newest first:
 *
 *   {
 *     year: "2025",
 *     title: "Biz-Xpert platform, web and mobile",
 *     body:  "One to three complete sentences, past tense, third person. What
 *             was built or what changed that year, specifically enough that it
 *             could not describe anybody else.",
 *     tags: ["Next.js", "React Native"],
 *   }
 *
 *   year   required, string. A single year ("2021") or a range ("2022–2024").
 *          Rendered verbatim, and used as the React key, so it must be unique.
 *   title  required, string. One line, no trailing full stop. Renders as <h3>.
 *   body   required, string. Complete sentences — this is the text an AI system
 *          lifts, and fragments do not survive that trip.
 *   tags   optional, array of strings. Rendered as pills. Omit rather than
 *          passing an empty array.
 *
 * Order the array newest first; nothing sorts it, so it renders exactly as
 * written.
 */
export const timeline = [];

/**
 * The stack, grouped by the kind of work it belongs to. Every entry is
 * evidenced by the services offered or by the previous site's own tech list.
 */
export const stackGroups = [
  {
    title: "Automation",
    items: [
      "n8n, self-hosted and cloud",
      "GoHighLevel workflows",
      "Webhook inboxes and queues",
      "Postgres as the ledger",
      "Retry and idempotency design",
    ],
  },
  {
    title: "Platform · GoHighLevel",
    items: [
      "API v2, agency and location scopes",
      "Marketplace apps, OAuth 2.0",
      "Custom menu-link dashboards",
      "Sub-account provisioning",
      "Snapshot and template hygiene",
    ],
  },
  {
    title: "Web",
    items: [
      "Next.js, App Router",
      "React and TypeScript",
      "Node.js and AdonisJS",
      "Postgres, MongoDB, the MERN stack",
      "Tailwind CSS",
    ],
  },
  {
    title: "Mobile",
    items: [
      "React Native and Expo",
      "Offline-first sync",
      "SQLite on device",
      "App Store and Play releases",
      "Crash reporting and OTA updates",
    ],
  },
];

/**
 * The opening paragraphs. The first two sentences have to fully answer "Who is
 * Zubair Bin Shaukat?" on their own — name, role, location, specialisms —
 * because that is the fragment an AI system lifts. Complete sentences, no
 * fragments, no pronoun-first openings.
 */
export const intro = [
  `${site.name} is a software engineer based in ${site.location.locality}, ${site.location.country}. He builds business automation systems with n8n, custom GoHighLevel dashboards and marketplace apps, web applications with Next.js and React, and cross-platform mobile applications with React Native.`,
  // Gated: the confirmed form of this paragraph says "fixed-price".
  gate("about-intro-fixed-price"),
  `He also goes by Zubyr, which is where the domain comes from.`,
];
