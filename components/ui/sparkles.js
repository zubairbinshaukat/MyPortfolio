"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { m, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The hero's particle field.
 *
 * PLAN §2.3: tsParticles is loaded lazily. The engine, the slim preset and the
 * React binding are ~200 KB of the homepage's JavaScript, and none of it is
 * needed to render the page — the field starts at `opacity: 0` and only fades
 * in once `particlesLoaded` fires, so deferring the import moves work that was
 * already invisible off the critical path without changing a frame of what a
 * visitor sees.
 *
 * The placeholder occupies the identical box: this wrapper is sized entirely
 * by the `className` its parent passes (`w-full h-full` inside a fixed
 * `w-[40rem] h-40` container), so there is no size for the field to contribute
 * and nothing to shift when it arrives.
 *
 * `ssr: false` because the engine touches `window` on import. That is safe
 * here and only here: the field is decoration with no text in it, so the
 * governing rule — every word in the server HTML — is untouched.
 */
const ParticlesField = dynamic(() => import("./sparkles-field"), {
  ssr: false,
  loading: () => null,
});

export const SparklesCore = (props) => {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  } = props;

  const controls = useAnimation();

  /**
   * Fade the field in once the engine reports it has painted. Identical to the
   * previous behaviour; it is a `useCallback` now only because it crosses a
   * dynamic-import boundary and should not change identity every render.
   */
  const onLoaded = useCallback(() => {
    controls.start({ opacity: 1, transition: { duration: 1 } });
  }, [controls]);

  return (
    <m.div animate={controls} className={cn("opacity-0", className)}>
      <ParticlesField
        id={id}
        background={background}
        minSize={minSize}
        maxSize={maxSize}
        speed={speed}
        particleColor={particleColor}
        particleDensity={particleDensity}
        onLoaded={onLoaded}
      />
    </m.div>
  );
};
