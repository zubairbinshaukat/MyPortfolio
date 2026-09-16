import { site } from "./site";

/**
 * The one way a page in this app declares its metadata.
 *
 * WHY THIS EXISTS
 *
 * Next shallow-merges `openGraph`: a page that sets no `openGraph` object at
 * all inherits the root layout's entire one, key for key. The root layout used
 * to set `openGraph.title`, `openGraph.description` and `openGraph.url`, so
 * every inner page shipped the *homepage's* og:title, og:description and
 * og:url while its `<title>` and canonical said something else. /about really
 * was telling every share card and every AI crawler that it was the homepage.
 *
 * The root layout now sets only the three fields that are genuinely
 * site-wide — `type`, `siteName`, `locale` — so inheriting them is correct.
 * Next's `inheritFromMetadata` then fills og:title and og:description from the
 * page's own resolved title and description. og:url has no such fallback: it
 * does *not* follow the canonical, so it has to be written per page or left
 * off entirely. This helper writes it, from the same string the canonical
 * uses, which is what makes the two impossible to disagree.
 *
 * @param {object}  options
 * @param {string}  options.title        The page title, undecorated.
 * @param {string}  options.description  The meta description (140–160 chars).
 * @param {string}  options.path         Site-relative path; canonical and og:url.
 * @param {boolean} [options.absolute]   True when `title` already ends with the
 *   brand, so the root layout's `%s - Zubair Bin Shaukat` template must not
 *   append it a second time.
 * @param {object}  [options.openGraph]  Merged last: `type: "article"` plus
 *   `publishedTime`/`modifiedTime`/`authors` for the two content routes.
 */
export function pageMetadata({
  title,
  description,
  path,
  absolute = false,
  openGraph = {},
}) {
  /*
    `og:title` runs through the same title template as `<title>` does — see
    resolveOpenGraph in next/dist/lib/metadata/resolvers — so it has to be
    given the same shape. Handing it the bare string while the page title is
    `{ absolute }` would template one and not the other, and the two would
    differ by " - Zubair Bin Shaukat" on every page that sets one.
  */
  const resolved = absolute ? { absolute: title } : title;

  return {
    title: resolved,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: path,
      title: resolved,
      description,
      ...openGraph,
    },
  };
}
