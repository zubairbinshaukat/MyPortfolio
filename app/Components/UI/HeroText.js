import { HelloCard } from "@/components/ui/hello-card";
import React from "react";

/**
 * The hero lockup, in the two variants the layout switches between.
 *
 * THE ONE <h1>
 *
 * Both variants are always in the HTML — the desktop one inside a `sm:flex
 * hidden` column, the mobile one inside a `sm:hidden` block — because the
 * switch is CSS, not JavaScript. That is what produced two of the four <h1>
 * elements PLAN §2 reports on the homepage, with the "Hi!" badge producing the
 * other two. scripts/check-meta.mjs pinned the number at four rather than
 * fixing it, because §0.2 froze these files until Phase 3.
 *
 * The heading is on the **mobile** variant, and the desktop one is a <p>.
 * Google indexes mobile-first: the crawl that decides how this page is
 * understood renders at a phone width, where the mobile lockup is the visible
 * one. Whichever variant is demoted ends up as a `display: none` element in
 * the other layout; putting the surviving heading where the indexing crawler
 * can see it painted is the version of that trade with something to gain.
 *
 * Nothing else changes. The classes on both elements are untouched, and
 * Tailwind's preflight already sets `font-size: inherit; font-weight: inherit`
 * on every heading level, so an <h1> and a <p> under this class list produce
 * the same box.
 *
 * `data-hero-lockup` is the handoff hook for PLAN §3.3's intro overlay: the
 * lockup is held at y=20 and opacity 0 while the overlay is up and settles as
 * the last panel leaves, so the reveal and the hero's own entrance read as one
 * move. The rules live in app/globals.css and match nothing unless the
 * overlay has actually mounted — which it does on a first visit per session,
 * with reduced motion off, and never otherwise.
 */
const HeroText = ({ variant = "desktop" }) => {
  if (variant === "mobile") {
    return (
      <div
        data-hero-lockup
        className="sm:hidden flex flex-col justify-center w-full h-[50%] pl-8"
      >
        <HelloCard />
        <p className="text-white font-bold text-2xl font-font2 mt-2">{"I'm"}</p>
        <h1 className="md:text-7xl text-5xl lg:text-[108px] font-font2 font-bold dark:text-white text-black relative z-20 ">
          ZUBAIR
        </h1>
        <div className=" bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 -mt-6">
          <span className="text-5xl lg:text-8xl md:text-7xl font-medium font-font0">
            Bin Shaukat
          </span>
        </div>
      </div>
    );
  }

  // Default to desktop
  return (
    <div data-hero-lockup className="flex flex-col">
      <HelloCard />
      <p className="text-white font-bold text-2xl font-font2 mt-2">{"I'm"}</p>
      {/*
        The desktop lockup is a <p>, not the <h1>. See the note above the
        mobile variant: both variants are in the HTML at every width and only
        one of them may be the heading.

        Preflight resets an <h1> to inherited size and weight, so the two tags
        render identically under this class list — verified against
        docs/phase3/ at all four widths.
      */}
      <p className="md:text-7xl text-5xl lg:text-[108px] font-font2 font-bold text-white relative z-20 ">
        ZUBAIR
      </p>
      <div className=" bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 -mt-6">
        <span className="text-5xl lg:text-8xl md:text-7xl font-medium font-font0">
          Bin Shaukat
        </span>
      </div>
    </div>
  );
};

export default HeroText;
