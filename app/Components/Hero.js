import React from "react";
import { BackgroundBeamsWithCollision } from "../../components/ui/background-beams-with-collision";
import MotionProvider from "@/components/ui/motion-provider";
import { MainText } from "./MainText";
import DP from "./DP";
import HeroText from "./UI/HeroText";

/**
 * The hero is the only part of the site that animates, so framer-motion's
 * lazy-feature provider wraps exactly this and nothing else. It renders no DOM
 * — see components/ui/motion-provider.js.
 *
 * THE TOP OF THE HERO IS ONE CONTROL SYSTEM, AND IT IS NOT IN THE HERO
 *
 * PLAN §3.4 describes three related problems here: the index trigger and the
 * social dock both claiming the top-right on mobile, the dock rendering as a
 * clipped unlabelled square, and the dot rail stranded mid-edge over the
 * portrait. It asks for one answer to all three rather than three
 * deconflictions, and the answer is that none of them belong to the hero.
 *
 * Phase 2 moved the sticky band over the top of the hero — logo left, index
 * trigger right — which is the design's resting band, and took the hero's
 * duplicate mobile logo with it. Phase 3 finished the job: the dock is gone,
 * replaced by the design's own dashed social pill in the centre of that band
 * (components/SocialPill.js), and the dot rail is gone with it. What remains
 * in this file is the hero: the lockup, the portrait, the beams and the
 * particle field, and no chrome at all.
 *
 * `app/Components/floating.js` and `components/ui/floating-dock.js` were
 * deleted in the same change. Nothing else imported either.
 */
export function Hero() {
  return (
    <MotionProvider>
      <BackgroundBeamsWithCollision>
        {/*
          PLAN §3.1's snap stop for the hero. An attribute on the element that
          is already here rather than a wrapper around it: the hero contract in
          scripts/visual-hero.mjs indexes the elements painting in the first
          viewport, so one extra <div> renumbers all 98 of them and reports a
          hundred differences that are not differences. See app/page.js.
        */}
        <div data-snap className="flex flex-col bg-black">
          <div className="w-screen h-dvh flex sm:items-center sm:flex-row flex-col">
            <div className="w-[50%] h-full sm:flex hidden">
              <MainText />
            </div>
            <HeroText variant="mobile" />
            <div className="sm:w-[50%] sm:h-full mx-auto w-[80%] h-[50%] flex justify-center items-end">
              <DP />
            </div>
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </MotionProvider>
  );
}
