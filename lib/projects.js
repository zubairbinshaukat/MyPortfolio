import { listSlugs, readCollection, readEntry, isPublished } from "./mdx";

/**
 * Case studies, sourced from content/projects/*.mdx.
 *
 * Frontmatter contract — field names are identical across every file, and
 * every field is load-bearing somewhere:
 *
 *   title, slug        route + <h1> + Article headline
 *   summary            meta description + card copy + CreativeWork.description
 *   client, year, kind displayed metadata
 *   stack[]            displayed, and CreativeWork.keywords
 *   cover, coverWidth, coverHeight
 *                      explicit dimensions are what hold CLS at zero as
 *                      content is added; never omit them
 *   featured           picked up by the homepage "selected work" block
 *   publishedAt, updatedAt   sort key and Article dates
 */
export function getAllProjects() {
  return readCollection("projects");
}

export function getProject(slug) {
  return readEntry("projects", slug);
}

export function getFeaturedProjects(limit = 3) {
  return getAllProjects()
    .filter((p) => p.featured)
    .slice(0, limit);
}

export function getProjectSlugs() {
  return listSlugs("projects");
}

/** Slugs safe to put in the sitemap — drafts excluded. See isPublished(). */
export function getPublishedProjectSlugs() {
  return getAllProjects().filter(isPublished).map((p) => p.slug);
}
