/**
 * The intro overlay's session flag.
 *
 * PLAN §3.3: "once per session. Session flag in memory or a cookie — never
 * `localStorage`." A session cookie is the one of the two that survives a
 * reload, which is what "once per session" has to mean — a module-level
 * variable would replay the whole sequence every time the reader refreshed, or
 * arrived back from an external link.
 *
 * No `Expires` and no `Max-Age`, so the browser drops it when the session
 * ends. It carries no value beyond "1", is not read by the server, and is not
 * sent to anything: it exists so the second page view of a session is not made
 * to watch the first one's animation again.
 *
 * `.mjs` rather than `.js` so the verification scripts in scripts/ can import
 * the same constant — the package is CommonJS, and a plain `.js` here would be
 * importable by the bundler and not by Node. components/Preloader.js and
 * scripts/visual-hero.mjs and scripts/check-preloader.mjs all read this name
 * from here, which is what stops a test from suppressing an overlay whose flag
 * has since been renamed and then reporting a clean result.
 */
export const INTRO_COOKIE = "zb_intro";
