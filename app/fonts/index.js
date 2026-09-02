import localFont from "next/font/local";
import { Inter, Yatra_One, Bodoni_Moda, JetBrains_Mono } from "next/font/google";

/**
 * Every typeface the site loads, in one file.
 *
 * All six are self-hosted. `next/font/google` downloads its fonts at build
 * time and serves them from this origin — the bundled docs are explicit that
 * "no requests are sent to Google by the browser" — so the Google entries here
 * cost no third-party origin, no preconnect and no DNS lookup.
 *
 * WHY SIX
 *
 * Four are the hero's, and the hero is frozen through Phase 2 (PLAN §0.2):
 * Soria sets "I'm" and "ZUBAIR", Alex Brush sets "Bin Shaukat", Yatra One sets
 * the "Hi!" badge, and Inter sets the two gradient pills. Two are the design
 * system below it: a Didone for every heading level and a mono for every
 * eyebrow, label and number (design note, "Three decisions I would defend",
 * §02).
 *
 * WHY NOT SORIA FOR THE HEADINGS
 *
 * The prototype sets its headings in `'Bodoni Moda','Prata',Didot,serif`, and
 * the obvious economy would be to use the brand's own display face there
 * instead and load one font fewer. Soria cannot do it: its cmap has no hyphen,
 * no en or em dash, no percent sign, no ellipsis and no middot. "Cross-Platform
 * Mobile Apps" is an <h1> on /services/mobile and would render with a missing
 * glyph box in the middle of it. Soria stays what it has always been — the
 * hero lockup, which is all caps and unpunctuated.
 *
 * WHICH ONES PRELOAD, AND WHY THAT IS FIVE AND NOT TWO
 *
 * PLAN §2.2's done-condition asks for "two font preloads in <head>". Five ship.
 * `next/font` preloads by default and the numbers below are measured on
 * `/` at Lighthouse's mobile preset, so here is the whole accounting:
 *
 *   soria, alexBrush    preload. These are the two the plan means: §2.2 asks
 *                       for `preload: true` on both, and they set the hero's
 *                       lockup, which is the first thing on the site.
 *
 *   inter               preload. Already preloaded before Phase 2, and it sets
 *                       the hero's two gradient pills above the fold.
 *
 *   yatraOne            preload. Already preloaded before Phase 2. Dropping it
 *                       measured 1904ms against 1984ms — 4% of LCP — and the
 *                       badge it sets is `w-fit` inside the frozen hero, so a
 *                       swap moves its own corner marks. Not a trade worth
 *                       making in the phase whose gate is pixel identity.
 *
 *   mono                preload, added deliberately. It sets the sticky band's
 *                       readout and Index label, which are above the fold on
 *                       every page. Without it, swapping late shifted the band
 *                       and the breadcrumbs: CLS measured 0.0007 to 0.0014 on
 *                       inner routes. With it, CLS is 0.0000 everywhere, for
 *                       128ms of LCP on `/`. §2.2's done-condition asks for
 *                       CLS 0.00; this is what buys it.
 *
 *   bodoni              no preload. On `/` the first heading it sets is a full
 *                       viewport below the fold. On an inner page it is the
 *                       <h1>, but it is one short block near the top of an
 *                       otherwise empty column, and CLS with it unpreloaded
 *                       measures 0.0000 — so the preload would cost bytes on
 *                       the critical path of every page to fix nothing.
 *
 * `adjustFontFallback: false` on the two local faces is PLAN §2.2: at the
 * hero's 108px display size a mis-metric'd fallback flash is worse than a
 * clean swap.
 */

/** Body copy, UI and the hero's two gradient badge pills. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * The "Hi!" badge in components/ui/hello-card.js, and nothing else. Kept
 * exactly as Phase 1 had it — it is inside the frozen hero.
 */
export const yatraOne = Yatra_One({
  subsets: ["latin"],
  weight: ["400"], // Yatra One ships one weight
  display: "swap",
  variable: "--font-yatra",
});

/**
 * Soria. Tailwind exposes it as `font-font2`, and Alex Brush as `font-font0`,
 * because those are the class names app/Components/UI/HeroText.js already
 * uses. Keeping the names is what lets the hero's markup go completely
 * untouched while the file underneath it changes from an unsubsetted TTF
 * discovered third-order to a preloaded WOFF2 (PLAN §2.2, step 4).
 */
export const soria = localFont({
  src: "./soria-regular.woff2",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  variable: "--font-soria",
});

/** Alex Brush. The hero's "Bin Shaukat", and the footer's signature. */
export const alexBrush = localFont({
  src: "./alexbrush-regular.woff2",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  variable: "--font-alexbrush",
});

/**
 * The display Didone. Every heading below the hero, always at weight 400 with
 * tracking near zero — the design note's second defended decision.
 *
 * A single static weight rather than the variable cut: the design uses exactly
 * one weight, and the variable file carries an optical-size axis and the whole
 * 400–900 range for a page that would never move off 400.
 */
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
  preload: false,
  variable: "--font-display",
});

/**
 * The mono that holds every index, label and number. PLAN §2.3 asks for
 * exactly one, wired as `font-mono`, replacing the inline declarations that
 * named six fonts the site never loaded.
 */
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
  variable: "--font-mono",
});

/** Every font variable, for the <body> class. */
export const fontVariables = [
  inter.variable,
  yatraOne.variable,
  soria.variable,
  alexBrush.variable,
  bodoni.variable,
  mono.variable,
].join(" ");
