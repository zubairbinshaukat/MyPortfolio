/**
 * Skip-to-content link. Must be the first child of <body>.
 *
 * Visually hidden until focused, then it appears — so keyboard users can jump
 * past the navigation without a visible control cluttering the design. This is
 * a Lighthouse accessibility requirement and a real one.
 *
 * z-[60] puts it above the sticky band (z-50) and the index overlay (z-40), so
 * it is visible wherever focus reaches it.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-[14px] focus:font-semibold focus:text-black"
    >
      Skip to content
    </a>
  );
}
