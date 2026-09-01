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
 * @param {{trail: {name: string, href: string}[]}} props  Home is added for you.
 */
export default function Breadcrumbs({ trail }) {
  const items = [{ name: "Home", href: "/" }, ...trail];

  return (
    <>
      <JsonLd graph={breadcrumbGraph(trail)} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-white/80">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-white">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="underline underline-offset-4 hover:text-white"
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
