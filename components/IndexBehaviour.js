"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getLenis } from "./lenis-instance";

/**
 * Keyboard, scroll and motion behaviour for the site index. Renders nothing.
 *
 * The index itself is a plain `<details>` in components/SiteNav.js, which is a
 * server component: it opens, closes and reports its own expanded state with
 * no JavaScript at all. Everything here is enhancement, and nothing about the
 * navigation depends on it arriving:
 *
 *   Escape closes the panel and returns focus to the trigger, which is what a
 *   keyboard user expects from anything that covers the screen and what
 *   `<details>` does not do on its own.
 *
 *   Navigating closes it. Without this the index stays open on top of the page
 *   it just took you to.
 *
 *   The page behind stops scrolling while it is open, so a scroll gesture over
 *   a full-screen overlay moves the overlay rather than the document under it.
 *
 *   The panel descends and retracts. See CHOREOGRAPHY below.
 *
 * Attaching by id rather than by ref is what lets the markup stay on the
 * server. A ref would require the element to be created by this component, and
 * then the whole navigation — eight links, their blurbs, the footer row —
 * would ship as client JavaScript to be rebuilt in the browser. Measured, that
 * cost 8.8 KB brotli on every route; this costs a few hundred bytes.
 *
 * WHY THE MOTION IS HERE AND NOT IN CSS
 *
 * It was in CSS — `.animate-panel`, `.animate-wash`, `.animate-rise` with
 * per-link delays — and it played on the first open of a page and never again.
 *
 * A closed `<details>` does not remove its content from the DOM. Chrome
 * renders it into `::details-content` with `content-visibility: hidden`, which
 * skips the subtree rather than destroying it, and a skipped subtree's
 * animations are frozen rather than removed. Measured on the closed, never
 * opened panel: `getAnimations()` returned `panel-wipe` in state `running` at
 * `currentTime` 0. Opening let the clock run; closing froze it again at
 * `finished`, `currentTime` 340; opening again unfroze an animation that was
 * already finished and filling its end state. Nothing moved.
 *
 * A CSS animation restarts only when its element re-enters the box tree from
 * `display: none`, or when `animation-name` changes. `content-visibility:
 * hidden` does neither, and a `<details>` toggle never remounts anything. The
 * usual workaround is to strip and re-add the class with a forced reflow
 * between; that is a layout read on every open, and PLAN's own performance
 * notes are about not doing that sort of thing.
 *
 * The Web Animations API has no such problem: `element.animate()` constructs a
 * new Animation each time it is called, so replay is the mechanism rather than
 * something the mechanism has to be tricked into. It also gives the close
 * animation a `finished` promise, which is what makes a symmetrical close
 * possible at all — a `<details>` closes synchronously on click and there is
 * otherwise no moment in which to animate anything out.
 */

/**
 * CHOREOGRAPHY
 *
 * A panel descending from the top edge over the page, and retracting the way
 * it came. Both directions 340ms, inside the 400ms ceiling.
 *
 *   open    panel   0 - 300   translateY(-100%) -> 0
 *           wash    0 - 300   opacity 0 -> 1
 *           links  60 - 304   opacity/translateY, 12ms apart, 160ms each
 *           foot  200 - 340   opacity/translateY
 *
 *   close   links   0 - 190   reverse order, 10ms apart, 120ms each
 *           foot    0 - 120
 *           wash  100 - 340
 *           panel 100 - 340   0 -> translateY(-100%)
 *
 * The links start while the panel is still arriving, so the routes read as
 * riding down with it rather than queueing behind it. On the way out they
 * leave first and the panel follows, which is the same order in reverse and is
 * why the close does not feel like a different animation.
 *
 * Every duration and offset is here rather than spread through the file, so
 * the 400ms budget can be checked by reading one block.
 */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function IndexBehaviour({ targetId }) {
  const pathname = usePathname();

  /*
    Navigating closes the index — but not before the route curtain has covered
    it.

    `data-curtain` is set by components/RouteCurtain.js while its panel is on
    the way down, and its value is that panel's duration in milliseconds. Close
    the index the moment the route commits and the reader watches the menu
    vanish and the page it came from reappear, a frame before the curtain that
    was supposed to cover the change arrives. Waiting the panel out means the
    index is still there when the curtain passes over it, and gone when the
    curtain leaves.

    With no curtain running — reduced motion, or a browser back — the attribute
    is absent, the delay is zero, and this closes immediately as it always did.
  */
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el?.open) return undefined;

    const cover = Number(document.documentElement.dataset.curtain) || 0;
    const timer = window.setTimeout(() => {
      el.open = false;
    }, cover);

    return () => window.clearTimeout(timer);
  }, [pathname, targetId]);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const summary = el.querySelector("summary");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    /** Everything currently in flight, so a rapid re-toggle can cancel it. */
    let running = [];

    const stopAll = () => {
      for (const animation of running) animation.cancel();
      running = [];
    };

    const parts = () => ({
      panel: el.querySelector("[data-index-panel]"),
      wash: el.querySelector("[data-index-wash]"),
      links: [...el.querySelectorAll("[data-index-link]")],
      foot: el.querySelector("[data-index-foot]"),
    });

    const play = (node, keyframes, options) => {
      if (!node) return null;
      const animation = node.animate(keyframes, {
        easing: EASE,
        fill: "both",
        ...options,
      });
      running.push(animation);
      return animation;
    };

    const animateOpen = () => {
      stopAll();
      const { panel, wash, links, foot } = parts();

      play(panel, [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], {
        duration: 300,
      });
      play(wash, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });

      links.forEach((link, i) =>
        play(
          link,
          [
            { opacity: 0, transform: "translateY(-14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 160, delay: 60 + i * 12 }
        )
      );

      play(
        foot,
        [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 140, delay: 200 }
      );
    };

    /**
     * Run the close animation and resolve when the panel has left. The caller
     * closes the `<details>` afterwards — until then it is still open, which
     * is the only state in which its content is rendered and can be animated.
     */
    const animateClose = () => {
      stopAll();
      const { panel, wash, links, foot } = parts();

      links.forEach((link, i) =>
        play(
          link,
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-10px)" },
          ],
          { duration: 120, delay: (links.length - 1 - i) * 10 }
        )
      );
      play(foot, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 });
      play(wash, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: 100 });

      const panelAnimation = play(
        panel,
        [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
        { duration: 240, delay: 100 }
      );

      return panelAnimation?.finished ?? Promise.resolve();
    };

    /**
     * Close, with the animation if there is one to run.
     *
     * `closing` guards re-entry: the click handler sets `open = false` at the
     * end, which fires `toggle`, and without the flag a second click during the
     * animation would start a second close over the first.
     */
    let closing = false;

    const close = async ({ restoreFocus = false } = {}) => {
      if (!el.open || closing) return;

      if (reduced.matches) {
        el.open = false;
      } else {
        closing = true;
        try {
          await animateClose();
        } catch {
          // A cancelled animation rejects `finished`. That happens when the
          // panel is reopened mid-close, and the reopen has already taken over.
          closing = false;
          return;
        }
        closing = false;
        el.open = false;
        stopAll();
      }

      if (restoreFocus) summary?.focus();
    };

    /*
      The close has to be intercepted, and the open does not.

      A <details> closes the instant its summary is clicked, which leaves no
      frame in which its contents are still rendered — so an exit animation has
      nothing to run on unless the default is prevented and the element is
      closed by hand afterwards. Opening has the opposite shape: let it happen,
      then animate the panel that now exists.
    */
    const onSummaryClick = (event) => {
      if (!el.open) return;
      event.preventDefault();
      close();
    };

    const onKeyDown = (event) => {
      if (event.key !== "Escape" || !el.open) return;
      close({ restoreFocus: true });
    };

    /*
      The scroll lock, and why it is two things.

      `overflow: hidden` on the body stops the document scrolling, which is the
      whole lock when the browser owns the scroll. Lenis does not read it: it
      drives `window.scrollTo` from its own rAF loop, so with smooth scroll
      running a wheel gesture over the full-screen index would still move the
      page underneath it. `stop()` is the same instruction in the vocabulary
      Lenis understands, and it also adds `.lenis-stopped` to <html>, which is
      what Lenis's own stylesheet keys `overflow: clip` off.

      Both, not either: Lenis is absent under prefers-reduced-motion and before
      hydration, and the body rule is the one that holds in those cases.
    */
    const onToggle = () => {
      document.body.style.overflow = el.open ? "hidden" : "";
      const lenis = getLenis();
      if (el.open) lenis?.stop();
      else lenis?.start();

      if (el.open && !reduced.matches) animateOpen();
      if (!el.open) stopAll();
    };

    summary?.addEventListener("click", onSummaryClick);
    document.addEventListener("keydown", onKeyDown);
    el.addEventListener("toggle", onToggle);

    return () => {
      summary?.removeEventListener("click", onSummaryClick);
      document.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("toggle", onToggle);
      stopAll();
      document.body.style.overflow = "";
      getLenis()?.start();
    };
  }, [targetId]);

  return null;
}
