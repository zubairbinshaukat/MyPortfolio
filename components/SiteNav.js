import Link from "next/link";
import { nav, site } from "@/lib/site";

/**
 * Site navigation — every top-level route, as real crawlable anchors.
 *
 * This is the internal link graph Google generates sitelinks from, so the
 * complete set appears on every page rather than a trimmed "primary" subset.
 *
 * Placement is per-page rather than in the root layout on purpose: on the
 * homepage nothing may render above the hero, or it stops being pixel
 * identical to docs/post-migration/. Home renders this after the hero; inner
 * pages render it at the top via PageShell.
 *
 * Deliberately unstyled beyond legibility — Phase 1 is structure only. The
 * approved design replaces this with a full-screen index overlay in Phase 2.
 */
export default function SiteNav() {
  return (
    <nav aria-label="Primary" className="border-y border-white/15 bg-black/30">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link
              href="/"
              className="text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              {site.firstName}
            </Link>
          </li>
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-white/90 underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
