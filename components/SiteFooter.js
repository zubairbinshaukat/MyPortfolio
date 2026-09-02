import Link from "next/link";
import { nav, site } from "@/lib/site";
import { services } from "@/lib/services";

/**
 * Site footer. Carries the full route list a second time — nav and footer both
 * linking every top-level page is the internal-link pattern sitelinks are
 * picked from (seo-implementation.md §1).
 *
 * It is also the site's no-JavaScript navigation guarantee. The primary
 * navigation is a `<details>` index that opens natively, so it does not need
 * this — but a plain list of every route, always visible, always in the HTML,
 * means the link graph never depends on a disclosure widget behaving.
 *
 * Every fact here is read from lib/site.js. The email appears in exactly one
 * place in the codebase, which is why changing it is a one-line edit.
 *
 * The gradient hairline across the top is the second and last full-width use
 * of the gradient on the site; the first is the scroll-progress line. Both are
 * 1px, which is the design note's rule.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Site",
      links: [
        { href: "/", label: "Home" },
        ...nav.filter((item) => !item.href.startsWith("/services/")),
      ],
    },
    {
      title: "Services",
      links: services.map((service) => ({
        href: `/services/${service.slug}`,
        label: service.title,
      })),
    },
  ];

  return (
    <footer className="relative z-[1] border-t border-hairline bg-elevated">
      <div
        aria-hidden="true"
        className="h-px w-full bg-[linear-gradient(to_right,rgba(168,85,247,0),#a855f7,#8b5cf6,#ec4899,rgba(236,72,153,0))]"
      />

      <div className="mx-auto max-w-measure px-gutter pb-[34px] pt-14">
        <div className="flex flex-wrap gap-x-12 gap-y-10 border-b border-hairline pb-11">
          <div className="flex-[1_1_280px]">
            <p className="font-display text-[30px] leading-[1.1] text-heading">
              {site.firstName}
            </p>
            <p className="font-font0 text-[26px] leading-none text-accent">
              Bin Shaukat
            </p>
            <p className="mt-[18px] max-w-[34ch] text-[14.5px] leading-[1.75] text-body">
              {site.jobTitle} in {site.location.locality}. {site.shortDescription}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-[2_1_420px] flex-wrap gap-x-10 gap-y-7"
          >
            {columns.map((column) => (
              <div key={column.title} className="flex-[1_1_150px]">
                <h2 className="mb-[14px] font-mono text-[10px] font-normal uppercase tracking-[0.22em] text-meta">
                  {column.title}
                </h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex min-h-[36px] items-center text-[14.5px] text-body no-underline transition-colors duration-300 ease-ease hover:text-heading"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex-[1_1_150px]">
              <h2 className="mb-[14px] font-mono text-[10px] font-normal uppercase tracking-[0.22em] text-meta">
                Elsewhere
              </h2>
              <ul>
                {site.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      rel="me noopener noreferrer"
                      target="_blank"
                      className="flex min-h-[36px] items-center text-[14.5px] text-body no-underline transition-colors duration-300 ease-ease hover:text-heading"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="flex min-h-[36px] items-center text-[14.5px] text-body no-underline transition-colors duration-300 ease-ease hover:text-heading"
                  >
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3 pt-[26px] font-mono text-metadata uppercase text-meta">
          <p>
            © {year} {site.name} · {site.location.locality},{" "}
            {site.location.countryCode}
          </p>
          {/*
            The colophon. "Soria by Bydani" is not decoration: the typeface is
            licensed CC BY-ND 4.0, which requires credit and a link to the
            licence wherever the font is distributed — and a web font is
            distributed to every visitor. See app/fonts/soria-LICENSE.txt.
            Removing this line makes the site non-compliant; the way to lose it
            is to change the typeface.
          */}
          <p>
            Built with Next.js · Type:{" "}
            <a
              href="https://creativecommons.org/licenses/by-nd/4.0/"
              rel="license noopener noreferrer"
              target="_blank"
              className="text-meta underline decoration-white/25 underline-offset-2 transition-colors duration-300 ease-ease hover:text-heading"
            >
              Soria by Bydani
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
