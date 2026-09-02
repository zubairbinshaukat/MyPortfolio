import { cn } from "@/lib/utils";

/**
 * The corner mark on the "Hi!" badge.
 *
 * PLAN §2.4: this was declared inside HelloCard. A component defined during
 * another component's render is a new component type on every render, so React
 * unmounts and remounts all four of these each time the badge re-renders
 * instead of updating them — the React Compiler rule
 * `react-hooks/static-components` is reporting a real bug, not a style
 * preference. Hoisting it to module scope is the whole fix; the markup it
 * produces is unchanged, which is what lets the badge stay pixel-identical.
 */
const Icon = ({ className, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    strokeWidth="1"
    stroke="currentColor"
    {...rest}
    className={cn("dark:text-white text-black size-6 absolute", className)}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

export const HelloCard = () => {
  return (
    <div className="border border-dashed border-zinc-400 dark:border-zinc-700 relative flex items-center justify-center px-4 py-3 w-fit">
      {/* Corner Icons */}
      <Icon className="-top-3 -left-3" />
      <Icon className="-top-3 -right-3" />
      <Icon className="-bottom-3 -left-3" />
      <Icon className="-bottom-3 -right-3" />

      {/*
        "Hi!" is a greeting on a badge, and it was marked up as an <h1>.

        PLAN §2 lists "one <h1> per route" as still violated with four on the
        homepage, and scripts/check-meta.mjs pinned the number rather than
        fixing it because §0.2 froze this file until Phase 3. Two of those four
        were this badge, rendered once in each HeroText variant.

        A <p> instead. Tailwind's preflight already resets an <h1> to inherited
        size and weight and strips its margin, and both elements are the sole
        flex child of the same centring box, so the rendered box is identical
        to the pixel — which is the only reason this is safe to do to the hero.
      */}
      <p className="text-3xl font-yatra font-bold text-gray-900 dark:text-gray-100">
        Hi!
      </p>
    </div>
  );
};
