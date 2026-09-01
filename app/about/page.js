import Link from "next/link";
import PageShell from "@/components/PageShell";
import { facts, stackGroups, intro, timeline } from "@/lib/about";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "Zubair Bin Shaukat is a software engineer in Lahore, Pakistan, building n8n automation, GoHighLevel dashboards, Next.js web apps and React Native apps.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell trail={[{ name: "About", href: "/about" }]}>
      <h1 className="text-4xl font-bold text-white">About {site.name}</h1>

      {intro.map((paragraph, i) => (
        <p key={i} className="mt-4 max-w-3xl text-lg text-white/80">
          {paragraph}
        </p>
      ))}

      <section aria-labelledby="facts" className="mt-16">
        <h2 id="facts" className="text-2xl font-bold text-white">
          Facts
        </h2>
        <dl className="mt-6 divide-y divide-white/15 border-y border-white/15">
          {facts.map((fact) => (
            <div key={fact.k} className="flex flex-wrap gap-x-6 py-3">
              <dt className="w-40 shrink-0 text-white/70">{fact.k}</dt>
              <dd className="text-white">
                {fact.href ? (
                  <a
                    href={fact.href}
                    className="underline underline-offset-4 hover:text-white"
                  >
                    {fact.v}
                  </a>
                ) : (
                  fact.v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/*
        C4 — the year-by-year timeline. Renders only when lib/about.js supplies
        entries. While the array is empty this is nothing at all: no heading,
        no placeholder, no "coming soon" — dated facts are what AI systems
        quote, and an empty shell for them is worse than their absence.
      */}
      {timeline.length > 0 ? (
        <section aria-labelledby="timeline" className="mt-16">
          <h2 id="timeline" className="text-2xl font-bold text-white">
            Year by year
          </h2>
          <ol className="mt-6 space-y-8">
            {timeline.map((entry) => (
              <li key={entry.year} className="border-t border-white/15 pt-4">
                <p className="text-white/70">
                  {/* <time> only for a bare year; a range is not a valid datetime. */}
                  {/^\d{4}$/.test(entry.year) ? (
                    <time dateTime={entry.year}>{entry.year}</time>
                  ) : (
                    entry.year
                  )}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {entry.title}
                </h3>
                <p className="mt-2 max-w-3xl text-white/80">{entry.body}</p>
                {entry.tags?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/25 px-3 py-1 text-white/80"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="stack" className="mt-16">
        <h2 id="stack" className="text-2xl font-bold text-white">
          Stack
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {stackGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-white">{group.title}</h3>
              <ul className="mt-2 space-y-1 text-white/80">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="work" className="mt-16">
        <h2 id="work" className="text-2xl font-bold text-white">
          What he takes on
        </h2>
        <ul className="mt-6 space-y-4">
          {services.map((service) => (
            <li key={service.slug}>
              <h3 className="text-lg font-semibold text-white">
                <Link
                  href={`/services/${service.slug}`}
                  className="underline underline-offset-4"
                >
                  {service.title}
                </Link>
              </h3>
              <p className="mt-1 max-w-3xl text-white/80">{service.lede}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="elsewhere" className="mt-16">
        <h2 id="elsewhere" className="text-2xl font-bold text-white">
          Elsewhere
        </h2>
        <ul className="mt-6 space-y-2">
          {site.socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                rel="me noopener noreferrer"
                target="_blank"
                className="text-white underline underline-offset-4"
              >
                {social.label}
              </a>
              <span className="text-white/70"> — {social.handle}</span>
            </li>
          ))}
          <li>
            <a
              href={`mailto:${site.email}`}
              className="text-white underline underline-offset-4"
            >
              {site.email}
            </a>
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
