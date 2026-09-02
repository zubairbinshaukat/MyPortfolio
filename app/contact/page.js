import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import { navEntry, site, replyTime } from "@/lib/site";
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

const entry = navEntry("/contact");

export default function ContactPage() {
  return (
    <PageShell
      trail={[{ name: "Contact", href: "/contact" }]}
      readout={`${entry.n} — ${entry.label}`}
    >
      <PageHeader
        n={entry.n}
        eyebrow={entry.label}
        title="Start a Project"
        lede={`Describe the process you want automated or the application you want built — what happens today, who does it, and what it costs you when it goes wrong. The reply will say whether it is something ${site.firstName} takes on, and what the next step costs.`}
      />

      <div className="mt-[52px] flex flex-wrap gap-x-14 gap-y-10">
        <section aria-labelledby="send" className="flex-[1_1_420px]">
          <SectionHeading id="send">{entry.n}.1 Send a message</SectionHeading>
          <ContactForm email={site.email} />
        </section>

        <div className="flex-[1_1_260px]">
          <section aria-labelledby="reach">
            <SectionHeading id="reach">{entry.n}.2 Or skip the form</SectionHeading>
            <a
              href={`mailto:${site.email}`}
              className="mt-4 block border-b border-accent-line pb-[6px] text-[19px] font-medium text-heading no-underline transition-colors duration-300 ease-ease hover:border-white"
            >
              {site.email}
            </a>
            <p className="mb-[26px] mt-[14px] text-[14px] leading-[1.7] text-body">
              Attach the spreadsheet, the recording, or the list of complaints.
              That is a better brief than a form.
            </p>

            <dl>
              <div className="flex justify-between gap-[14px] border-b border-hairline-soft py-[10px]">
                <dt className="font-mono text-metadata uppercase text-meta">
                  Location
                </dt>
                <dd className="text-right text-[14px] text-strong">
                  {site.location.locality}, {site.location.country} (
                  {site.location.timezone})
                </dd>
              </div>

              {/* A reply-time promise. Gated until confirmed; see lib/commitments.mjs. */}
              {replyTime ? (
                <div className="flex justify-between gap-[14px] border-b border-hairline-soft py-[10px]">
                  <dt className="font-mono text-metadata uppercase text-meta">
                    Reply time
                  </dt>
                  <dd className="text-right text-[14px] text-strong">{replyTime}</dd>
                </div>
              ) : null}

              {site.socials.map((social) => (
                <div
                  key={social.url}
                  className="flex justify-between gap-[14px] border-b border-hairline-soft py-[10px]"
                >
                  <dt className="font-mono text-metadata uppercase text-meta">
                    {social.label}
                  </dt>
                  <dd className="text-right text-[14px]">
                    <a
                      href={social.url}
                      rel="me noopener noreferrer"
                      target="_blank"
                      className="text-heading underline decoration-accent-line underline-offset-4"
                    >
                      {social.handle}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="what-to-include" className="mt-12">
            <SectionHeading id="what-to-include">
              {entry.n}.3 What to include
            </SectionHeading>
            <ul className="mt-4 flex flex-col gap-[11px]">
              {[
                "The process or product, described as it works today.",
                "Who currently does it, and roughly how long it takes them.",
                "The systems already involved — platforms, spreadsheets, inboxes.",
                "Whether this is direct or white-label through an agency.",
                "Any date the work has to land by.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-[11px] text-[14.5px] leading-[1.65] text-body"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-[5px] w-[5px] flex-none rounded-full bg-accent"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section aria-labelledby="services-list" className="mt-14">
        <SectionHeading id="services-list">
          {entry.n}.4 What he takes on
        </SectionHeading>
        <ul className="mt-[22px]">
          {services.map((service) => (
            <li
              key={service.slug}
              className="group relative flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hairline py-4"
            >
              <h3 className="flex-1 font-display text-item-h3 text-heading">
                <Link
                  href={`/services/${service.slug}`}
                  className="no-underline after:absolute after:inset-0 after:content-['']"
                >
                  {service.title}
                </Link>
              </h3>
              {service.shape ? (
                <span className="font-mono text-metadata uppercase text-meta">
                  {service.shape}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
