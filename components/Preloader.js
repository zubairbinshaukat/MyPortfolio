"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { INTRO_COOKIE } from "@/lib/intro.mjs";

/**
 * The intro overlay (PLAN §3.3).
 *
 * WHAT IT IS NOT
 *
 * It is not a loading screen. The page is static, prerendered and fully
 * painted before this component exists: the HTML arrives complete, the hero
 * renders, and only then — after hydration — does an overlay mount on top of
 * something that is already there. §3.3 states the rule as "a cosmetic overlay
 * on top of already-rendered HTML, never a gate in front of it", and every
 * decision below follows from it:
 *
 *   Nothing renders on the server, nothing renders during hydration, and
 *   nothing renders in the frame hydration commits in. `show` starts false and
 *   is only set true from a `requestAnimationFrame` scheduled by an effect, so
 *   the initial HTML contains zero preloader markup, hydration has nothing to
 *   reconcile, and the hero has already been painted by the time anything is
 *   drawn over it. A crawler never sees it. `curl` never sees it.
 *
 *   It is `position: fixed`, so it reserves no space and cannot shift
 *   anything. CLS contribution is structurally zero, not measured-to-be-zero.
 *
 *   It paints the page's own ground colour, so the moment it appears is
 *   invisible: black over black. The sequence is what you notice, not the
 *   arrival of a curtain.
 *
 * §3.3's defining condition is that PageSpeed is identical with it on and off.
 * scripts/check-preloader.mjs is the instrument: it measures LCP, CLS and the
 * LCP element on `/` with the overlay suppressed and with it running, three
 * runs each, and fails on a divergence. See docs/phase3/preloader.txt.
 *
 * WHY 1.6 SECONDS AND NOT 2.2
 *
 * §3.3 offers the choice and gives the reason: "the original concept existed
 * to mask a Three.js warm-up. There is no Three.js here … Consider 1.6 s". The
 * measured warm-up this could be hiding is tsParticles, which is dynamically
 * imported and fades itself in over a second anyway. There is nothing to
 * conceal, so the sequence is paced to be watched once rather than to fill a
 * gap: 1.58s from mount to the last panel leaving.
 *
 * NO LIBRARY
 *
 * §3.3's constraint is "pure DOM, CSS, GSAP. No canvas, no images, no fonts of
 * its own". It is pure DOM and CSS, and there is no GSAP: gsap plus
 * ScrollTrigger measured 40.9 KB brotli against a route already 30 KB over the
 * §2.3 budget, and every movement here is a keyframe with a delay. The one
 * thing CSS cannot express is the counter's easing curve — §3.3 asks it to
 * "hesitate near 87 before snapping", and that hesitation is the detail that
 * makes it read as a real measurement rather than a linear tween — so that,
 * and only that, is fifteen lines of requestAnimationFrame writing to one text
 * node. No React state changes per frame.
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
 * How long to wait for a `largest-contentful-paint` entry before starting
 * anyway. It only matters for a page that never reports one — a tab opened in
 * the background is the real case — where there is no recorded paint for the
 * overlay to come before.
 */
const LCP_CEILING_MS = 3000;

/** Milestones, in ms from mount. The CSS delays below are derived from these. */
const COUNT_START = 60;
const COUNT_DURATION = 940;
const HOLD_AFTER_COUNT = 120;
const EXIT_AT = COUNT_START + COUNT_DURATION + HOLD_AFTER_COUNT; // 1120ms
const PANEL_STAGGER = 60;
const PANEL_DURATION = 340;
const EXIT_DURATION = PANEL_STAGGER * 2 + PANEL_DURATION; // 460ms

/**
 * Whether this page view gets the overlay, decided once per page load.
 *
 * THE BUG THIS MEMO EXISTS TO FIX
 *
 * The decision used to be taken inline in the mount effect: read the media
 * query, read the cookie, write the cookie, arrange to mount. In development
 * that meant the overlay never appeared at all — not once, ever — and the
 * cause is React Strict Mode, which Next enables by default in `next dev`.
 *
 * Strict Mode deliberately runs every effect twice on mount: body, cleanup,
 * body again. The first body wrote `zb_intro=1`. The second body read the
 * cookie *it had just written* and concluded the session had already seen the
 * intro, so it returned before arranging anything. The effect had made itself
 * a liar in between its own two invocations.
 *
 * Measured, on the same commit:
 *
 *   next dev    cookie-set:zb_intro=1@607ms, overlay never mounts
 *   next start  cookie-set:zb_intro=1@207ms, overlay mounts@239ms, plays
 *
 * Which is why this was invisible to `check-preloader` — it runs against a
 * production build, where effects fire once — and completely visible to
 * anyone reviewing with `npm run dev`.
 *
 * The fix is that the decision is a value, computed once for the life of the
 * module and returned unchanged to every later caller, rather than a side
 * effect that reads its own output. The cookie write moved to the mount, where
 * it belongs. A second invocation now gets the same answer as the first, which
 * is what an idempotent guard means.
 */
let decision = null;

function shouldPlay() {
  if (decision !== null) return decision;

  /*
    Reduced motion first: §3.3 says the overlay is skipped entirely under it,
    and it is the one condition that must not be overridable.

    Then the development replay switch, then the session flag. A cookie with no
    expiry lives until the browser session ends, which is the definition §3.3
    asks for and the reason it rules out localStorage — a flag that outlived
    the session would mean the intro played exactly once ever, on one device.
  */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    decision = false;
  } else if (forcedReplay()) {
    decision = true;
  } else {
    decision = !document.cookie.includes(`${INTRO_COOKIE}=1`);
  }

  return decision;
}

/**
 * `?intro=replay` — review the sequence without clearing state.
 *
 * Development only. `process.env.NODE_ENV` is inlined by the bundler, so in a
 * production build this function is a constant `false` and the query string is
 * never read: the switch does not exist in the shipped bundle rather than
 * existing and being declined.
 *
 * It does not override reduced motion, which is checked first and is not a
 * preference a debugging flag gets to argue with.
 *
 * To see the sequence against a production build or a deployment, open the
 * site in a new private window — that is a new browser session, which is
 * exactly the condition the overlay keys on.
 */
function forcedReplay() {
  if (process.env.NODE_ENV === "production") return false;
  return new URLSearchParams(window.location.search).get("intro") === "replay";
}

/**
 * The counter's curve. Eased to 87, a beat of nothing, then the last thirteen
 * in a fifth of the time.
 *
 * The plateau is the whole point. A number that climbs smoothly to 100 is a
 * progress bar with no progress behind it and everyone knows it; a number that
 * stalls and then catches up looks like it is waiting for something.
 */
function counterAt(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 100;
  if (t < 0.55) {
    const p = t / 0.55;
    return Math.round(87 * (1 - (1 - p) * (1 - p)));
  }
  if (t < 0.8) return 87;
  return Math.round(87 + 13 * ((t - 0.8) / 0.2));
}

export default function Preloader() {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const counterRef = useRef(null);
  const timers = useRef([]);

  /**
   * Bring the sequence to its end early. Called by the timer that ends it and
   * by the first click or keypress, whichever happens first — §3.3 requires it
   * be skippable, and an overlay that ignores a click is worse than no overlay.
   *
   * It starts the exit rather than cutting to black-and-gone: the panels take
   * 460ms either way, so a skip still hands the page over deliberately instead
   * of blinking.
   */
  const beginExit = useCallback(() => {
    setExiting((already) => {
      if (already) return already;
      document.documentElement.dataset.intro = "settling";
      return true;
    });
  }, []);

  useEffect(() => {
    if (!shouldPlay()) return;

    /*
      WHEN THE OVERLAY IS ALLOWED TO EXIST

      §3.3's rule is that this goes on top of already-rendered HTML, and the
      test of it is that PageSpeed is identical with the overlay on and off. So
      the mount is gated on the browser having *recorded* the page's largest
      contentful paint, not on hydration having finished.

      The distinction is not theoretical. The first version waited one
      animation frame after hydration, and scripts/check-preloader.mjs — which
      compares the overlay's mount timestamp against the LCP entry's, in the
      same clock — found that on three runs in seven, hydration finished up to
      393ms *before* the portrait painted. On those runs the overlay existed
      while the page's LCP element had not been painted yet, which is exactly
      the "gate in front of content" shape, and it is invisible to every check
      that only looks at the finished page.

      The trigger is the `largest-contentful-paint` entry, and where that entry
      type exists it is the *only* trigger. The obvious second signal — `load`,
      whichever comes first — was tried and removed: measured, `load` can fire
      long before the first paint (in headless Chrome, 685ms against a first
      paint at 1728ms), and racing the two put the overlay back in front of an
      unpainted page on exactly the runs where the machine was slowest. A
      fallback that fires early is not a fallback, it is the bug with a
      different name.

      `load` remains the path for an engine that does not implement the entry
      type — Safari — which is also an engine where there is no LCP metric for
      the overlay to disturb. The timeout is a ceiling for the case where LCP
      is supported but never reported, which happens when a page is opened in a
      background tab; there is no recorded paint to come before in that case
      either.

      The frame after is what keeps the overlay out of the hydration commit, so
      it is composited over a page the browser has already put on screen rather
      than painted in the same pass as it.
    */
    let cancelled = false;
    let frame = 0;

    const mount = () => {
      if (cancelled) return;
      cancelled = true;
      frame = requestAnimationFrame(() => setShow(true));
    };

    let observer = null;
    if (typeof PerformanceObserver === "function") {
      try {
        observer = new PerformanceObserver(() => mount());
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // The entry type is unsupported. `load` below is the fallback, and it
        // is the reason this is a `try` rather than a feature test: the throw
        // is how a browser reports which entry types it knows.
        observer = null;
      }
    }

    let ceiling = 0;
    if (observer) {
      ceiling = window.setTimeout(mount, LCP_CEILING_MS);
    } else if (document.readyState === "complete") {
      mount();
    } else {
      window.addEventListener("load", mount, { once: true });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(ceiling);
      observer?.disconnect();
      window.removeEventListener("load", mount);
    };
  }, []);

  /**
   * The `playing` flag, set in a layout effect and not in the frame above.
   *
   * It is what holds the hero's lockup down and invisible behind the overlay,
   * and the two have to arrive in the same paint. Setting it alongside
   * `setShow(true)` did not: measured, there was a window in which the
   * attribute was on <html> and the overlay had not yet been committed, so the
   * hero rendered for a frame with its name missing and nothing covering it —
   * the one visible artefact the whole "cosmetic overlay on top of
   * already-rendered HTML" design exists to avoid.
   *
   * A layout effect runs after React has mutated the DOM and before the
   * browser paints, so the overlay and the rule that hides what is behind it
   * become true together. The cleanup removes the attribute on any unmount
   * path, which is what guarantees the hero cannot be left hidden.
   */
  useLayoutEffect(() => {
    if (!show) return;

    /*
      The session flag is written here, at the moment the overlay actually
      exists, and not when the decision to show it was made.

      Two things follow from that. A visit that never reaches this point —
      closed in the 200ms before the paint is recorded — has not spent its one
      showing. And the write happens exactly once per mount, after the memoised
      decision has already been taken, so it can no longer be read back as
      input by anything.
    */
    document.cookie = `${INTRO_COOKIE}=1; path=/; SameSite=Lax`;
    document.documentElement.dataset.intro = "playing";
    return () => {
      delete document.documentElement.dataset.intro;
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const node = counterRef.current;
    let frame = 0;
    /*
      The clock starts on the first frame the counter is actually painted in,
      not when this effect runs.

      Measured: on a cold load the main thread is busy for a few hundred
      milliseconds after hydration — the particle engine and the motion feature
      bundle both arrive there — and the first animation frame can be 700ms
      late. Timing from the effect meant the counter's first visible value was
      087: the climb and the hesitation that make it read as a measurement had
      both already happened, off screen, while nothing was being painted.

      Starting on the first frame also puts this on the same clock as the CSS
      animations beside it, which begin when their element is first rendered
      rather than when React decided to render it.
    */
    let started = 0;

    const tick = (now) => {
      if (!started) started = now;
      const t = (now - started - COUNT_START) / COUNT_DURATION;
      const value = counterAt(t);
      // textContent, not state. Sixty renders a second to print a number is
      // the kind of thing that shows up in Total Blocking Time.
      if (node) node.textContent = String(value).padStart(3, "0");
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onSkip = () => beginExit();
    window.addEventListener("pointerdown", onSkip, { once: true });
    window.addEventListener("keydown", onSkip, { once: true });

    const scheduled = timers.current;
    scheduled.push(window.setTimeout(beginExit, EXIT_AT));

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("keydown", onSkip);
      scheduled.forEach(window.clearTimeout);
      scheduled.length = 0;
    };
  }, [show, beginExit]);

  useEffect(() => {
    if (!exiting) return;
    const scheduled = timers.current;
    // Unmounting also removes `data-intro`, through the layout effect's
    // cleanup. The hero's settle is timed to finish on the same millisecond as
    // the last panel — see the note on `[data-intro="settling"]` in
    // app/globals.css — so there is no transition still running for the
    // attribute's removal to cut short.
    const done = window.setTimeout(() => setShow(false), EXIT_DURATION);
    scheduled.push(done);
    return () => window.clearTimeout(done);
  }, [exiting]);

  if (!show) return null;

  return (
    /*
      `aria-hidden`, and nothing inside is focusable. A screen reader reads the
      page underneath, which is finished and correct, while this plays over it.
      The skip listeners are on the window rather than on this element, so a
      keyboard user's first Tab both dismisses the overlay and moves focus.
    */
    <div
      aria-hidden="true"
      data-intro-overlay
      className="fixed inset-0 z-[200] overflow-hidden"
    >
      {/*
        The ground, in three vertical panels. They are the overlay's background
        rather than a separate curtain over it, which is why the exit reads as
        the page being uncovered instead of a sheet being pulled off it.
      */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`absolute inset-y-0 w-1/3 bg-ground transition-transform ease-ease ${
            exiting ? "-translate-y-full" : ""
          }`}
          style={{
            left: `${i * (100 / 3)}%`,
            // 0.34% of extra width per panel: three panels at exactly 33.333%
            // leave a hairline of the hero showing through the seams on
            // fractional device pixel ratios.
            width: "33.7%",
            transitionDuration: `${PANEL_DURATION}ms`,
            transitionDelay: `${i * PANEL_STAGGER}ms`,
          }}
        />
      ))}

      <div
        className={`absolute inset-0 transition-opacity duration-[160ms] ease-ease ${
          exiting ? "opacity-0" : "opacity-100"
        }`}
      >
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

          One span per glyph, each with a clip-path rising through it. The wipe
          is on an inner span so the outer one keeps its box: clipping an
          inline element that is also a flex item is how you get a name that
          reflows halfway through its own reveal.
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
          divider is a 1px gradient rule with a glow under it, and this is that
          rule before it has anything to divide.
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

        {/* The counter, bottom-right. */}
        <p
          ref={counterRef}
          className="animate-intro-line absolute bottom-gutter right-gutter font-mono text-[clamp(1.5rem,4vw,2.25rem)] tabular-nums text-meta"
          style={{ animationDelay: "60ms" }}
        >
          000
        </p>
      </div>
    </div>
  );
}
