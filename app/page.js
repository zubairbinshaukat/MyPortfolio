import { Hero } from "./Components/Hero";
import SiteNav from "@/components/SiteNav";
import SectionReadout from "@/components/SectionReadout";
import Preloader from "@/components/Preloader";
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
 * The band renders before the hero and overlays it — `overlay` makes it
 * `fixed`, so the hero keeps its full `h-dvh` and nothing is pushed down. That
 * is the design's resting band, and it is where PLAN §3.4's top-right
 * collision is resolved: the index trigger takes the corner, the social pill
 * takes the centre, and the hero carries no chrome at all.
 *
 * THE DOT RAIL IS GONE
 *
 * §3.4 says the rail "either becomes a scroll-progress indicator or it goes —
 * decide, don't leave it stranded". It goes, for three reasons and not one:
 *
 *   The band already has a scroll-progress indicator, and it is the one the
 *   design specifies — a 1px gradient hairline across the full width, the only
 *   place the design note allows the gradient to run edge to edge. Promoting
 *   the rail would have been a second answer to a question already answered.
 *
 *   It overlapped the portrait at 390 and 639, which is what §3.4 reports and
 *   what docs/post-migration/ shows at every captured width.
 *
 *   Five dots labelled hero / about / projects / testimonials / contact
 *   described a five-section machine that Phase 1 deleted. Three of those
 *   sections no longer exist under those names. It was not a control that had
 *   lost its handler; it was a diagram of a site that is not this one.
 */
export const metadata = {
  // The layout's `default` title already carries the full lockup, so the
  // template must not append the name a second time.
  title: {
    absolute: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
  },
  alternates: { canonical: "/" },
};

/**
 * The homepage's own ledger. One array, three consumers: the section ids the
 * band's readout observes, the numbers printed above each section, and the
 * order they render in. They cannot fall out of step because there is only one
 * copy of them.
 */
const SECTIONS = [
  { id: "services", n: "01", label: "What I do", Component: ServicesGrid },
  { id: "work", n: "02", label: "Selected work", Component: SelectedWork },
  { id: "how-i-work", n: "03", label: "How I work", Component: HowIWork },
  { id: "voices", n: "04", label: "Testimonials", Component: Testimonials },
  { id: "faq", n: "05", label: "FAQ", Component: Faq },
  { id: "contact", n: "06", label: "Contact", Component: ContactCta },
];

export default function Home() {
  return (
    <>
      <SchemaOrg />
      <JsonLd graph={faqGraph()} />

      <SiteNav
        overlay
        readout={
          <SectionReadout
            sections={SECTIONS.map(({ id, n, label }) => ({ id, n, label }))}
          />
        }
      />

      <Hero />

      {/*
        The intro overlay (PLAN §3.3). Homepage only, and last in the tree.

        Not in the root layout, because a first visit that lands on a blog post
        from a search result came for the post: an overlay reciting the site's
        name over it would be theatre charged to a reader who did not ask for
        the brand. The homepage is where the name is the content.

        It renders nothing until after hydration and nothing at all on a
        repeat visit in the same session — see components/Preloader.js — so
        this line adds no markup to the server HTML of any page including this
        one, which is the §3.3 condition the whole design turns on.
      */}
      <Preloader />

      {/*
        `data-snap-root` opts the document scroller into PLAN §3.1's
        section-to-section snapping; `data-snap` marks each stop. Both are read
        twice — by `html:has([data-snap-root])` in app/globals.css, which is
        the no-JavaScript path, and by components/SmoothScroll.js, which hands
        the same node list to `lenis/snap` once Lenis is running. One set of
        markers, two mechanisms, and nowhere for them to fall out of step with
        the sections themselves.

        The marker is on this <main> and not on a wrapper, because only the
        homepage may opt in: PageShell renders a <main> too, and a selector
        that matched it would snap every inner page to its own single section.

        The hero carries the seventh `data-snap` inside app/Components/Hero.js.
        Without a stop at the top of the document, proximity snapping near the
        first section's edge has only one candidate — downwards — and scrolling
        back up out of "What I do" gets pulled straight back into it.
      */}
      <main id="main" data-snap-root className="relative z-[1]">
        {SECTIONS.map(({ id, n, Component }) => (
          <Component key={id} id={id} n={n} />
        ))}
      </main>
    </>
  );
}
