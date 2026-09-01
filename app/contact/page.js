import Link from "next/link";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import { site, replyTime } from "@/lib/site";
import { services } from "@/lib/services";

export const metadata = {
  title: "Contact",
  // The old description promised a reply within one business day. That is a
  // guarantee, gated as `contact-reply-time` in lib/commitments.mjs, so it is
  // out of the description too — a meta description is where a claim gets
  // quoted back at you.
  description:
    "Send a message to Zubair Bin Shaukat about automation systems, GoHighLevel development, web or mobile work, or email thedevzubair@gmail.com directly.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell trail={[{ name: "Contact", href: "/contact" }]}>
      <h1 className="text-4xl font-bold text-white">Start a Project</h1>
      <p className="mt-4 max-w-3xl text-lg text-white/80">
        Describe the process you want automated or the application you want
        built — what happens today, who does it, and what it costs you when it
        goes wrong. The reply will say whether it is something {site.firstName}{" "}
        takes on, and what the next step costs.
      </p>

      <section aria-labelledby="send" className="mt-12">
        <h2 id="send" className="text-2xl font-bold text-white">
          Send a message
        </h2>
        <ContactForm email={site.email} />
      </section>

      <section aria-labelledby="reach" className="mt-16">
        <h2 id="reach" className="text-2xl font-bold text-white">
          How to reach him
        </h2>
        <dl className="mt-6 divide-y divide-white/15 border-y border-white/15">
          <div className="flex flex-wrap gap-x-6 py-3">
            <dt className="w-40 shrink-0 text-white/70">Email</dt>
            <dd>
              <a
                href={`mailto:${site.email}`}
                className="text-white underline underline-offset-4"
              >
                {site.email}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-6 py-3">
            <dt className="w-40 shrink-0 text-white/70">Location</dt>
            <dd className="text-white">
              {site.location.locality}, {site.location.country} (
              {site.location.timezone})
            </dd>
          </div>
          {/* A reply-time promise. Gated until confirmed; see lib/commitments.mjs. */}
          {replyTime ? (
            <div className="flex flex-wrap gap-x-6 py-3">
              <dt className="w-40 shrink-0 text-white/70">Reply time</dt>
              <dd className="text-white">{replyTime}</dd>
            </div>
          ) : null}
          {site.socials.map((social) => (
            <div key={social.url} className="flex flex-wrap gap-x-6 py-3">
              <dt className="w-40 shrink-0 text-white/70">{social.label}</dt>
              <dd>
                <a
                  href={social.url}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="text-white underline underline-offset-4"
                >
                  {social.handle}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="what-to-include" className="mt-16">
        <h2 id="what-to-include" className="text-2xl font-bold text-white">
          What to include
        </h2>
        <ul className="mt-6 max-w-3xl list-disc space-y-2 pl-6 text-white/80">
          <li>The process or product, described as it works today.</li>
          <li>Who currently does it, and roughly how long it takes them.</li>
          <li>The systems already involved — platforms, spreadsheets, inboxes.</li>
          <li>Whether this is direct or white-label through an agency.</li>
          <li>Any date the work has to land by.</li>
        </ul>
      </section>

      <section aria-labelledby="services-list" className="mt-16">
        <h2 id="services-list" className="text-2xl font-bold text-white">
          What he takes on
        </h2>
        <ul className="mt-6 space-y-2">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="text-white underline underline-offset-4"
              >
                {service.title}
              </Link>
              {service.shape ? (
                <span className="text-white/70"> — {service.shape}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
