import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import JsonLd from "@/components/JsonLd";
import { getService, getRelatedServices, serviceSlugs } from "@/lib/services";
import { serviceGraph } from "@/lib/schema";
import { navEntry, site } from "@/lib/site";

/**
 * The four service pages.
 *
 * One dynamic segment rather than four near-identical files: the content lives
 * in lib/services.js either way, and generateStaticParams prerenders all four
 * at build time, so the routes are as static as hand-written ones.
 */
export function generateStaticParams() {
  return serviceSlugs.map((slug) => ({ slug }));
}

/** Unknown slugs 404 rather than rendering a shell. */
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = getRelatedServices(slug);
  const entry = navEntry(`/services/${service.slug}`);

  /**
   * Subsection numbers, derived from the sections that actually render. Two
   * of them are conditional: "What I will say no to" is a gated block of
   * positioning claims, and the delivery shape can be gated away too, so the
   * ledger has to number what is on the page rather than what was written.
   */
  const subsections = [
    { id: "covers", label: "What it covers" },
    ...(service.nos.length ? [{ id: "nos", label: "What I will say no to" }] : []),
    { id: "how", label: "How the work runs" },
    { id: "tools", label: "Tools" },
    { id: "other-services", label: "Other services" },
  ].map((section, i) => ({ ...section, n: `${entry.n}.${i + 1}` }));

  const sub = (id) => subsections.find((section) => section.id === id);

  // No /services index exists in the route map, so the trail is Home ▸ this
  // service. A breadcrumb rung pointing at a page that does not exist is worse
  // than a shorter trail.
  return (
    <PageShell
      trail={[{ name: service.title, href: `/services/${service.slug}` }]}
      readout={`${entry.n} — ${entry.label}`}
    >
      <JsonLd graph={serviceGraph(service)} />

      {/*
        The short gradient rule above the eyebrow: the design's opener for a
        service page, and this page's single gradient object.
      */}
      <div aria-hidden="true" className="h-px w-[110px] bg-gradient" />

      <div className="pt-10">
        <PageHeader
          n={entry.n}
          eyebrow={entry.label}
          title={service.h1}
          lede={service.lede}
        />
      </div>

      {/* `shape` is a delivery commitment and may be gated away entirely. */}
      {service.shape ? (
        <p className="mt-[18px] font-mono text-metadata uppercase text-meta">
          {service.shape}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-x-12 gap-y-9 border-y border-hairline py-[34px]">
        <section aria-labelledby="covers" className="flex-[1_1_300px]">
          <SectionHeading id="covers">
            {sub("covers").n} {sub("covers").label}
          </SectionHeading>
          <ul className="mt-[14px] flex flex-col gap-[11px]">
            {service.covers.map((item) => (
              <li
                key={item}
                className="flex gap-[11px] text-[14.5px] leading-[1.65] text-body"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-[5px] w-[5px] flex-none rounded-full bg-accent"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/*
          "What I will say no to" is a list of positioning claims, gated whole
          in lib/commitments.mjs. While it is unconfirmed the array is empty and
          the section does not render — an empty heading is worse than no
          heading.
        */}
        {service.nos.length > 0 ? (
          <section aria-labelledby="nos" className="flex-[1_1_300px]">
            <SectionHeading id="nos">
              {sub("nos").n} {sub("nos").label}
            </SectionHeading>
            <ul className="mt-[14px] flex flex-col gap-[11px]">
              {service.nos.map((item) => (
                <li
                  key={item}
                  className="flex gap-[11px] text-[14.5px] leading-[1.65] text-body"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[11px] h-px w-[9px] flex-none bg-white/30"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section aria-labelledby="how" className="mt-[52px]">
        <SectionHeading id="how">
          {sub("how").n} {sub("how").label}
        </SectionHeading>
        {/*
          The third and last of the design's permitted card uses: a process
          step is a discrete object with a duration attached to it.
        */}
        <ol className="mt-6 flex flex-wrap gap-[22px]">
          {service.steps.map((step) => (
            <li
              key={step.n}
              className="flex-[1_1_220px] rounded-panel border border-hairline bg-surface p-5"
            >
              {/* 40% not the prototype's 22% — see components/sections/HowIWork.js. */}
              <p
                aria-hidden="true"
                className="mb-[14px] font-display text-[30px] leading-none text-white/40"
              >
                {step.n}
              </p>
              <h3 className="mb-2 text-[14.5px] font-semibold text-heading">
                {step.title}
              </h3>
              <p className="text-[13.5px] leading-[1.65] text-body">{step.body}</p>
              {/* The schedule is a commitment; the step itself is not. */}
              {step.when ? (
                <p className="mt-[14px] font-mono text-tag uppercase text-meta">
                  {step.when}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tools" className="mt-14">
        <SectionHeading id="tools">
          {sub("tools").n} {sub("tools").label}
        </SectionHeading>
        <ul className="mt-[22px] flex flex-wrap gap-[7px]">
          {service.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/[0.09] bg-surface px-[11px] py-[6px] font-mono text-tag uppercase text-meta"
            >
              {tag}
            </li>
          ))}
        </ul>
      </section>

      {/* Every service page cross-links the other three and back to the homepage. */}
      <section aria-labelledby="other-services" className="mt-14">
        <SectionHeading id="other-services">
          {sub("other-services").n} {sub("other-services").label}
        </SectionHeading>
        <ul className="mt-[22px]">
          {related.map((other) => (
            <li
              key={other.slug}
              className="group relative border-b border-hairline py-5"
            >
              <h3 className="font-display text-item-h3 text-heading">
                <Link
                  href={`/services/${other.slug}`}
                  className="no-underline after:absolute after:inset-0 after:content-['']"
                >
                  {other.title}
                </Link>
              </h3>
              <p className="mt-[10px] max-w-prose text-copy text-body">
                {other.lede}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="service-cta"
        className="mt-14 flex flex-wrap items-center gap-x-11 gap-y-7 rounded-card border border-hairline bg-surface p-[30px]"
      >
        <div className="flex-[1_1_340px]">
          <h2
            id="service-cta"
            className="font-display text-item-h3 leading-[1.15] text-heading"
          >
            Start with the process, not the platform.
          </h2>
          <p className="mt-[10px] max-w-[52ch] text-copy text-body">
            Send the current version — a spreadsheet, a recording, a list of
            complaints. That is a better brief than a form.
          </p>
        </div>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/contact"
            className="inline-flex min-h-control items-center gap-[10px] rounded-full bg-gradient px-[22px] py-[14px] text-[14.5px] font-semibold text-white no-underline transition-transform duration-300 ease-ease hover:-translate-y-[2px]"
          >
            Start a project
            <span aria-hidden="true">↗</span>
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex min-h-control items-center border-b border-accent-line pb-[2px] text-[14.5px] text-heading no-underline transition-colors duration-300 ease-ease hover:border-white"
          >
            {site.email}
          </a>
          {/*
            PLAN §1.2 requires every service page to link the other three and
            back to `/`. The breadcrumb above already carries Home, but this is
            the link a reader at the bottom of the page can reach without
            scrolling back up, and it is the one in the body copy that the
            internal link graph is read from.
          */}
          <Link
            href="/"
            className="inline-flex min-h-control items-center font-mono text-metadata uppercase text-meta no-underline transition-colors duration-300 ease-ease hover:text-heading"
          >
            <span aria-hidden="true">←&nbsp;</span> Back to {site.name}
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
