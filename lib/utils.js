import { clsx } from "clsx";

/**
 * Class-name join. Four callers, all of them in the hero's client components.
 *
 * It used to be `twMerge(clsx(inputs))`. Phase 2 measured `tailwind-merge` at
 * 5.8 KB brotli on `/` and recorded that its one feature — resolving two
 * conflicting Tailwind utilities in favour of the last — was never used, then
 * left it alone because PLAN §0.2 froze those files. §0.2 lifts in Phase 3 and
 * the homepage is the one route over the §2.3 budget, so it goes.
 *
 * Checked before removing it, not assumed. Every call site passes a base class
 * list and an optional override, and no override collides with the base:
 *
 *   background-beams-with-collision.js  `className` is undefined at both call
 *                                       sites; there is nothing to merge
 *   hello-card.js                       base sets colour and size, override
 *                                       sets `-top-3 -left-3` and friends
 *   sparkles.js                         base `opacity-0`, override `w-full
 *                                       h-full`
 *   sparkles-field.js                   one argument
 *
 * If a future caller does introduce a conflict, clsx keeps both classes and
 * the CSS cascade decides — which is Tailwind's documented behaviour and not a
 * silent failure. That is the trade: 5.8 KB against a resolution rule that no
 * line of this codebase relies on.
 */
export function cn(...inputs) {
  return clsx(inputs);
}
