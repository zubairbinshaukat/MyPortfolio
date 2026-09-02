import Link from "next/link";
import { nav, site } from "@/lib/site";
import ScrollProgress from "./ScrollProgress";
import IndexBehaviour from "./IndexBehaviour";
import SocialPill from "./SocialPill";

/**
 * PLAN §3.2: the band is the one element in the same place on every route, so
 * it is what a reader's eye holds still while the page under it changes.
 * Naming it lifts it out of the page's view-transition snapshot into a group
 * of its own, and app/globals.css tells that group not to animate — the
 * content crossfades and lifts, the chrome does not.
 *
 * A view-transition-name has to be unique in the document while a transition
 * runs. Exactly one SiteNav renders per page, which is what makes a constant
 * safe here; a name on anything that repeats would have to be derived from the
 * item, the way the project and post rows derive theirs.
 */
const BAND_TRANSITION_NAME = { viewTransitionName: "site-band" };

/**
 * The sticky band and the full-screen index behind it.
 *
 * WHY THERE IS NO MENU BAR
 *
 * The design note defends this as its first decision: the hero already floats
 * a social pill and a dot rail, so a horizontal menu would make the top of the
 * site a shelf of pills. Instead the band carries a monogram, a readout and
 * one Index trigger, and the navigation itself is a full-screen typographic
 * index — the same one at 390px and at 1440px. One nav to build, one nav to
 * maintain, and a 44px target at every width.
 *
 * WHY IT IS A <details>
 *
 * The governing rule (PLAN §0.1) is that the site works with JavaScript
 * disabled. A React-state overlay would render the links into the HTML and
 * then have no way to reveal them. `<details>`/`<summary>` opens natively,
 * exposes its own expanded state to assistive technology, and needs no
 * hydration at all — so with JavaScript off, the Index button still opens the
 * index and every link still works.
 *
 * WHY THIS FILE IS A SERVER COMPONENT
 *
 * PLAN §2.1: server components by default, `"use client"` only where there is
 * real interactivity. Written as one client component this was measured at
 * 8.8 KB brotli on every route, almost all of it static markup shipped twice —
 * once as HTML and once as the JavaScript that would rebuild it. The three
 * genuinely interactive parts are separate islands: the scroll-progress line,
 * the homepage's section readout, and the keyboard and scroll behaviour of the
 * panel. IndexBehaviour renders nothing at all; it attaches to the element
 * below by id.
 *
 * WHERE IT SITS, AND THE TWO STATES
 *
 * The prototype draws this band in two states — "at rest and condensed" — and
 * `overlay` is which one a page starts in.
 *
 *   overlay   the homepage. The band is `fixed` over the top of the hero, so
 *             the hero keeps its full `h-dvh` instead of being pushed down by
 *             66px of chrome. At rest its background is transparent and it is
 *             just a monogram and an index trigger floating on the hero, which
 *             is the design's resting band; past the hero it fades in its
 *             surface and becomes the condensed one.
 *
 *   sticky    every other page. There is no hero to sit over, so the band is
 *             in flow and opaque from the first pixel.
 *
 * The background is opaque in the server HTML and the client removes it at
 * scroll 0 — the safe way round. With JavaScript off the band keeps its
 * surface everywhere, which is legible; the reverse would leave a transparent
 * band over body copy.
 */
export default function SiteNav({ readout, overlay = false }) {
  return (
    <div
      id="site-band"
      data-scrolled="true"
      style={BAND_TRANSITION_NAME}
      className={
        overlay
          ? "group/band fixed inset-x-0 top-0 z-50"
          : "group/band sticky top-0 z-50"
      }
    >
      {/*
        The band's own background is a separate layer, and it has to be.

        `backdrop-filter` makes an element a containing block for every
        fixed-position descendant — so with `backdrop-blur` on this wrapper,
        the index panel's `fixed inset-0` resolved against the 64px band
        instead of the viewport, and the full-screen overlay rendered as a
        64px strip. Moving the blur onto a sibling layer behind the content
        leaves the panel's fixed positioning resolving against the viewport,
        where it belongs.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-hairline bg-black/[0.86] backdrop-blur-[14px] transition-opacity duration-300 ease-ease group-data-[scrolled=false]/band:opacity-0"
      />

      <ScrollProgress />

      {/*
        LAYERING INSIDE THE BAND

        This wrapper is `z-50` against the page, and everything below is
        ordered inside that one stacking context:

          -z-10  the blurred background
           z-10  the index panel
           z-20  the controls and the progress line

        The panel has to be explicitly below the controls because it is a
        descendant of them — it lives inside the <details> that the Close
        button opens — and a positioned element paints above static content
        regardless of source order. Left unordered, the full-screen overlay
        covered the very button meant to dismiss it: visible in a screenshot,
        invisible to every check that does not look at pixels.
      */}
      {/*
        THREE COLUMNS, NOT A FLEX ROW

        `1fr auto 1fr` puts the pill in the exact centre of the band at every
        width, because the two `1fr` tracks are equal by definition however
        wide their contents are. The flex row it replaces centred the pill in
        whatever space the monogram and the Index trigger left over, which is
        not the centre — and the design draws the pill on the band's midline.

        It is also what lets the readout move to the left column without
        pushing the pill off centre. See the note on the centre column.
      */}
      <div className="mx-auto grid max-w-measure grid-cols-[1fr_auto_1fr] items-center gap-2 px-gutter py-[10px] min-[480px]:gap-3">
        <div className="flex min-w-0 items-center gap-3">
        {/*
          The monogram, drawn as a background image on a fixed 24×24 box.

          Not next/image: it would be the only thing on an inner page needing
          the image runtime, and that runtime measured 5.2 KB brotli on every
          route — more than the logo file itself — to resize a vector that is
          already the right size. Not a plain <img> either, which would trip
          `no-img-element`, and §0.3 rules out silencing it.

          A background image on a sized box has no intrinsic size to reserve,
          so it cannot shift, and the file is fetched once and cached across
          the whole site. It is decoration: the link's accessible name comes
          from `aria-label`, not from the mark.
        */}
        <Link
          href="/"
          className="relative z-20 flex min-h-tap items-center gap-3 text-heading"
          aria-label={`${site.name} — home`}
        >
          <span
            aria-hidden="true"
            className="block h-6 w-6 bg-[url('/logo.svg')] bg-contain bg-center bg-no-repeat"
          />
          </Link>

          {/*
            THE READOUT MOVED OUT OF THE CENTRE

            It used to share the centre slot with the social pill and replace it
            once a section came into view. That trade is wrong, and the reason
            is not visual: the four profile links are the only rendered proof of
            the `sameAs` array in the Person schema, and an entity claim that is
            visible for the first screenful and then disappears is a weaker
            signal than one that is always on the page. The pill keeps the
            centre permanently; the readout moved here, beside the monogram.

            It appears from 768px up. Below that the band is carrying a 24px
            mark, a 220px pill and a 44px trigger, and there is no room for a
            fifth thing — which is the honest version of "find the room
            elsewhere". Nothing is lost by dropping it there: every page prints
            the same ledger number in the eyebrow above its own <h1>, and on
            the homepage the readout is empty until a section is in view
            anyway.
          */}
          <span className="relative z-20 hidden min-w-0 truncate font-mono text-metadata uppercase text-meta md:block">
            {readout}
          </span>
        </div>

        {/*
          The centre column. The pill is here at every width and on every route
          — see components/SocialPill.js for why it is no longer conditional on
          the homepage.
        */}
        <div className="relative z-20 flex justify-center">
          <SocialPill />
        </div>

        {/*
          No `z-index` on the <details> itself, deliberately.

          Giving it one makes it a stacking context, and the panel inside it —
          which is `z-10` so that the band's own controls stay above the open
          overlay — is then sorted only against its siblings inside that
          context. The result was the social pill painting *behind* the open
          index while the Index trigger stayed in front of it: the band stopped
          reading as the overlay's header and started reading as half of one.
          See the layering note above.
        */}
        <details id="site-index" className="group justify-self-end">
          {/*
            The word goes below 480px, the target does not.

            Making room for the social pill on a 390px band meant taking 66px
            from somewhere, and the label is the only thing in the band that is
            duplicated: the control keeps its `aria-label`, so its accessible
            name is "Site index" at every width whether or not the word is
            painted, and `aria-expanded` still announces the state. What a
            phone loses is a word next to a glyph that already means menu; what
            it gains is four profile links that were not there at all.

            `min-w-tap` with the word gone leaves a 44x44 target rather than a
            43px one — the two bars are 15px wide and the padding is 14 a side.

            The open and close words are nested inside one responsive wrapper
            rather than each carrying both variants. Stacking `group-open:` and
            a breakpoint on the same element puts two rules in the same media
            block and leaves the outcome to Tailwind's variant sort order; one
            wrapper for the breakpoint and two children for the state has no
            ordering question in it.
          */}
          <summary
            className="relative z-20 flex min-h-tap min-w-tap cursor-pointer list-none items-center justify-center gap-[9px] rounded-full border border-edge bg-surface px-[14px] py-[10px] font-mono text-[11px] uppercase tracking-[0.18em] text-heading transition-colors duration-300 ease-ease hover:border-accent-line min-[480px]:px-4 [&::-webkit-details-marker]:hidden"
            aria-label="Site index"
          >
            <span className="hidden min-[480px]:block">
              <span className="group-open:hidden">Index</span>
              <span className="hidden group-open:inline">Close</span>
            </span>
            <span aria-hidden="true" className="flex flex-col gap-[3px]">
              <span className="block h-px w-[15px] bg-heading" />
              <span className="block h-px w-[9px] bg-heading transition-[width] duration-300 ease-ease group-open:w-[15px]" />
            </span>
          </summary>

          {/*
            The panel. Fixed and full-screen, and deliberately below the band's
            own controls — see the layering note above — so the band reads as
            the overlay's header and its one button both opens and closes it,
            exactly as the prototype shows it.
          */}
          {/*
            THE PANEL, AND WHY IT NO LONGER CARRIES A CSS ANIMATION

            It used to have `.animate-panel`, a one-shot clip-path wipe. That
            played on the first open of a page and never again, and the cause
            is worth writing down because it is not the obvious one.

            A closed <details> does not remove its content from the DOM. Modern
            Chrome renders it into `::details-content` and sets
            `content-visibility: hidden`, which *skips* the subtree rather than
            destroying it. Measured, with the index closed and never yet
            opened: `panel.getAnimations()` returns `panel-wipe` in state
            `running` at `currentTime` 0 — the animation exists and its clock
            is frozen. Opening the details lets the clock run and it plays.
            Closing freezes it again, at `finished`, `currentTime` 340. Opening
            a second time unfreezes an animation that has already finished and
            is filling its end state, so nothing moves.

            A CSS animation only starts over when its element re-enters the box
            tree from `display: none`, or when `animation-name` changes.
            `content-visibility: hidden` does neither. There is no arrangement
            of CSS classes on this element that plays on every open.

            So the motion moved to components/IndexBehaviour.js and the Web
            Animations API, where every open constructs a new Animation object
            and replay is what the mechanism does rather than something it has
            to be tricked into. These `data-index-*` attributes are what it
            binds to; with JavaScript off they mean nothing and the panel opens
            instantly, which is what a native <details> does and is correct.
          */}
          <div
            data-index-panel
            className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-black/[0.97] pt-16"
          >
            <div
              data-index-wash
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(168,85,247,0.14)_0%,transparent_65%)]"
            />

            <nav
              aria-label="Site"
              className="relative flex flex-1 flex-col justify-center px-gutter py-6"
            >
              <ul className="mx-auto w-full max-w-measure">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-index-link
                      className="flex items-baseline gap-4 border-b border-hairline-soft py-[9px] no-underline transition-colors duration-300 ease-ease hover:bg-white/[0.03]"
                    >
                      <span className="w-[26px] flex-none font-mono text-[10.5px] text-meta">
                        {item.n}
                      </span>
                      <span className="flex-1 font-display text-menu text-heading">
                        {item.label}
                      </span>
                      <span className="hidden font-mono text-[10px] text-meta sm:block">
                        {item.blurb}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/*
              The overlay's footer row, and the primary path to the profiles at
              every width (PLAN §3.4).

              The band's pill is a set of two-letter marks; this is the same
              four profiles written out, with their names, at every width. Both
              are always present — the pill for recognition, this for reading —
              and both are plain anchors inside a <details> that opens with
              JavaScript disabled.

              `rel="me"` matches the footer's. It is the microformats claim
              that these profiles are the same person as the page's subject,
              and it is the on-site half of the bidirectional relationship
              PLAN §4.1 asks each profile to complete.
            */}
            <div
              data-index-foot
              className="relative mx-auto flex w-full max-w-measure flex-wrap items-center gap-x-[26px] gap-y-[14px] border-t border-hairline px-gutter py-6"
            >
              <a
                href={`mailto:${site.email}`}
                className="flex min-h-tap items-center border-b border-accent-line text-[14px] text-heading no-underline"
              >
                {site.email}
              </a>

              <ul className="flex flex-wrap items-center gap-x-[18px]">
                {site.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="flex min-h-tap items-center font-mono text-metadata uppercase text-meta no-underline transition-colors duration-300 ease-ease hover:text-heading"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>

              <span className="font-mono text-metadata uppercase text-meta">
                {site.location.locality}, {site.location.countryCode} ·{" "}
                {site.location.timezone}
              </span>
            </div>
          </div>
        </details>

        <IndexBehaviour targetId="site-index" />
      </div>
    </div>
  );
}
