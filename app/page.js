import { Hero } from "./Components/Hero";
import SiteNav from "@/components/SiteNav";
import SchemaOrg from "@/components/SchemaOrg";
import JsonLd from "@/components/JsonLd";
import ServicesGrid from "@/components/sections/ServicesGrid";
import SelectedWork from "@/components/sections/SelectedWork";
import HowIWork from "@/components/sections/HowIWork";
import Testimonials from "@/components/sections/Testimonials";
import Faq from "@/components/sections/Faq";
import ContactCta from "@/components/sections/ContactCta";
import { faqGraph } from "@/lib/schema";

/**
 * The homepage.
 *
 * This was a client component that swapped five sections through one DOM slot
 * on hijacked wheel and touch events. Four of the five never reached the
 * server HTML at all, which made four fifths of the site invisible to a
 * crawler. It is now an ordinary scrolling server-rendered page: every word
 * below is in the HTML before any JavaScript runs.
 *
 * The hero is imported unchanged and rendered first, with nothing above it —
 * anything in front would shift it and break the visual contract in
 * docs/post-migration/. That is also why the navigation comes after the hero
 * here rather than from the root layout.
 */
export const metadata = {
  // The layout's `default` title already carries the full lockup, so the
  // template must not append the name a second time.
  title: {
    absolute: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
  },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SchemaOrg />
      <JsonLd graph={faqGraph()} />

      <Hero />
      <SiteNav />

      <main id="main">
        <ServicesGrid />
        <SelectedWork />
        <HowIWork />
        <Testimonials />
        <Faq />
        <ContactCta />
      </main>

      {/*
        Scroll indicator, inert. The section machine it used to drive is gone;
        PLAN §1.3 keeps the markup so the hero stays pixel-identical and §3.4
        decides whether it becomes a scroll-progress indicator or is removed.
        Rendered as plain elements rather than buttons — an unlabelled button
        that does nothing is an accessibility failure, decoration is not.
      */}
      <div
        aria-hidden="true"
        className="fixed sm:right-6 right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4"
      >
        {["hero", "about", "projects", "testimonials", "contact"].map(
          (section, index) => (
            <div key={section} className="relative">
              <div
                // The first dot kept a 1.25 scale while it was the "active"
                // one. Framer Motion applied that inline; reproducing it here
                // is what keeps this pixel-identical to docs/post-migration/.
                style={index === 0 ? { transform: "scale(1.25)" } : undefined}
                className={`sm:w-3 sm:h-3 w-2.5 h-2.5 rounded-full ${
                  index === 0
                    ? "bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 shadow-lg shadow-purple-500/50"
                    : "bg-gray-400"
                }`}
              />
            </div>
          )
        )}
      </div>
    </>
  );
}
