import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import { facts, stackGroups, intro, timeline } from "@/lib/about";
import { services } from "@/lib/services";
import { navEntry, site } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "Zubair Bin Shaukat is a software engineer in Lahore, Pakistan, building n8n automation, GoHighLevel dashboards, Next.js web apps and React Native apps.",
  alternates: { canonical: "/about" },
};

const entry = navEntry("/about");

/**
 * The page's own subsection numbers, derived rather than written down.
 *
 * The timeline renders only once lib/about.js has entries (C4 in
 * CONTENT-REVIEW.md), so hard-coding "01.2 Stack" would be wrong the day it
 * arrives and wrong the day it does not. Numbering the sections that actually
 * render keeps the ledger consecutive in both states.
 */
const subsections = [
  ...(timeline.length ? [{ id: "timeline", label: "Year by year" }] : []),
  { id: "stack", label: "Stack, by how often it gets used" },
  { id: "work", label: "What he takes on" },
  { id: "elsewhere", label: "Elsewhere" },
].map((section, i) => ({ ...section, n: `${entry.n}.${i + 1}` }));

const sub = (id) => subsections.find((section) => section.id === id);

export default function AboutPage() {
  return (
    <PageShell
      trail={[{ name: "About", href: "/about" }]}
      readout={`${entry.n} — ${entry.label}`}
    >
      {/*
        The <h1> is the plan's, not the prototype's. The design opens this page
        with "Zubair builds the parts nobody wants to run by hand."; PLAN §1.2
        fixes the heading as "About Zubair Bin Shaukat" against the query "who
        is zubair bin shaukat", and §2.1 is explicit that the design applies to
        the Phase 1 structure rather than replacing it. The prototype's line is
        a headline; this one is an answer.
      */}
      <PageHeader n={entry.n} eyebrow={entry.label} title={`About ${site.name}`} />

      <div className="mt-[38px] flex flex-wrap gap-x-14 gap-y-9 border-b border-hairline pb-[52px]">
        <div className="max-w-prose flex-[1_1_460px]">
          {intro.map((paragraph, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-lede text-strong"
                  : "mt-[18px] text-copy text-body"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex-[1_1_260px]">
          <h2 className="sr-only">Facts</h2>
          <dl>
            {facts.map((fact) => (
              <div
                key={fact.k}
                className="flex justify-between gap-4 border-b border-hairline-soft py-[11px]"
              >
                <dt className="font-mono text-metadata uppercase text-meta">
                  {fact.k}
                </dt>
                <dd className="text-right text-[14px] font-medium text-strong">
                  {fact.href ? (
                    <a
                      href={fact.href}
                      className="text-heading underline decoration-accent-line underline-offset-4"
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
        </div>
      </div>

      {/*
        The pull quote. The design sets it at the h2 step in the display serif,
        at a 26ch measure — a statement of positioning, not a section heading,
        so it is a <blockquote> and stays out of the document outline.

        The measure is on the <p>, not on the <blockquote>. `ch` resolves
        against the element's own font, and the blockquote is still at the
        body's 16px Inter — 26ch there is 208px, which broke this into one word
        per line.
      */}
      <blockquote className="py-[52px]">
        <p className="max-w-[26ch] font-display text-section-h2 leading-[1.1] text-heading">
          I build systems that run your business without&nbsp;you.
        </p>
      </blockquote>

      {/*
        C4 — the year-by-year timeline. Renders only when lib/about.js supplies
        entries. While the array is empty this is nothing at all: no heading,
        no placeholder, no "coming soon" — dated facts are what AI systems
        quote, and an empty shell for them is worse than their absence.
      */}
      {timeline.length > 0 ? (
        <section aria-labelledby="timeline" className="pb-16">
          <SectionHeading id="timeline">
            {sub("timeline").n} {sub("timeline").label}
          </SectionHeading>
          <ol className="mt-6">
            {timeline.map((item) => (
              <li
                key={item.year}
                className="flex flex-wrap gap-x-[26px] gap-y-[6px] border-b border-hairline-soft py-5"
              >
                <span className="flex-none basis-[76px] font-mono text-[12px] text-accent">
                  {/* <time> only for a bare year; a range is not a valid datetime. */}
                  {/^\d{4}$/.test(item.year) ? (
                    <time dateTime={item.year}>{item.year}</time>
                  ) : (
                    item.year
                  )}
                </span>
                <div className="min-w-0 flex-[1_1_320px]">
                  <h3 className="text-base font-semibold text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-[6px] max-w-[62ch] text-[14.5px] leading-[1.7] text-body">
                    {item.body}
                  </p>
                  {item.tags?.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-white/[0.09] bg-surface px-[10px] py-[5px] font-mono text-tag uppercase text-meta"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="stack" className="pb-16">
        <SectionHeading id="stack">
          {sub("stack").n} {sub("stack").label}
        </SectionHeading>
        <div className="mt-[22px] flex flex-wrap gap-x-10 gap-y-7">
          {stackGroups.map((group) => (
            <div key={group.title} className="flex-[1_1_220px]">
              <h3 className="mb-3 text-[14px] font-semibold text-heading">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-[7px]">
                {group.items.map((item) => (
                  <li key={item} className="text-[14px] leading-[1.5] text-body">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="work" className="pb-16">
        <SectionHeading id="work">
          {sub("work").n} {sub("work").label}
        </SectionHeading>
        <ul className="mt-[22px]">
          {services.map((service) => (
            <li
              key={service.slug}
              className="group relative border-b border-hairline py-5"
            >
              <h3 className="font-display text-item-h3 text-heading">
                <Link
                  href={`/services/${service.slug}`}
                  className="no-underline after:absolute after:inset-0 after:content-['']"
                >
                  {service.title}
                </Link>
              </h3>
              <p className="mt-[10px] max-w-prose text-copy text-body">
                {service.lede}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="elsewhere">
        <SectionHeading id="elsewhere">
          {sub("elsewhere").n} {sub("elsewhere").label}
        </SectionHeading>
        <dl className="mt-[22px]">
          {site.socials.map((social) => (
            <div
              key={social.url}
              className="flex justify-between gap-4 border-b border-hairline-soft py-[11px]"
            >
              <dt className="font-mono text-metadata uppercase text-meta">
                {social.label}
              </dt>
              <dd className="text-right text-[14px]">
                <a
                  href={social.url}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="text-heading underline decoration-accent-line underline-offset-4"
                >
                  {social.handle}
                </a>
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-b border-hairline-soft py-[11px]">
            <dt className="font-mono text-metadata uppercase text-meta">Email</dt>
            <dd className="text-right text-[14px]">
              <a
                href={`mailto:${site.email}`}
                className="text-heading underline decoration-accent-line underline-offset-4"
              >
                {site.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </PageShell>
  );
}
