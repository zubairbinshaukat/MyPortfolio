import { site, sameAs, absoluteUrl } from "./site";
import { faqs } from "./faq";

/**
 * JSON-LD builders. Every value is read from lib/site.js — nothing about the
 * person is written twice, which is what stops the schema and the visible page
 * drifting apart.
 *
 * Deliberately absent: `telephone` (PLAN §1 removes the phone number
 * entirely), Blogger in `sameAs`, and any metric or count that has not been
 * confirmed. Structured data is a machine-read assertion of fact; unverified
 * numbers do not belong in it.
 */

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;
const PROFILEPAGE_ID = `${site.url}/#profilepage`;

/** The Person node. Referenced by @id everywhere else rather than repeated. */
function person() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    alternateName: site.alternateName,
    url: site.url,
    image: site.portrait,
    jobTitle: site.jobTitle,
    description: site.description,
    email: `mailto:${site.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location.locality,
      addressRegion: site.location.region,
      addressCountry: site.location.countryCode,
    },
    knowsAbout: site.knowsAbout,
    sameAs,
  };
}

/**
 * The root @graph, rendered once on the homepage.
 *
 * `WebSite.name` is the site owner's name rather than the domain — that is
 * what makes Google print "Zubair Bin Shaukat" as the brand label above the
 * URL instead of "zubyr.dev".
 */
export function rootGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: site.url,
        name: site.name,
        description: site.description,
        publisher: { "@id": PERSON_ID },
        inLanguage: "en",
      },
      {
        "@type": "ProfilePage",
        "@id": PROFILEPAGE_ID,
        url: site.url,
        name: `${site.name} — ${site.tagline}`,
        about: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
    ],
  };
}

/**
 * FAQPage, generated from the same array the homepage renders as visible
 * <h3>/<p> pairs. The strings are byte-identical by construction.
 */
export function faqGraph() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${site.url}/#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Service node for a service page, provided by the Person. */
export function serviceGraph(service) {
  const url = absoluteUrl(`/services/${service.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.h1,
    serviceType: service.serviceType,
    description: service.description,
    url,
    provider: { "@id": PERSON_ID },
    areaServed: { "@type": "Place", name: "Worldwide" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/contact"),
    },
  };
}

/**
 * CreativeWork for a case study.
 *
 * `datePublished` and `dateModified` are emitted only once the file's
 * frontmatter sets `datesVerified: true`. The dates currently in the three
 * case studies are placeholders, and a date in JSON-LD is a machine-read
 * assertion of fact — the same reason no metric or count appears here.
 */
export function projectGraph(project) {
  const url = absoluteUrl(`/projects/${project.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: project.title,
    headline: project.title,
    description: project.summary,
    url,
    author: { "@id": PERSON_ID },
    creator: { "@id": PERSON_ID },
    ...(project.datesVerified
      ? {
          datePublished: project.publishedAt,
          dateModified: project.updatedAt || project.publishedAt,
        }
      : {}),
    keywords: project.stack,
    ...(project.cover ? { image: absoluteUrl(project.cover) } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
  };
}

/** Article for a blog post. */
export function articleGraph(post) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.summary,
    url,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
  };
}

/**
 * BreadcrumbList for an inner page.
 *
 * @param {{name: string, href: string}[]} trail  Home is prepended for you.
 */
export function breadcrumbGraph(trail) {
  const items = [{ name: "Home", href: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
