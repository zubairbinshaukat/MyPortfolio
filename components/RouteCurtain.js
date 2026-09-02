"use client";

import { useEffect } from "react";

/**
 * The route-change curtain. Renders no markup of its own.
 *
 * WHAT IT IS
 *
 * A single opaque panel in the page's own ground colour, carrying the brand
 * gradient as a one-pixel leading edge. It descends over the outgoing page,
 * holds a beat, and continues downward off the bottom to reveal the incoming
 * one. 170ms down, a 90ms hold, 200ms out — 460ms exactly, every time, well
 * inside the 600ms ceiling.
 *
 * "Exactly" is doing work in that sentence. See ONE ANIMATION, NOT THREE.
 *
 * WHAT IT IS NOT
 *
 * It is not a loading state and it never waits for anything. Every route on
 * this site is prerendered and prefetched, so the page underneath is ready
 * before the panel has finished arriving; the hold is a beat of rhythm, not a
 * wait. The element is `pointer-events: none` and `aria-hidden` and it is
 * appended after hydration, so it cannot block a click, cannot delay a paint,
 * and does not exist in any route's HTML.
 *
 * THE DESIGN DECISIONS, AND WHY
 *
 *   One panel, not staggered columns. The index overlay already descends from
 *   the top edge; making the route change do the same gives the site one
 *   vertical vocabulary — chrome arrives from above — instead of two unrelated
 *   effects. Columns fragment the screen and read as decoration; a single
 *   sheet reads as a cut.
 *
 *   The brand gradient, as a 1px leading edge, not a fill. The design note's
 *   gradient rule is explicit: "always a line, mask or single CTA; never a
 *   fill". A full-bleed gradient curtain would be the one thing the design
 *   system forbids. A hairline on the panel's leading edge sweeps down the
 *   viewport on the way in and again on the way out, which is the same
 *   gradient-as-a-line language as the scroll-progress bar and the footer rule.
 *
 *   No logo. At 460ms a centred mark is on screen for about a third of a
 *   second, which is long enough to register as a flicker and not long enough
 *   to read as branding. The gradient edge carries the identity; a monogram
 *   would only carry the fact that something flashed.
 *
 *   Ground colour, not a tint. Same reasoning as the intro overlay: the panel
 *   and the page are the same black, so the moment of covering is invisible
 *   and what you see is the edge moving, not a box appearing.
 *
 * WHICH NAVIGATIONS GET IT
 *
 * Everything except the list-to-detail pairs. A project or post row morphs its
 * cover and title into the page it opens (PLAN §3.2 tier 2), and dropping a
 * curtain over a shared-element transition would hide the one thing the
 * transition exists to show. Those anchors carry `data-vt="morph"` and this
 * skips them.
 *
 * Browser back and forward do not get it either, because they never produce a
 * link click. That is deliberate: a curtain on a gesture the reader made to go
 * back reads as the site taking over navigation they already own.
 */

/** The site's one curve, shared with everything else that moves. */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * ONE ANIMATION, NOT THREE
 *
 * The first version was three steps chained on promises: animate the descent,
 * `await` it, `setTimeout` the beat, animate the exit. It was measured at 769ms
 * end to end against a 600ms budget, with a 386ms gap in the middle where
 * nothing moved.
 *
 * None of that overrun was animation. It was the router: a client navigation
 * commits a new page, and while React renders it the main thread is
 * unavailable, so `await` and `setTimeout` — both main-thread scheduling — do
 * not resolve. The curtain's own frames kept being painted, because a
 * `transform` animation runs on the compositor, but every seam *between* the
 * three animations was a main-thread handoff, and each one waited for the
 * navigation it was supposed to be covering.
 *
 * Expressed as a single animation with four keyframes, the whole sequence is
 * handed to the compositor once and runs to its stated duration whatever the
 * main thread is doing. The hold is a pair of identical keyframes rather than
 * a timer, which is what makes it a beat in the animation rather than a pause
 * between two of them.
 *
 * It also means the curtain no longer needs to know when the route commits, so
 * this component subscribes to nothing. The navigation lands underneath a
 * panel that was always going to leave at 460ms — measured, the commit happens
 * between 60ms and 105ms, comfortably before the panel starts lifting at 260.
 * If it were ever slower the curtain would still leave on time, which is the
 * correct behaviour: it is not a loading state and it must not become one.
 *
 * Per-keyframe `easing` applies to the segment that *starts* at that keyframe,
 * so the brand curve governs the descent and the exit, and the flat middle
 * carries `linear` because nothing moves across it.
 */
const DOWN_MS = 170;
const HOLD_MS = 90;
const OUT_MS = 200;
const TOTAL_MS = DOWN_MS + HOLD_MS + OUT_MS;

/**
 * Is this click one the router will turn into a route change?
 *
 * Everything here is a reason the browser, not Next, will handle the click —
 * in which case the page is about to be replaced wholesale and a curtain over
 * it would be animating something that is already gone.
 */
function isRouteChange(event, pathname) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!anchor) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  // The shared-element pairs run their own transition. See above.
  if (anchor.dataset.vt === "morph") return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // A link to the page you are on, or to an anchor within it, changes nothing
  // to cover.
  if (url.pathname === pathname) return false;

  return true;
}

export default function RouteCurtain() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return undefined;

    /*
      Built here rather than rendered by React.

      Rendering it would put an empty <div> in the HTML of every route for the
      sake of an element that only matters after a click, and turning it on
      would be a state change and a re-render at exactly the moment the main
      thread is busiest — a frame of latency on the one animation that has to
      start on the click that caused it. Constructed once, after hydration, it
      is ready before it is needed and costs the initial HTML nothing.

      It carries a class and no inline styles: `.route-curtain` in
      app/globals.css owns the colour, the layering and the gradient edge, so
      this file writes no design values and the tokens stay in one place.
    */
    const curtain = document.createElement("div");
    curtain.className = "route-curtain";
    curtain.dataset.routeCurtain = "";
    curtain.setAttribute("aria-hidden", "true");
    curtain.hidden = true;
    document.body.append(curtain);

    let running = false;

    const run = () => {
      if (running) return;
      running = true;

      /*
        `data-curtain` is read by components/IndexBehaviour.js, which holds the
        index panel open until the curtain has covered it. Without that the
        menu vanishes a frame after the click and the reader watches the page
        reappear before the panel that was supposed to cover it arrives.

        The value is the cover duration rather than a bare flag, so the reader
        of the attribute does not have to import a constant from here to know
        how long to wait.
      */
      document.documentElement.dataset.curtain = String(DOWN_MS);
      curtain.hidden = false;

      const animation = curtain.animate(
        [
          { transform: "translateY(-100%)", easing: EASE, offset: 0 },
          { transform: "translateY(0)", easing: "linear", offset: DOWN_MS / TOTAL_MS },
          {
            transform: "translateY(0)",
            easing: EASE,
            offset: (DOWN_MS + HOLD_MS) / TOTAL_MS,
          },
          { transform: "translateY(100%)", offset: 1 },
        ],
        { duration: TOTAL_MS, fill: "both" }
      );

      const reset = () => {
        animation.cancel();
        curtain.hidden = true;
        delete document.documentElement.dataset.curtain;
        running = false;
      };

      // `finished` rejects when the animation is cancelled by the teardown
      // below. Either way the panel goes away, which is the whole handling.
      animation.finished.then(reset, reset);
    };

    /*
      Capture phase, so this sees the click before Next's own handler calls
      `preventDefault` on it. The curtain does not intercept the navigation and
      does not delay it — it starts alongside it and lets the router do exactly
      what it would have done.
    */
    const onClick = (event) => {
      if (isRouteChange(event, window.location.pathname)) run();
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      curtain.getAnimations().forEach((animation) => animation.cancel());
      curtain.remove();
      delete document.documentElement.dataset.curtain;
    };
  }, []);

  return null;
}
