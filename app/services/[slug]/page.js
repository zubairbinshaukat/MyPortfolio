import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/JsonLd";
import { getService, getRelatedServices, serviceSlugs } from "@/lib/services";
import { serviceGraph } from "@/lib/schema";
import { site } from "@/lib/site";

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

  // No /services index exists in the route map, so the trail is Home ▸ this
  // service. A breadcrumb rung pointing at a page that does not exist is worse
  // than a shorter trail.
  return (
    <PageShell trail={[{ name: service.title, href: `/services/${service.slug}` }]}>
      <JsonLd graph={serviceGraph(service)} />

      <h1 className="text-4xl font-bold text-white">{service.h1}</h1>
      {/* `shape` is a delivery commitment and may be gated away entirely. */}
      {service.shape ? (
        <p className="mt-3 text-white/70">{service.shape}</p>
      ) : null}
      <p className="mt-4 max-w-3xl text-lg text-white/80">{service.lede}</p>

      <section aria-labelledby="covers" className="mt-16">
        <h2 id="covers" className="text-2xl font-bold text-white">
          What it covers
        </h2>
        <ul className="mt-6 space-y-3">
          {service.covers.map((item) => (
            <li key={item} className="max-w-3xl border-t border-white/15 pt-3 text-white/80">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/*
        "What I will say no to" is a list of positioning claims, gated whole in
        lib/commitments.mjs. While it is unconfirmed the array is empty and the
        section does not render — an empty heading is worse than no heading.
      */}
      {service.nos.length > 0 ? (
        <section aria-labelledby="nos" className="mt-16">
          <h2 id="nos" className="text-2xl font-bold text-white">
            What I will say no to
          </h2>
          <ul className="mt-6 space-y-3">
            {service.nos.map((item) => (
              <li key={item} className="max-w-3xl border-t border-white/15 pt-3 text-white/80">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="how" className="mt-16">
        <h2 id="how" className="text-2xl font-bold text-white">
          How the work runs
        </h2>
        <ol className="mt-6 space-y-6">
          {service.steps.map((step) => (
            <li key={step.n} className="border-t border-white/15 pt-4">
              <h3 className="text-lg font-semibold text-white">
                <span className="mr-3 text-white/70">{step.n}</span>
                {step.title}
              </h3>
              {/* The schedule is a commitment; the step itself is not. */}
              {step.when ? <p className="mt-1 text-white/70">{step.when}</p> : null}
              <p className="mt-2 max-w-3xl text-white/80">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tools" className="mt-16">
        <h2 id="tools" className="text-2xl font-bold text-white">
          Tools
        </h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {service.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/25 px-4 py-1 text-white/80"
            >
              {tag}
            </li>
          ))}
        </ul>
      </section>

      {/* Every service page cross-links the other three and back to the homepage. */}
      <section aria-labelledby="other-services" className="mt-16">
        <h2 id="other-services" className="text-2xl font-bold text-white">
          Other services
        </h2>
        <ul className="mt-6 space-y-4">
          {related.map((other) => (
            <li key={other.slug}>
              <h3 className="text-lg font-semibold text-white">
                <Link
                  href={`/services/${other.slug}`}
                  className="underline underline-offset-4"
                >
                  {other.title}
                </Link>
              </h3>
              <p className="mt-1 max-w-3xl text-white/80">{other.lede}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="service-cta" className="mt-16">
        <h2 id="service-cta" className="text-2xl font-bold text-white">
          Start a project
        </h2>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/contact" className="text-white underline underline-offset-4">
            Get in touch
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="text-white/90 underline underline-offset-4 hover:text-white"
          >
            {site.email}
          </a>
          <Link href="/" className="text-white/90 underline underline-offset-4 hover:text-white">
            Back to {site.name}
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
