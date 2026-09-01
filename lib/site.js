/**
 * Single source of truth for every fact about the site and its owner.
 *
 * Nothing in this file may be duplicated elsewhere. Page metadata, the footer,
 * the contact page and the JSON-LD graph all import from here, which is what
 * keeps the entity consistent across the site — the thing §5.4 of
 * seo-implementation.md warns splits your identity when it drifts.
 */

import { gate } from "./commitments.mjs";

export const SITE_URL = "https://www.zubyr.dev";

export const site = {
  url: SITE_URL,
  name: "Zubair Bin Shaukat",
  alternateName: ["Zubyr", "Zubair Shaukat"],
  firstName: "Zubair",
  jobTitle: "Software Engineer",

  email: "thedevzubair@gmail.com",

  location: {
    locality: "Lahore",
    region: "Punjab",
    country: "Pakistan",
    countryCode: "PK",
    timezone: "UTC+5",
  },

  tagline: "Software Engineer & Problem Solver",

  /**
   * The one-sentence answer to "who is this". Used as the root meta
   * description and as the Person.description in JSON-LD, so it is written to
   * read correctly in both a search result and a machine-read fact sheet.
   */
  description:
    "Zubair Bin Shaukat is a software engineer in Lahore, Pakistan building automation systems, GoHighLevel solutions, web and mobile applications.",

  shortDescription:
    "Automation systems, GoHighLevel platforms, web and mobile development.",

  /**
   * Feeds Person.knowsAbout. Order is deliberate: the specialisms Google has
   * the least competition on come first.
   */
  knowsAbout: [
    "GoHighLevel",
    "n8n",
    "Workflow Automation",
    "Next.js",
    "React",
    "React Native",
    "Node.js",
    "AdonisJS",
    "TypeScript",
    "Python",
    "MERN",
  ],

  /**
   * These URLs are also the Person.sameAs array. Each one must be written in
   * exactly the form the site links to it, and each profile must link back —
   * a one-way sameAs claim is worth very little.
   *
   * Deliberately absent: Blogger (retired, see PLAN §1) and Facebook (not part
   * of the entity set being consolidated).
   */
  socials: [
    { label: "GitHub", handle: "zubairbinshaukat", url: "https://github.com/zubairbinshaukat" },
    { label: "LinkedIn", handle: "zubairbinshaukat", url: "https://www.linkedin.com/in/zubairbinshaukat" },
    { label: "X", handle: "zubairbinshaukt", url: "https://x.com/zubairbinshaukt" },
    { label: "Instagram", handle: "zubairbinshaukat", url: "https://www.instagram.com/zubairbinshaukat" },
  ],

  /** Twitter card attribution. X caps usernames at 15 chars — the missing "a" is correct. */
  twitterHandle: "@zubairbinshaukt",

  ogImage: {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
  },

  portrait: `${SITE_URL}/dp.webp`,
};

/** Convenience: `sameAs` for JSON-LD, derived so it can never drift from the UI. */
export const sameAs = site.socials.map((s) => s.url);

/**
 * The three-step "how I work" block on the homepage.
 *
 * Steps 01 and 02 are process description, not factual claims about past
 * results, and need no verification. Step 03 is different: it is the handover
 * promise — thirty days of fixes, credentials transferred — worded almost
 * identically to FAQ answer 6. Gating it in lib/faq.js alone would have left
 * the same commitment live on the homepage, so it is gated here too and the
 * two entries are marked to be confirmed together.
 */
export const howIWork = [
  {
    n: "01",
    title: "Read the process",
    body: "Sessions with the person who does the work today, until the steps are written down — including the parts they do from memory. Most of the value is in this document, and some projects end here because the automation turns out not to be worth building yet.",
  },
  {
    n: "02",
    title: "Ship a thin slice",
    body: "One complete path, end to end, in the real environment with real data. It proves the integration, the permissions and the shape of the thing before the bulk of the budget is committed to it.",
  },
  {
    n: "03",
    title: "Hand it over properly",
    body: gate("howiwork-handover"),
  },
];

/**
 * The reply-time promise on /contact. A guarantee, not a fact about the site,
 * so it is gated: null until confirmed, and the row it drives does not render.
 */
export const replyTime = gate("contact-reply-time");

/**
 * Top-level navigation. This array *is* the internal link graph — nav, footer
 * and sitemap all read it, so a route added here appears in all three at once.
 * Google generates sitelinks from exactly this hierarchy.
 */
export const nav = [
  { href: "/about", label: "About", blurb: "Background, stack and how the work runs" },
  { href: "/services/gohighlevel", label: "GoHighLevel", blurb: "Custom dashboards and marketplace apps" },
  { href: "/services/automation", label: "Automation", blurb: "n8n pipelines with runbooks" },
  { href: "/services/web-development", label: "Web Development", blurb: "Next.js and React applications" },
  { href: "/services/mobile", label: "Mobile", blurb: "Cross-platform React Native apps" },
  { href: "/projects", label: "Projects", blurb: "Selected work, written up as case studies" },
  { href: "/blog", label: "Blog", blurb: "Engineering notes" },
  { href: "/contact", label: "Contact", blurb: "Start a project" },
];

/** Every static route, home included. Consumed by the sitemap and by check-meta. */
export const staticRoutes = ["/", ...nav.map((n) => n.href)];

/** Absolute URL for any site-relative path. */
export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
