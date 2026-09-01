import Link from "next/link";
import { nav, site } from "@/lib/site";
import { services } from "@/lib/services";

/**
 * Site footer. Carries the full route list a second time — nav and footer both
 * linking every top-level page is the internal-link pattern sitelinks are
 * picked from (seo-implementation.md §1).
 *
 * Every fact here is read from lib/site.js. The email appears in exactly one
 * place in the codebase, which is why changing it is a one-line edit.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/15 bg-black/40">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Site
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                  Home
                </Link>
              </li>
              {nav
                .filter((item) => !item.href.startsWith("/services/"))
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Services
            </h2>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-white/90 underline-offset-4 hover:text-white hover:underline"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Elsewhere
            </h2>
            <ul className="space-y-2">
              {site.socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="text-white/90 underline-offset-4 hover:text-white hover:underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-white/90 underline-offset-4 hover:text-white hover:underline"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-white/80">
          {site.name} — {site.jobTitle} in {site.location.locality},{" "}
          {site.location.country}. © {year}.
        </p>
      </div>
    </footer>
  );
}
