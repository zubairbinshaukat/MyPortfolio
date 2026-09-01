/**
 * Skip-to-content link. Must be the first child of <body>.
 *
 * Visually hidden until focused, then it appears — so keyboard users can jump
 * past the navigation without a visible control cluttering the design. This is
 * a Lighthouse accessibility requirement and a real one.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-base focus:font-semibold focus:text-black focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
    >
      Skip to content
    </a>
  );
}
