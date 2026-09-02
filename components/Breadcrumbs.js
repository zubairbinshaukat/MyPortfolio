import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbGraph } from "@/lib/schema";

/**
 * Visible breadcrumb trail plus its BreadcrumbList JSON-LD, generated from the
 * same array — so the markup and the structured data cannot disagree.
 *
 * Breadcrumbs reinforce the page hierarchy, which is one of the inputs Google
 * uses to decide a site deserves sitelinks.
 *
 * Set in mono at the metadata step, like every other index and label on the
 * site. It sits between the band and the page's eyebrow, so it reads as one
 * continuous line of navigation type rather than as a separate widget.
 *
 * A trail item may carry `morph: true`. That is the crumb on a detail page
 * pointing at the list the page's cover and title fly back into — the third way
 * out of a case study, after the "All projects" button and the browser's own
 * back. Without it this link took the route curtain while the other two
 * morphed, which is the same journey rendered three different ways.
 *
 * It is opt-in rather than automatic because most crumbs have no counterpart to
 * morph with: `/services/gohighlevel` points at a `/services` index that does
 * not exist, and naming a pair that only exists on one side is how a transition
 * breaks rather than degrades.
 *
 * @param {{trail: {name: string, href: string, morph?: boolean}[]}} props
 *        Home is added for you.
 */
export default function Breadcrumbs({ trail }) {
  const items = [{ name: "Home", href: "/" }, ...trail];

  return (
    <>
      <JsonLd graph={breadcrumbGraph(trail)} />
      <nav
        aria-label="Breadcrumb"
        className="relative z-[1] mx-auto max-w-measure px-gutter pt-6"
      >
        <ol className="flex flex-wrap items-center gap-x-[10px] gap-y-1 font-mono text-metadata uppercase text-meta">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-x-[10px]">
                {isLast ? (
                  <span aria-current="page" className="truncate text-body">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    {...(item.morph
                      ? { "data-vt": "morph", transitionTypes: ["morph"] }
                      : null)}
                    className="text-meta no-underline transition-colors duration-300 ease-ease hover:text-heading"
                  >
                    {item.name}
                  </Link>
                )}
                {!isLast && <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
