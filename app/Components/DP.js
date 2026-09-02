import Image from "next/image";
import React from "react";
import dp from "@/public/dp.webp";

const DP = () => {
  return (
    <div className=" w-full h-full flex items-end justify-center pb-0">
      {/* Container for profile and labels */}
      <div className="relative w-full max-w-[700px] max-h-[600px] aspect-square">
        {/*
          Background decorative blob.

          PLAN §3.5 COMMIT 4 WAS TRIED HERE AND REVERTED. The item is
          `will-change: opacity` on this blob and the two pulsing dots below,
          described as "layer promotion, invisible, cheap". Two of the three
          words hold. It is not invisible.

          Measured with scripts/visual-hero.mjs, which was first shown to have
          a zero noise floor — two consecutive captures of the same build
          differ by 0.0000% at all four widths. Against that:

            with `will-change-[opacity]`   0.1168% strongly-differing pixels at
                                           639×900, 0.0068–0.0091% at the other
                                           three widths
            without it                     0.0000% at all four

          Promoting the blob to its own compositor layer changes how an 80%
          gradient is blended against the ground, and the rounding lands
          differently. Nothing moves and nothing resizes — the geometry probe
          is identical either way — but pixels change, and §3.5's own
          done-condition is that the hero is pixel-identical apart from the
          deliberate nav change. A commit whose stated justification is that it
          is invisible does not get to break that when it turns out not to be.

          The hint also buys less than it appears to. Opacity animations are
          already promoted and run on the compositor in every current engine;
          `will-change` moves that promotion earlier, it does not create it.
          Paying for it in pixels is the wrong side of the trade.
        */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="sm:max-w-[80%] sm:h-[90%] w-[80%] h-[80%] bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-80 animate-pulse" />
        </div>

        {/* Web Developer Label - Behind image, top left */}
        <div className="absolute top-[2%] left-[2%] z-0 sm:top-[0%] sm:left-[2%] lg:top-[-10%] lg:left-[10%]">
          <div className="relative">
            {/* Main label */}
            <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white px-6 py-3 rounded-full transform -rotate-12 shadow-lg text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap">
              Web Developer
            </div>
          </div>
        </div>

        {/*
          Profile Image.

          PLAN §2.2: the static import carries the true intrinsic size, so the
          width and height Next writes onto the <img> become 2160×3840 instead
          of the hand-written 700×700 a 9:16 photograph never had. That
          mismatch is the aspect-ratio failure Lighthouse reported, and it is
          fixed by deleting the numbers rather than correcting them — the file
          is the source of truth.

          `h-auto` stays. It looks like it should need replacing, because with
          700×700 declared it ought to resolve to a square box — but `height:
          auto` uses the resource's *natural* ratio once the image has loaded,
          not the attributes, so the box has always been 700×1244 clamped by
          `max-h-[100vh]` to 700×900. The declared numbers were only ever the
          pre-load placeholder, which is precisely why the layout looked right
          and the audit still failed. Making them honest changes the reserved
          box before load and nothing after it.

          Measured, not reasoned: forcing `aspect-square` here instead moved
          the portrait 200px down and shrank it by 200px, and
          scripts/visual-hero.mjs reported it at 15.7% of the 1440 viewport.
        */}
        <div className="relative z-10 w-full h-full flex items-end justify-center">
          <Image
            src={dp}
            alt="Zubair Bin Shaukat - Software Developer"
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 700px"
            className="w-full h-auto object-contain sm:w-[90%] max-h-[100vh] md:w-full"
            priority
          />
        </div>

        {/* Mobile Developer Label - In front of image, bottom right */}
        <div className="absolute bottom-[15%] right-[-5%] z-20 sm:bottom-[12%] sm:right-[0%] md:bottom-[10%] md:right-[-2%]">
          <div className="relative">
            {/* Main label */}
            <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white px-6 py-3 rounded-full transform rotate-6 shadow-lg text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap">
              Mobile Developer
            </div>
          </div>
        </div>

        {/* Small decorative elements. See the note on the blob above. */}
        <div className="absolute top-[45%] right-0 z-0">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full animate-pulse" />
        </div>
        <div className="absolute top-[25%] right-[7%] z-0">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
};

export default DP;
