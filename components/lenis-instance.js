"use client";

/**
 * The one Lenis instance, shared between the two islands that need it.
 *
 * components/SmoothScroll.js creates it; components/IndexBehaviour.js has to
 * be able to stop it, because the full-screen index sets `overflow: hidden` on
 * the body and Lenis does not read that — it drives `window.scrollTo` from its
 * own rAF loop, so an overlay that "locks" the page would still scroll the
 * document underneath it.
 *
 * A module-scoped variable rather than React context, deliberately. Context
 * would mean a provider wrapping the whole tree and every consumer becoming a
 * client component; this is two client islands that already exist, sharing one
 * reference through the module graph they are both already in. It costs a few
 * bytes and moves no component across the server/client line.
 *
 * `null` is the normal, expected state: under `prefers-reduced-motion` Lenis
 * is never loaded at all, and before hydration finishes it does not exist yet.
 * Every caller must handle that, which is why the getter is used as
 * `getLenis()?.stop()` at every call site.
 */

let instance = null;

export function setLenis(next) {
  instance = next;
}

export function getLenis() {
  return instance;
}
