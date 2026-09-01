import Link from "next/link";
import { site } from "@/lib/site";

/** Closing call to action. One link to /contact, one mailto fallback. */
export default function ContactCta() {
  return (
    <section aria-labelledby="cta" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="cta" className="text-3xl font-bold text-white">
        Start a project
      </h2>
      <p className="mt-3 max-w-2xl text-white/80">
        Describe the process you want automated or the application you want
        built. The reply will say whether it is something {site.firstName} takes
        on, and what the next step costs.
      </p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <Link
          href="/contact"
          className="text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
        >
          Get in touch
        </Link>
        <a
          href={`mailto:${site.email}`}
          className="text-white/90 underline underline-offset-4 hover:text-white"
        >
          {site.email}
        </a>
      </p>
    </section>
  );
}
