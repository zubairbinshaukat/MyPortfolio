import Link from "next/link";
import { services } from "@/lib/services";

/**
 * "What I do" — four cards, each linking to its service page.
 *
 * These four links are half the internal link graph the homepage carries, and
 * they are plain anchors so a crawler with JavaScript disabled follows them.
 */
export default function ServicesGrid() {
  return (
    <section aria-labelledby="what-i-do" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="what-i-do" className="text-3xl font-bold text-white">
        What I do
      </h2>
      <p className="mt-3 max-w-2xl text-white/80">
        Four kinds of work. Each one is scoped in writing before it starts, and
        handed over with the notes needed to run it without me.
      </p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {services.map((service) => (
          <li
            key={service.slug}
            className="rounded-lg border border-white/15 bg-black/20 p-6"
          >
            <h3 className="text-xl font-semibold text-white">
              <Link
                href={`/services/${service.slug}`}
                className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                {service.title}
              </Link>
            </h3>
            <p className="mt-2 text-white/80">{service.lede}</p>
            {/* Delivery shape is a commitment; it may be gated away. */}
            {service.shape ? (
              <p className="mt-3 text-white/70">{service.shape}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
