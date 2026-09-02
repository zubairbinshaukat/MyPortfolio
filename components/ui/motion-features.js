"use client";

import { domAnimation } from "framer-motion";

/**
 * The feature bundle `<LazyMotion>` loads.
 *
 * It is a module of its own so `features` can be given as a promise-returning
 * function rather than a value, which puts framer-motion's animation machinery
 * in a chunk of its own instead of the page's main one.
 *
 * MEASURED, because the obvious claim about it is not quite true. Splitting it
 * does shrink the homepage: 156.7 KB brotli against 159.4 KB with
 * `features={domAnimation}` written inline. It does not defer it — Turbopack
 * emits the split chunk as another `<script async>` in the initial HTML, so
 * the browser still fetches it on first load. The win is 2.7 KB of bytes, not
 * a moment of timing. If Turbopack stops eagerly emitting async chunk-group
 * members, this shape starts paying the larger dividend with no further edit.
 *
 * `domAnimation` rather than `domMin`: the hero drives everything through
 * `animate`, `variants` and `AnimatePresence` and uses no framer gesture prop,
 * so `domMin` ought to be smaller. Measured, it is identical to the tenth of a
 * kilobyte, and Phase 3's motion work will want the gestures. `domMax` is the
 * one that would cost: it adds drag, pan and layout projection. The single
 * prop in the hero that would use them — `layoutId="nav"` on the mobile dock's
 * dropdown — has no matching element to share a layout with, so it animates
 * nothing either way.
 */
export default domAnimation;
