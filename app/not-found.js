import Link from "next/link";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import { nav } from "@/lib/site";

/**
 * The 404 page. It exists to fix a real, measured SEO defect, not to be nicer
 * than Next's built-in one.
 *
 * WHAT THE DEFAULT 404 WAS DOING
 *
 * With no `app/not-found.js`, an unmatched URL still rendered inside the root
 * layout, and Next appended its own minimal 404 document on top of it. The
 * response was a 404, but the HTML carried two <title> elements — the root
 * layout's homepage title and Next's "404: This page could not be found." —
 * the homepage meta description, and two robots directives that contradicted
 * each other: `index, follow` from the root layout and Next's injected
 * `noindex`. Bing's site scan read that as two pages sharing one title, one
 * description, and too little content, which is exactly what it reported.
 *
 * Supplying this file replaces the appended document with ordinary page
 * output: one title, one description, one <h1>, and a body with enough of the
 * site in it to be worth crawling.
 *
 * THE METADATA
 *
 * `title` is absolute so the root layout's `%s - Zubair Bin Shaukat` template
 * does not run — the string already names the site, and templating it would
 * repeat the name.
 *
 * `robots` is `index: false, follow: true`: a 404 must never be indexed, but a
 * crawler that lands here should still follow the links below back into the
 * site. It is set here rather than left to inherit, and that is the half of
 * the bug this file does not fix by existing. Measured, with this key removed
 * the built 404 emits Next's injected `noindex` AND the root layout's
 * `index, follow` plus its googlebot line — the contradiction Bing read. With
 * it, both robots tags say noindex.
 *
 * There are two of them and there is no way to have one: Next injects
 * `<meta name="robots" content="noindex">` for any 404 response on its own,
 * and page metadata is rendered alongside it, not instead of it. Two tags that
 * agree are fine — `follow` is a crawler's default anyway, so the pair reads
 * the same as either one alone. scripts/check-notfound.mjs therefore asserts
 * that every robots tag says noindex rather than that there is exactly one.
 *
 * `alternates.canonical` is `null`, which is how you say "no canonical" to
 * Next when a parent has set one: the root layout declares `canonical: "/"`,
 * and without this override the 404 would ship `<link rel="canonical"
 * href="https://www.zubyr.dev">` — telling every crawler that this dead URL
 * and the homepage are the same page. A 404 is not a page and has no canonical
 * URL, so it ships none.
 */
export const metadata = {
  title: { absolute: "Page Not Found - Zubair Bin Shaukat" },
  description:
    "This page does not exist. It may have been moved or removed since it was last linked. The projects, the blog and the contact page are all linked from here.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

/**
 * Every other inner page reads its ledger number and label from `navEntry()`,
 * because every other inner page is in the nav. A 404 is not a route anyone
 * navigates to, so it has no nav entry and no position in the ledger — the
 * numbers in `lib/site.js` are derived from nav order and adding a fake one
 * here would shift them. `404` is used as the number instead: it is what the
 * mono line above the heading should say, it is stable, and it cannot be
 * mistaken for a nav index the way `00` or `09` could.
 */
const LEDGER = { n: "404", label: "Not found" };

export default function NotFound() {
  return (
    <PageShell readout={`${LEDGER.n} — ${LEDGER.label}`}>
      <PageHeader
        n={LEDGER.n}
        eyebrow={LEDGER.label}
        title="Page not found"
        lede="There is nothing at this address. It was either never here, or it was a draft that has since been taken down. Everything the site does publish is one link away."
      />

      {/*
        Built from `nav` rather than written out, for the same reason the footer
        and the sitemap are: that array is the site's internal link graph, so a
        route added there appears here without anyone remembering to add it.
        `/` is prepended because the homepage is not a nav entry.
      */}
      <ul className="mt-12 border-t border-hairline">
        {[{ href: "/", label: "Home", blurb: "Start here", n: "00" }, ...nav].map(
          (item) => (
            <li key={item.href} className="border-b border-hairline">
              <Link
                href={item.href}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-5 no-underline"
              >
                <span className="flex-none basis-11 font-mono text-metadata uppercase text-meta">
                  {item.n}
                </span>
                <span className="text-copy text-heading">{item.label}</span>
                <span className="text-copy text-meta">{item.blurb}</span>
              </Link>
            </li>
          )
        )}
      </ul>
    </PageShell>
  );
}
