import { testimonials } from "@/lib/testimonials";

/**
 * Testimonials. Copy unchanged from the pre-Phase-1 site.
 *
 * Rendered as <blockquote>/<figcaption> so the attribution is programmatically
 * tied to the quote rather than just sitting near it. Monogram avatars are
 * marked aria-hidden — the name is already in the caption, so announcing the
 * initials again is noise.
 */
export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="testimonials" className="text-3xl font-bold text-white">
        What people say
      </h2>

      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.id}>
            <figure className="h-full rounded-lg border border-white/15 bg-black/20 p-6">
              <blockquote className="text-white/80">
                <p>{t.quote}</p>
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-white/15 pt-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 font-semibold text-white"
                >
                  {t.mono}
                </span>
                <span className="text-white">
                  {t.name}
                  <span className="block text-white/70">
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
