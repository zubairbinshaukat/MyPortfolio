import Link from "next/link";
import { site } from "@/lib/site";
import Eyebrow from "../Eyebrow";

/**
 * Closing call to action — the design's "Start with the process, not the
 * platform" panel.
 *
 * The gradient pill here is the homepage's single gradient object, which is
 * the design note's rule: "once per view, at one size ... always a line, mask
 * or single CTA, never a fill". The scroll-progress hairline in the band and
 * the footer's top rule are the other two gradient uses on the page, and both
 * are 1px lines rather than objects.
 *
 * Two routes onward, not one: the form for people who want to describe a
 * project, and the address for people who would rather attach the spreadsheet.
 */
export default function ContactCta({ id = "contact", n = "06" }) {
  return (
    <section
      id={id}
      data-snap
      aria-labelledby="cta"
      className="mx-auto max-w-measure px-gutter py-20"
    >
      <Eyebrow n={n}>Contact</Eyebrow>

      <div className="mt-[18px] flex flex-wrap items-center gap-x-11 gap-y-7 rounded-card border border-hairline bg-surface p-[30px]">
        <div className="flex-[1_1_340px]">
          <h2
            id="cta"
            className="font-display text-item-h3 leading-[1.15] text-heading"
          >
            Start with the process, not the platform.
          </h2>
          <p className="mt-[10px] max-w-[52ch] text-copy text-body">
            Describe what happens today — a spreadsheet, a recording, a list of
            complaints. The reply will say whether it is something{" "}
            {site.firstName} takes on, and what the next step costs.
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
        </p>
      </div>
    </section>
  );
}
