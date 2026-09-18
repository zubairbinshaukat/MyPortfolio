import { INTRO_COOKIE } from "@/lib/intro.mjs";

/**
 * The intro overlay (PLAN §3.3), rendered by the server.
 *
 * WHY THIS IS NOT components/Preloader.js ANY MORE
 *
 * The previous implementation was a client component that mounted itself after
 * hydration, over a page the browser had already painted. §3.3's rule was
 * "a cosmetic overlay on top of already-rendered HTML, never a gate in front
 * of it", and it obeyed that rule exactly — which turned out to be the bug.
 *
 * Measured on a production build at 1440x900, four loads:
 *
 *   content painted (FCP = LCP)   740ms   524ms   1120ms   5720ms (cold)
 *   overlay first in the DOM     1583ms  1469ms   1539ms   5718ms
 *   ------------------------------------------------------------------
 *   finished hero on screen,      843ms   945ms    419ms       0ms
 *   uncovered, before the
 *   curtain dropped over it
 *
 * So the reader watched the hero arrive, then watched it get covered up, then
 * watched it arrive a second time. The component's own notes attribute the
 * mount to the `largest-contentful-paint` entry, but that observer is created
 * with `buffered: true`, so on any normal load the entry is already in the
 * buffer and is delivered in the same task the observer is registered in.
 * The real gate was never LCP. It was hydration, and hydration lands about a
 * second after the paint on this route — the particle engine and the motion
 * bundle both arrive in that window.
 *
 * No amount of tuning inside a client component fixes that, because React
 * cannot render anything before it hydrates. So the curtain moved into the
 * prerendered HTML, where it is painted in the same frame as everything
 * underneath it and there is no moment at which the page is visible and the
 * overlay is not.
 *
 * WHAT THAT COST, STATED PLAINLY
 *
 * §3.3's "never a gate in front of it" no longer holds: this is a gate. The
 * two assertions in scripts/check-preloader.mjs that encoded the old rule —
 * zero preloader markup in the prerendered HTML, and no LCP candidate at or
 * after the overlay exists — were rewritten rather than worked around, and
 * that file now records what was measured before and after the change.
 *
 * THE SEQUENCE RUNS WITHOUT REACT
 *
 * Every movement is a CSS animation with a delay, keyed off a `data-intro`
 * attribute set by the inline script below. Nothing here waits for hydration
 * and nothing here is a React state change, which has one consequence worth
 * being explicit about: the exit cannot get stuck. If the script throws after
 * setting the attribute, if the bundle never arrives, if hydration fails
 * outright, the panels still leave at 1120ms and the layer still stops
 * existing for hit-testing at 1580ms, because that is a keyframe and not a
 * callback. The old design had the opposite failure mode — a React timer that
 * never fired left a curtain over the page forever.
 *
 * JavaScript is used for two things and nothing else: deciding whether this
 * page view gets the overlay at all, and ending the sequence early on the
 * first click or keypress. The counter used to be the third — fifteen lines of
 * requestAnimationFrame — and it had to go for the same reason the exit did.
 * Measured, rAF did not run between 30ms and 1040ms on a cold load, so the
 * number sat at 000 and then jumped to 087. The numbers are in the
 * `[data-intro-counter]` memo in app/globals.css.
 */

/** The name, in Soria, one span per glyph so each can be wiped separately. */
const NAME = "ZUBAIR";

/**
 * The boot lines. They are honest: these are four things the page actually
 * did, in the order it did them, and the last one is true before the overlay
 * is even visible. A fake progress log is the kind of detail that reads as a
 * lie the second time somebody sees it.
 */
const BOOT_LINES = [
  "init zubyr.dev",
  "typefaces — soria, alex brush",
  "entity — zubair bin shaukat",
  "hero — painted",
];

/**
 * The milestones, in ms from the first frame. The `html[data-intro]` block in
 * app/globals.css derives every `animation-delay` from the same numbers, and
 * the arithmetic is written out in full there so the two can be checked
 * against each other by reading. The only one the inline script below still
 * needs is the total, for the tidy-up.
 */
const EXIT_AT = 1120;
const EXIT_DURATION = 460; // 2 x 60ms stagger + 340ms panel = 460ms
const TOTAL = EXIT_AT + EXIT_DURATION; // 1580ms

/**
 * The pre-paint decision, as a string of JavaScript in the document.
 *
 * It has to be inline and it has to be synchronous. An external or deferred
 * script runs after the parser has already reached the hero, which is the
 * failure this whole change exists to remove: the attribute must be on <html>
 * before the first paint, so that the curtain below is never a box the browser
 * has laid out and then had to cover.
 *
 * Every exit here is silent and leaves the attribute unset, which is the state
 * in which the curtain is `display: none`. That matters more than it looks:
 *
 *   No JavaScript, a crawler, or `curl` — no attribute, no curtain, and the
 *   HTML underneath is the finished page. The markup is present but inert.
 *   scripts/check-nojs.mjs covers this.
 *
 *   Reduced motion — checked first, and not overridable. §3.3 is unambiguous
 *   that the overlay is skipped entirely, not shortened.
 *
 *   A second page view in the same session — a session cookie with no expiry,
 *   which is what "once per session" has to mean. The cookie is written in the
 *   same statement that sets the attribute, so a view that gets the overlay
 *   and a view that records having seen it are the same view.
 *
 * `decision`-as-a-side-effect was the bug in the old client version: an effect
 * that wrote the cookie and then, under React Strict Mode's double invocation,
 * read back what it had just written and concluded the intro was already
 * spent. That cannot recur here. This script runs once per document, during
 * parse, and React never runs it.
 */
function bootScript() {
  return `(function(){
var d=document.documentElement;
try{
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(document.cookie.indexOf("${INTRO_COOKIE}=1")>-1)return;
d.dataset.intro="playing";
document.cookie="${INTRO_COOKIE}=1; path=/; SameSite=Lax";
}catch(e){return}
function skip(){if(d.dataset.intro==="playing")d.dataset.intro="settling";off()}
function off(){removeEventListener("pointerdown",skip);removeEventListener("keydown",skip)}
addEventListener("pointerdown",skip);
addEventListener("keydown",skip);
setTimeout(function(){off();d.dataset.intro="done"},${TOTAL});
})();`;
}

export default function IntroCurtain() {
  return (
    <>
      {/*
        The one script on the site that cannot be a next/script <Script>. Its
        cheapest strategy is `beforeInteractive`, which still emits a tag the
        parser reaches after the body has begun, and "before interactive" is
        not the same as "before paint".
      */}
      <script dangerouslySetInnerHTML={{ __html: bootScript() }} />

      {/*
        `aria-hidden`, and nothing inside is focusable. A screen reader reads
        the page underneath, which is finished and correct, while this plays
        over it. The skip listeners are on the window rather than on this
        element, so a keyboard user's first Tab both dismisses the overlay and
        moves focus.

        This element is first in the homepage's tree on purpose. It is
        `position: fixed`, so DOM order has no bearing on where it paints — but
        it does decide when the parser reaches it, and it has to be before the
        hero for the hero to never be seen uncovered.
      */}
      <div
        aria-hidden="true"
        data-intro-overlay
        className="fixed inset-0 z-[200] overflow-hidden"
      >
        {/*
          The ground, in three vertical panels. They are the overlay's
          background rather than a separate curtain over it, which is why the
          exit reads as the page being uncovered instead of a sheet being
          pulled off it.
        */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-intro-panel
            className="absolute inset-y-0 w-1/3 bg-ground"
            style={{
              left: `${i * (100 / 3)}%`,
              // 0.34% of extra width per panel: three panels at exactly
              // 33.333% leave a hairline of the hero showing through the seams
              // on fractional device pixel ratios.
              width: "33.7%",
              "--i": i,
            }}
          />
        ))}

        <div data-intro-content className="absolute inset-0">
          {/* Boot lines, top-left, one after another. */}
          <ul className="absolute left-gutter top-gutter font-mono text-[10px] uppercase tracking-[0.22em] text-meta">
            {BOOT_LINES.map((line, i) => (
              <li
                key={line}
                className="animate-intro-line py-[3px]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {line}
              </li>
            ))}
          </ul>

          {/*
            The name, in the Soria the hero has already preloaded — §3.3's "no
            fonts of its own" is not a restriction here, it is the reason the
            reveal can start at 260ms instead of after a font request.

            One span per glyph, each with a clip-path rising through it. The
            wipe is on an inner span so the outer one keeps its box: clipping
            an inline element that is also a flex item is how you get a name
            that reflows halfway through its own reveal.
          */}
          <p className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 font-font2 text-[clamp(2.5rem,10vw,6rem)] leading-none text-heading">
            {NAME.split("").map((char, i) => (
              <span key={`${char}-${i}`} className="block overflow-hidden">
                <span
                  className="animate-intro-glyph block"
                  style={{ animationDelay: `${260 + i * 60}ms` }}
                >
                  {char}
                </span>
              </span>
            ))}
          </p>

          {/*
            Two hairlines drawing outward from the centre, with a dot on each.
            §3.3 calls them "a flat foreshadow of the hero" — the hero's own
            divider is a 1px gradient rule with a glow under it, and this is
            that rule before it has anything to divide.
          */}
          <div className="absolute left-1/2 top-[calc(50%+clamp(2.6rem,7vw,4.4rem))] w-[min(78vw,760px)] -translate-x-1/2">
            <div
              className="animate-intro-rule h-px w-full origin-center bg-[linear-gradient(to_right,transparent,rgba(168,85,247,0.55),rgba(236,72,153,0.55),transparent)]"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="animate-intro-rule mt-[26px] h-px w-full origin-center bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.14),transparent)]"
              style={{ animationDelay: "340ms" }}
            />
          </div>

          {/*
            The counter, bottom-right. Empty, deliberately: its digits are a
            CSS counter painted into `::before`, and its curve, its plateau and
            its own entrance are all in the `[data-intro-counter]` block in
            app/globals.css. See the memo there for why it is not the fifteen
            lines of requestAnimationFrame it used to be.

            `tabular-nums` is what stops the number shifting as it climbs, and
            it matters more here than it looks: the element is anchored
            bottom-right, so proportional digits would walk its left edge
            around for the whole 940ms.
          */}
          <p
            data-intro-counter
            className="absolute bottom-gutter right-gutter font-mono text-[clamp(1.5rem,4vw,2.25rem)] tabular-nums text-meta"
          />
        </div>
      </div>
    </>
  );
}
