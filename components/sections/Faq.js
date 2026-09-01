import { faqs } from "@/lib/faq";

/**
 * The FAQ block.
 *
 * Rendered as plain <h3>/<p> pairs, not a JavaScript accordion: the answers
 * are the text AI systems lift close to verbatim, so every word has to be in
 * the server HTML and visible without an interaction. FAQPage JSON-LD is
 * emitted from the same array by the homepage, which is what makes the
 * schema and the visible strings byte-identical.
 */
export default function Faq() {
  return (
    <section aria-labelledby="faq" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="faq" className="text-3xl font-bold text-white">
        Frequently asked questions
      </h2>

      <dl className="mt-8 space-y-8">
        {faqs.map((f) => (
          <div key={f.id} className="border-t border-white/15 pt-6">
            <dt>
              <h3 id={f.id} className="text-xl font-semibold text-white">
                {f.q}
              </h3>
            </dt>
            <dd className="mt-2 max-w-3xl text-white/80">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
