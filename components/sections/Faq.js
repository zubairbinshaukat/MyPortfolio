import { faqs } from "@/lib/faq";
import Eyebrow from "../Eyebrow";

/**
 * The FAQ block.
 *
 * ONE DELIBERATE DEPARTURE FROM THE PROTOTYPE
 *
 * The design draws this as an accordion: a `+` toggle per question, one answer
 * open at a time. It is not built that way, and the difference is structural
 * rather than cosmetic, so PLAN §2.1 asks for it to be flagged rather than
 * done quietly.
 *
 * The answers below are the text AI systems lift close to verbatim, and they
 * are the source of the homepage's FAQPage schema. The governing rule (§0.1)
 * is that every word Google or an AI needs exists in server-rendered HTML
 * before any JavaScript runs, and scripts/check-meta.mjs asserts the visible
 * strings and the schema strings are byte-identical. A collapsed answer would
 * still be in the DOM, so the letter of that survives — but an accordion makes
 * the answer something a reader has to ask for, and these four questions are
 * the entity answers the whole SEO layer is built around. They are the page's
 * most valuable copy; hiding them behind a click to save vertical space is the
 * wrong trade.
 *
 * Everything else the design specifies is here: the numbered mono index, the
 * hairline rules, the question at 16.5px Inter medium, the answer indented to
 * the question's text column at 70ch. Only the toggle is gone.
 */
export default function Faq({ id = "faq", n = "05" }) {
  return (
    <section
      id={id}
      data-snap
      aria-labelledby="faq-heading"
      className="mx-auto max-w-measure px-gutter pt-20"
    >
      <Eyebrow n={n}>FAQ</Eyebrow>

      <h2
        id="faq-heading"
        className="mt-[18px] max-w-[18ch] font-display text-section-h2 text-heading"
      >
        Asked before every&nbsp;project.
      </h2>

      <dl className="mt-[34px] border-t border-hairline">
        {faqs.map((f, i) => (
          <div key={f.id} className="border-b border-hairline py-[18px]">
            {/*
              The ledger number is a sibling of the heading, not a child of it.
              Inside the <h3> it would become part of the heading's text, and
              scripts/check-meta.mjs asserts that every FAQPage schema question
              appears as visible <h3> text byte for byte — "01Who is Zubair Bin
              Shaukat?" is not that string. Keeping it outside also keeps the
              accessible name of the heading correct.
            */}
            <dt className="flex items-baseline gap-4">
              <span
                aria-hidden="true"
                className="w-[26px] flex-none font-mono text-[10.5px] font-normal text-meta"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                id={f.id}
                className="flex-1 text-[16.5px] font-medium leading-[1.4] text-heading"
              >
                {f.q}
              </h3>
            </dt>
            <dd className="mb-1 mt-3 max-w-prose pl-[42px] pr-[26px] text-copy text-body">
              {f.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
