"use client";

import { useEffect, useRef } from "react";

/**
 * The 1px gradient line under the sticky band.
 *
 * This is the one place the design lets the gradient run the full width of the
 * page — the design note's gradient rule says so in as many words: "full-width
 * only as scroll progress, 1px". Everywhere else the gradient is a short rule,
 * a mask, or a single call to action.
 *
 * Written against `requestAnimationFrame` and a passive listener, and it
 * writes a transform rather than a width, so the whole thing stays on the
 * compositor and never triggers layout. That is the difference between a
 * scroll readout and a scroll jank generator.
 *
 * It renders at scaleX(0) on the server and stays there until hydration, which
 * is correct: at scroll 0 the progress *is* zero, so there is nothing to
 * correct and no flash. With JavaScript off it is an invisible 1px line, which
 * costs a reader nothing.
 */
export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // The band this line lives in. One passive listener drives both readouts:
    // a second one measuring the same scroll position would be pure waste.
    const band = bar.closest("#site-band");

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

      /*
        At rest against condensed — the prototype's two band states.

        The attribute starts at "true" in the server HTML so the band is opaque
        before hydration and stays opaque with JavaScript off. Only a client
        that has measured the scroll position is allowed to say the band is at
        the top and may go transparent. 8px of tolerance keeps it from
        flickering on the elastic overscroll iOS gives you at the top of a page.
      */
      if (band) band.dataset.scrolled = String(window.scrollY > 8);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    // z-20 puts this in the band's control layer rather than behind the index
    // panel, which sits at z-10. See the layering note in components/SiteNav.js.
    <div
      aria-hidden="true"
      className="relative z-20 h-px w-full overflow-hidden bg-white/[0.04]"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-gradient"
      />
    </div>
  );
}
