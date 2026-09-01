import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

/**
 * Shared MDX plumbing for lib/projects.js and lib/blog.js.
 *
 * Toolchain decision (PLAN §1.1 asked for both paths to be evaluated):
 *
 *   Chosen: gray-matter + next-mdx-remote-client.
 *
 *   `@next/mdx` sources MDX as routes from inside app/, which does not give us
 *   `/projects/[slug]` reading `content/projects/*.mdx`; it also does not
 *   support YAML frontmatter, and PLAN §1.1 makes frontmatter the carrier for
 *   the structured data that feeds metadata, JSON-LD and CLS-safe image
 *   dimensions. The deciding constraint is Turbopack: the bundled Next 16 docs
 *   (01-app/02-guides/mdx.md:726-760) state that with Turbopack, remark/rehype
 *   plugins must be named as strings and "plugins without serializable options
 *   cannot be used yet ... because JavaScript functions can't be passed to
 *   Rust". Turbopack is our builder, and rehype-autolink-headings needs a
 *   function-valued `content` option. Passing plugins at runtime, as below,
 *   sidesteps that restriction entirely.
 *
 *   Cost: MDX is compiled during the build rather than bundled. Because every
 *   MDX route is prerendered via generateStaticParams, that cost is paid once
 *   at build time and never at request time.
 *
 * Contentlayer was not considered — archived and unmaintained since 2024.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Options handed to <MDXRemote>. Frontmatter is stripped by gray-matter before
 * the body ever reaches the compiler, so parseFrontmatter stays off.
 */
export const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "github-dark-dimmed",
          keepBackground: false,
          defaultLang: "text",
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["heading-anchor"],
            ariaHidden: "true",
            tabIndex: -1,
          },
        },
      ],
    ],
  },
};

/** Absolute path of a content collection directory. */
function collectionDir(collection) {
  return path.join(CONTENT_ROOT, collection);
}

/** Every `.mdx` slug in a collection, or [] if the directory does not exist yet. */
export function listSlugs(collection) {
  const dir = collectionDir(collection);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/**
 * Read one entry. Returns `{ ...frontmatter, slug, body }`, or null when the
 * file is absent so callers can hand straight to notFound().
 */
export function readEntry(collection, slug) {
  const file = path.join(collectionDir(collection), `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { ...data, slug, body: content };
}

/**
 * Read a whole collection, newest first.
 *
 * `publishedAt` is the sort key for every collection. PLAN §1.1 warns that one
 * file using `date` where another uses `publishedAt` silently breaks sorting,
 * so a missing key throws here rather than quietly sorting to the bottom.
 */
export function readCollection(collection) {
  return listSlugs(collection)
    .map((slug) => {
      const entry = readEntry(collection, slug);
      if (!entry.publishedAt) {
        throw new Error(
          `content/${collection}/${slug}.mdx is missing required frontmatter field "publishedAt"`
        );
      }
      return entry;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

/** "2026-02-12" -> "12 February 2026". Stable across locales; used in <time>. */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * True when an entry is finished enough to be indexed.
 *
 * Placeholder case studies ship with `draft: true` in their frontmatter. They
 * still build and still return 200 — the route and its schema need exercising
 * — but they are kept out of the sitemap and served `noindex`, because a
 * skeleton with the outcome section unwritten is not something to hand a
 * crawler under someone's name. Flip the flag when the real copy lands.
 */
export function isPublished(entry) {
  return !entry.draft;
}
