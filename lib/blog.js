import { listSlugs, readCollection, readEntry, isPublished } from "./mdx";

/**
 * Blog posts, sourced from content/blog/*.mdx.
 *
 * Same frontmatter discipline as lib/projects.js: identical field names in
 * every file, `publishedAt` as the sort key, explicit cover dimensions.
 *
 *   title, slug, summary, topic, readingMinutes,
 *   cover, coverWidth, coverHeight, publishedAt, updatedAt
 */
export function getAllPosts() {
  return readCollection("blog");
}

/**
 * The posts /blog lists.
 *
 * Drafts are excluded here, unlike /projects, which lists its draft case
 * studies so the three real projects stay visible while their bodies are
 * written. A draft post is a different thing: it is finished prose in the
 * wrong voice, and listing it would put it in front of readers under Zubair's
 * name. The route still builds and still returns 200 — see isPublished().
 */
export function getPublishedPosts() {
  return getAllPosts().filter(isPublished);
}

export function getPost(slug) {
  return readEntry("blog", slug);
}

export function getPostSlugs() {
  return listSlugs("blog");
}

/** Slugs safe to put in the sitemap — drafts excluded. See isPublished(). */
export function getPublishedPostSlugs() {
  return getAllPosts().filter(isPublished).map((p) => p.slug);
}
