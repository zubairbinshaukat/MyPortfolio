"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getLenis, setLenis } from "./lenis-instance";

/**
 * The sticky band's height. Lenis's `anchors.offset` takes a number and cannot
 * read a custom property, so this is the one place `--band-h` is duplicated —
 * named so a reader finds its pair in app/globals.css.
 */
const BAND_HEIGHT = 66;

/**
 * Lenis smooth scroll (PLAN §3.1). Renders nothing.
 *
 * WHY LENIS AT ALL
 *
 * The old site hijacked the wheel to swap sections. That machine is gone.
 * Lenis is the opposite trade: it wraps the browser's own scroll rather than
 * replacing it, so `position: sticky`, anchor links, the scrollbar, keyboard
 * paging and find-in-page all keep working. It interpolates the scroll
 * position; it does not own the scroll.
 *
 * WHY IT IS IMPORTED DYNAMICALLY, AND NOT THROUGH `lenis/react`
 *
 * PLAN §3.1 says to use the React wrapper. Measured, that costs more than it
 * gives here:
 *
 *   `lenis/react` imports Lenis at module scope, so the library lands in the
 *   initial bundle of every route — 4.8 KB brotli. The site's inner routes sit
 *   at 117.8 KB against a 120 KB budget (PLAN §2.3), so a static import would
 *   put all eleven routes over it. The wrapper's value is its context and the
 *   `useLenis` hook; nothing here consumes either.
 *
 *   `await import("lenis")` puts the library in a chunk fetched after
 *   hydration. First Load JS is unchanged — the number `scripts/check-js.mjs`
 *   measures is the bytes referenced by `<script>` in the prerendered HTML,
 *   and this chunk is not one of them. Smooth scrolling is decoration over a
 *   page that already scrolls natively, so arriving a moment late is exactly
 *   the right failure mode.
 *
 * REDUCED MOTION
 *
 * Lenis honours `prefers-reduced-motion` on its own (`respectReducedMotion`
 * defaults to true, and sets `lerp = 1` on every scroll, which is no
 * smoothing). This goes further and never downloads or runs it: under the
 * query the browser keeps its native scroll and this component is inert. The
 * media query is watched, so toggling the OS setting takes effect without a
 * reload — in either direction.
 *
 * SCROLL POSITION ACROSS NAVIGATIONS
 *
 * Two distinct failures, two fixes:
 *
 *   Clicking a link mid-inertia. The router scrolls the new page to the top
 *   while Lenis is still animating towards a target from the old one, and
 *   Lenis wins the next frame — you land halfway down a page you just opened.
 *   `stopInertiaOnNavigate` kills the animation on any link click, and the
 *   explicit `scrollTo(0, { immediate: true })` below is the belt to its
 *   braces.
 *
 *   Going back. The browser restores the previous scroll position, and forcing
 *   0 would throw it away. So the reset runs on forward navigations only; a
 *   `popstate` sets a flag that the pathname effect consumes, and Lenis is
 *   resized instead so it re-reads the restored position.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  // Skip the reset on the first pathname the app ever sees: it is not a
  // navigation, and a deep link with a hash would be scrolled away from.
  const mountedRef = useRef(false);
  const poppedRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lenis = null;
    let snap = null;
    let cancelled = false;

    const start = async () => {
      if (lenis || cancelled || query.matches) return;

      const [{ default: Lenis }, { default: Snap }] = await Promise.all([
        import("lenis"),
        import("lenis/snap"),
      ]);

      if (cancelled || query.matches) return;

      lenis = new Lenis({
        // The rAF loop is Lenis's own. One loop, driven by the library that
        // needs it, rather than a second one here to forward frames into it.
        autoRaf: true,
        // 0.1 is Lenis's default and reads as "weighted", not "floaty". Higher
        // values approach native; lower ones start to feel like the page is
        // being dragged behind the pointer.
        lerp: 0.1,
        smoothWheel: true,
        // Touch scrolling is left native. iOS and Android already interpolate
        // it in the compositor, and `syncTouch` moves that work onto the main
        // thread to reproduce what the platform does better — which is the
        // trade that gives smooth-scroll libraries their reputation.
        syncTouch: false,
        // Same-page anchors — the heading links rehype-autolink-headings adds
        // — animate instead of jumping, and land clear of the sticky band.
        anchors: { offset: -BAND_HEIGHT },
        stopInertiaOnNavigate: true,
      });

      setLenis(lenis);

      /*
        Section-to-section snapping (PLAN §3.1).

        CSS `scroll-snap-type` and Lenis cannot both drive the same scroller:
        Lenis moves the document with `scrollTo` on every frame, and the
        browser's snap engine re-snaps after each of those, so the two fight
        and the page stutters at every section edge. `lenis/snap` is the same
        behaviour expressed inside Lenis's own loop, and it is 1.8 KB brotli
        inside this already-deferred chunk.

        The CSS rule is still there for the no-JavaScript path — see
        `[data-snap]` in app/globals.css, which `html.lenis` switches off the
        moment this instance exists. One feel, two mechanisms, each used where
        it is the one that works.

        `proximity`, never `mandatory`: several of these sections are taller
        than the viewport, and mandatory snapping on a tall section is how a
        reader gets trapped mid-paragraph.
      */
      const targets = Array.from(document.querySelectorAll("[data-snap]"));
      if (targets.length) {
        snap = new Snap(lenis, {
          type: "proximity",
          distanceThreshold: "18%",
          debounce: 400,
          duration: 0.6,
        });
        snap.addElements(targets, { align: ["start"] });
      }
    };

    const stop = () => {
      snap?.destroy();
      snap = null;
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };

    // `change` on the media query rather than a one-time read: a reader who
    // turns reduced motion on mid-session gets their native scroll back
    // without reloading, and one who turns it off gets the smoothing.
    const onPreferenceChange = () => {
      if (query.matches) stop();
      else start();
    };

    start();
    query.addEventListener("change", onPreferenceChange);

    return () => {
      cancelled = true;
      query.removeEventListener("change", onPreferenceChange);
      stop();
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const lenis = getLenis();

    if (poppedRef.current) {
      poppedRef.current = false;
      // Back or forward: the browser has restored a position. Re-measure so
      // Lenis adopts it instead of animating away from it.
      lenis?.resize();
      return;
    }

    // A deep link to a heading anchor is a navigation whose whole point is not
    // to be at the top.
    if (window.location.hash) return;

    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
