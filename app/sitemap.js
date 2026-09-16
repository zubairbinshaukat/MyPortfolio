import { SITE_URL, routeUpdated, staticRoutes } from "@/lib/site";
import { getPublishedProjectEntries } from "@/lib/projects";
import { getPublishedPostEntries } from "@/lib/blog";

/**
 * The sitemap.
 *
 * Static routes come from lib/site.js, so a route added to the navigation
 * appears here automatically rather than being remembered separately. Project
 * and blog entries are generated from the MDX directories for the same reason.
 *
 * Drafts are excluded: they are served noindex, and a noindex URL listed in a
 * sitemap is a contradictory signal.
 *
 * The single vercel.app URL this file used to contain is gone — it pointed at
 * a host that 307s to the canonical domain, which is the wrong thing to hand
 * a crawler.
 *
 * WHY THERE IS NO `new Date()` HERE
 *
 * This file used to stamp every URL with the build time. That is not a small
 * inaccuracy, it is a lie told to a crawler on every deploy: it says all
 * eleven pages changed, every time, including the ones that did not. Two
 * things followed from it. Google stopped trusting the signal, which is part
 * of why `/services/mobile` and `/services/web-development` sat in "Discovered
 * — currently not indexed". And it leaked into the SERP: the Contact result
 * carried a "01-Sept-2026" date that came from nowhere but the last build,
 * because Google will show a `lastmod` it has nothing better to use.
 *
 * So every date here is written down by a human next to the thing it
 * describes. Static routes read `updated` from their nav entry in lib/site.js;
 * case studies and posts read `updatedAt || publishedAt` from their own
 * frontmatter. Rebuilding the site changes no date in this file, which is
 * exactly the point — and scripts/check-meta.mjs fails the build if any
 * `lastmod` lands within 24 hours of the moment the check runs, because a
 * fresh date is the signature of the bug coming back.
 */
export default function sitemap() {
  const pages = staticRoutes.map((route) => ({
    url: route === "/" ? SITE_URL : `${SITE_URL}${route}`,
    lastModified: routeUpdated(route),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const projects = getPublishedProjectEntries().map(({ slug, updated }) => ({
    url: `${SITE_URL}/projects/${slug}`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const posts = getPublishedPostEntries().map(({ slug, updated }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...projects, ...posts];
}
