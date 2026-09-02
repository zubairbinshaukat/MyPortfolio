"use client";

import { LazyMotion } from "framer-motion";

/**
 * framer-motion's lazy feature loader, wrapped around everything on the site
 * that animates — which is the hero, and only the hero.
 *
 * PLAN §2.3: the library cannot tree-shake below ~34 KB through the `motion`
 * component, because `motion.div` accepts every animation prop and so has to
 * carry the code for all of them. `m` is the same renderer with no features
 * attached; `LazyMotion` supplies them separately, and supplying them through
 * a dynamic import means the initial bundle carries neither.
 *
 * `strict` is the part that makes it stay fixed. With it set, using `motion.*`
 * anywhere inside this provider throws at render instead of silently pulling
 * the full bundle back in — so a future edit that reintroduces the weight
 * fails loudly rather than costing 30 KB nobody notices.
 *
 * Renders no DOM: LazyMotion is a context provider, so wrapping the hero in it
 * cannot move a pixel.
 */
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
