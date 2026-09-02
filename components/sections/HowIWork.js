import { howIWork } from "@/lib/site";
import Eyebrow from "../Eyebrow";

/**
 * "How I work" — the three steps, as the design's process cards.
 *
 * This is one of exactly three places on the site where a card is allowed. The
 * design note's third defended decision names them: testimonials, the process
 * steps, and the outcome numbers — "where the unit really is a discrete
 * object". Everywhere else is a hairline row.
 *
 * The big Didone numeral at 22% white is the card's own index, decorative
 * against the mono index the rest of the ledger uses. It is `aria-hidden`
 * because the ordered list already numbers these for a screen reader, and
 * hearing "01" before "Read the process" in a list that is already ordered is
 * noise.
 *
 * Server-rendered, no interactivity.
 */
export default function HowIWork({ id = "how-i-work", n = "03" }) {
  return (
    <section
      id={id}
      data-snap
      aria-labelledby="how-i-work-heading"
      className="mx-auto max-w-measure px-gutter pt-20"
    >
      <Eyebrow n={n}>How I work</Eyebrow>

      <h2
        id="how-i-work-heading"
        className="mt-[18px] max-w-[22ch] font-display text-section-h2 text-heading"
      >
        Read it, prove it, hand it&nbsp;over.
      </h2>

      <ol className="mt-12 flex flex-wrap gap-[22px]">
        {howIWork.map((step) => (
          <li
            key={step.n}
            className="flex-[1_1_260px] rounded-panel border border-hairline bg-surface p-5"
          >
            {/*
              The card's own numeral, and a deliberate departure from the
              prototype's value. It writes this at 22% white, which measures
              1.88:1 — below the 3:1 WCAG asks of large text, and exactly the
              "20-30% opacity text" PLAN §2.1 says not to reintroduce. 22% is
              not one of the design note's declared tokens either; its colour
              table floors metadata at 50%. At 40% it measures 3.66:1, still
              reads as a quiet background numeral, and passes
              scripts/check-contrast.mjs.

              aria-hidden because the ordered list already numbers these; the
              contrast fix is not for a screen reader, it is for the person
              looking at the card.
            */}
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
          </li>
        ))}
      </ol>
    </section>
  );
}
