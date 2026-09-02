/**
 * Tailwind's theme is a thin mapping onto the custom properties declared in
 * app/globals.css. Nothing here holds a literal value that a component could
 * also have written inline — that is what PLAN §2.1 means by "no magic hex
 * values scattered through components".
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        /**
         * `font0` and `font2` are kept exactly as they were. PLAN §2.2 calls
         * this "the single most important detail for keeping the hero
         * identical": app/Components/UI/HeroText.js already writes
         * `font-font2` and `font-font0`, so pointing those names at the new
         * WOFF2 variables means the hero's markup needs no edit at all.
         *
         * `font1` is gone with the Skyscapers TTF it named — declared in CSS,
         * used by nothing.
         */
        font0: ["var(--font-alexbrush)", "cursive"],
        font2: ["var(--font-soria)", "serif"],
        yatra: ["var(--font-yatra)", "cursive"],

        /**
         * The design system's three faces. `sans` is overridden rather than
         * extended: Inter was being downloaded and preloaded on every page and
         * then losing to Tailwind's default `font-sans` stack, so nothing on
         * the site was ever set in it. Pointing `sans` at the variable is what
         * makes the font that was already being paid for actually render.
         */
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Didot", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      /**
       * Colours are `var(--…)` references, which means Tailwind's opacity
       * modifier does not work on them: `bg-accent/85` generates no rule at
       * all, silently, and the element renders with no background. The tokens
       * that need alpha carry it in the custom property instead —
       * `--c-surface`, `--c-hairline`, `--c-accent-line`. Use those.
       *
       * scripts/check-classes.mjs fails the build on any class that produced
       * no CSS, which is what caught this the first time.
       */
      colors: {
        ground: "var(--c-ground)",
        elevated: "var(--c-elevated)",
        surface: {
          DEFAULT: "var(--c-surface)",
          hover: "var(--c-surface-hover)",
        },
        hairline: {
          DEFAULT: "var(--c-hairline)",
          soft: "var(--c-hairline-soft)",
        },
        edge: {
          DEFAULT: "var(--c-edge)",
          strong: "var(--c-edge-strong)",
        },
        /**
         * The four text colours, brightest first. `strong` carries the value
         * the design note calls the lede colour; the size step is `text-lede`,
         * so the two live under different names — Tailwind emits both colours
         * and font sizes into the `text-*` namespace, and a key present in
         * both silently produces one class that does the wrong thing.
         */
        heading: "var(--c-heading)",
        strong: "var(--c-lede)",
        body: "var(--c-body)",
        meta: "var(--c-meta)",
        accent: {
          DEFAULT: "var(--c-accent)",
          soft: "var(--c-accent-soft)",
          line: "var(--c-accent-line)",
          /* The border token is 2.6:1 and fails as text; this is the one to
             use on a glyph. scripts/check-contrast.mjs enforces the
             difference. */
          muted: "var(--c-accent-muted)",
        },
      },

      fontSize: {
        display: ["var(--fs-display)", { lineHeight: "1.02", letterSpacing: "-0.01em" }],
        "section-h2": ["var(--fs-h2)", { lineHeight: "1.06", letterSpacing: "-0.01em" }],
        "item-h3": ["var(--fs-h3)", { lineHeight: "1.1" }],
        menu: ["var(--fs-menu)", { lineHeight: "1.06" }],
        "post-title": ["var(--fs-post-title)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        "post-h2": ["var(--fs-post-h2)", { lineHeight: "1.15" }],
        quote: ["var(--fs-quote)", { lineHeight: "1.22" }],

        /* Prose steps. The design note's "17 / 1.78", "15 / 1.8" and "17 / 1.8". */
        lede: ["1.0625rem", { lineHeight: "1.78" }],
        copy: ["0.9375rem", { lineHeight: "1.8" }],
        longform: ["1.0625rem", { lineHeight: "1.8" }],

        /* Mono steps: the eyebrow above a page, and everything else. */
        eyebrow: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.25em" }],
        label: ["0.65625rem", { lineHeight: "1.5", letterSpacing: "0.22em" }],
        metadata: ["0.65625rem", { lineHeight: "1.7", letterSpacing: "0.16em" }],
        tag: ["0.65625rem", { lineHeight: "1.5", letterSpacing: "0.1em" }],
      },

      spacing: {
        gutter: "var(--gutter)",
        "pad-top": "var(--pad-top)",
        /* The design note's minimum tap target. */
        tap: "44px",
      },

      /* Declared explicitly rather than relying on the spacing scale reaching
       * these plugins, so `min-h-tap` cannot quietly stop existing. */
      minHeight: { tap: "44px", control: "48px" },
      minWidth: { tap: "44px" },

      maxWidth: {
        measure: "var(--measure)",
        prose: "66ch",
        lede: "64ch",
      },

      borderRadius: {
        /* The design note's ladder: 999 · 20 · 16 · 14 · 12. */
        card: "1.25rem",
        panel: "1rem",
        cover: "0.875rem",
        field: "0.75rem",
      },

      backgroundImage: {
        gradient: "var(--gradient)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      transitionTimingFunction: {
        ease: "var(--ease)",
      },
    },
  },
  plugins: [],
};
