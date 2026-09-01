import { SITE_URL, staticRoutes } from "@/lib/site";
import { getPublishedProjectSlugs } from "@/lib/projects";
import { getPublishedPostSlugs } from "@/lib/blog";

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
 */
export default function sitemap() {
  const lastModified = new Date();

  const pages = staticRoutes.map((route) => ({
    url: route === "/" ? SITE_URL : `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const projects = getPublishedProjectSlugs().map((slug) => ({
    url: `${SITE_URL}/projects/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const posts = getPublishedPostSlugs().map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...projects, ...posts];
}
