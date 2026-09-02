import { testimonials } from "@/lib/testimonials";
import Eyebrow from "../Eyebrow";

/**
 * Testimonials. Copy unchanged from the pre-Phase-1 site — these are real
 * people and their real words, so nothing here gets rewritten.
 *
 * The second of the design's three permitted card uses: a quote is a discrete
 * object, so it gets a bordered surface rather than a hairline row.
 *
 * Rendered as <blockquote>/<figcaption> so the attribution is programmatically
 * tied to the quote rather than just sitting near it. The monogram avatar is
 * marked aria-hidden — the name is already in the caption, so announcing the
 * initials again is noise. Monograms rather than photographs is a stated
 * choice, not a placeholder: the previous site used generated cartoons of
 * people who do not look like that.
 */
export default function Testimonials({ id = "voices", n = "04" }) {
  return (
    <section
      id={id}
      data-snap
      aria-labelledby="testimonials"
      className="mx-auto max-w-measure px-gutter pt-20"
    >
      <Eyebrow n={n}>Testimonials</Eyebrow>

      <h2
        id="testimonials"
        className="mt-[18px] max-w-[22ch] font-display text-section-h2 text-heading"
      >
        Three people who had to live with the&nbsp;result.
      </h2>

      <p className="mt-[22px] max-w-lede text-lede text-body">
        Avatars are monograms until clients send photographs, which is most of
        the time.
      </p>

      <ul className="mt-12 flex flex-wrap gap-[22px]">
        {testimonials.map((t) => (
          <li key={t.id} className="flex-[1_1_300px]">
            <figure className="flex h-full flex-col gap-5 rounded-card border border-hairline bg-surface p-[26px] transition-colors duration-[400ms] ease-ease hover:border-edge-strong">
              <p
                aria-hidden="true"
                className="-mb-[6px] mt-[14px] h-[14px] font-display text-[32px] leading-[0] text-accent-muted"
              >
                &ldquo;
              </p>
              <blockquote className="flex-1">
                <p className="text-[15.5px] leading-[1.78] text-strong">
                  {t.quote}
                </p>
              </blockquote>
              <figcaption className="flex items-center gap-[14px] border-t border-hairline pt-[18px]">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-white/[0.12] bg-[radial-gradient(circle_at_30%_25%,rgba(168,85,247,0.22),rgba(255,255,255,0.03)_70%)] font-display text-base tracking-[0.06em] text-heading"
                >
                  {t.mono}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-heading">
                    {t.name}
                  </span>
                  <span className="mt-1 block font-mono text-tag uppercase text-meta">
                    {t.role}, {t.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
