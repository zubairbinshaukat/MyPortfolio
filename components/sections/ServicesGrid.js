import Link from "next/link";
import { services } from "@/lib/services";
import { navEntry } from "@/lib/site";
import Eyebrow from "../Eyebrow";

/**
 * "What I do" — the four services, as the design's ledger rows.
 *
 * The component name is unchanged from Phase 1 and the design has no grid in
 * it: the design note's third defended decision is that hairline rows are the
 * default and cards are the exception, because "a list of rules reads faster
 * and denser than a grid of cards — which is what a skimming founder needs".
 * Renaming the file would have been churn in every importer for no gain; the
 * markup is what changed.
 *
 * These four links are half the internal link graph the homepage carries, and
 * they are plain anchors, so a crawler with JavaScript disabled follows them.
 *
 * THE WHOLE ROW IS CLICKABLE, AND THE LINK IS STILL JUST THE TITLE
 *
 * The prototype wraps each entire row in one anchor. Done literally, that
 * gives a screen reader a link whose name is the title, the summary and four
 * tag pills read out as one string. The heading link carries an
 * `after:absolute after:inset-0` overlay instead: the accessible name stays
 * "Automation Systems", and the click target is still the full row.
 */
export default function ServicesGrid({ id = "services", n = "01" }) {
  return (
    <section
      id={id}
      data-snap
      aria-labelledby="what-i-do"
      className="mx-auto max-w-measure px-gutter pt-[52px]"
    >
      <Eyebrow n={n}>What I do</Eyebrow>

      <h2
        id="what-i-do"
        className="mt-[18px] max-w-[22ch] font-display text-section-h2 text-heading"
      >
        Four things, and what each one asks of&nbsp;you.
      </h2>

      <p className="mt-[22px] max-w-lede text-lede text-body">
        Every engagement is scoped in writing before it starts, and handed over
        with the notes needed to run it without me. Below is what changes
        between them.
      </p>

      <ol className="mt-12 border-t border-hairline">
        {services.map((service) => {
          const entry = navEntry(`/services/${service.slug}`);
          return (
            <li
              key={service.slug}
              className="group relative border-b border-hairline"
            >
              <div className="flex flex-wrap gap-x-8 gap-y-[14px] py-[26px] transition-[padding-left] duration-[350ms] ease-ease group-hover:pl-[10px]">
                <span className="flex-none basis-11 pt-[6px] font-mono text-[11px] tracking-[0.14em] text-meta">
                  {entry?.n}
                </span>

                <div className="min-w-0 flex-[1_1_300px]">
                  <h3 className="font-display text-item-h3 text-heading">
                    <Link
                      href={`/services/${service.slug}`}
                      className="no-underline after:absolute after:inset-0 after:content-['']"
                    >
                      {service.title}
                    </Link>
                  </h3>
                  <p className="mt-[10px] max-w-[56ch] text-copy text-body">
                    {service.lede}
                  </p>
                  <ul className="mt-[14px] flex flex-wrap gap-[7px]">
                    {service.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/[0.09] bg-surface px-[10px] py-[5px] font-mono text-tag uppercase text-meta"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Delivery shape is a commitment; it may be gated away. */}
                {service.shape ? (
                  <div className="flex-[0_1_210px]">
                    <p className="font-mono text-metadata uppercase text-meta">
                      Typical shape
                    </p>
                    <p className="mt-[6px] text-[14px] leading-[1.6] text-strong">
                      {service.shape}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
