# Next.js 14 → 16 Migration

**Branch:** `chore/next-16-migration`
**Date:** 2026-09-01
**Motivation:** Next.js 14 reached end of life in October 2025. The pre-migration tree carried a **critical** unpatched advisory in its production dependency chain (see [§6](#6-verification-results)). This was a security fix, not a feature change.

Two hops, each an independently revertable commit:

| Commit | Hop |
| --- | --- |
| `9126091` | Pre-migration baseline capture (no code change) |
| `b094f06` | 14.2.7 → 15.5.25 |
| `a807a69` | 15.5.25 → 16.3.4 |

---

## 1. Versions

| Package | Before | After | Why |
| --- | --- | --- | --- |
| `next` | 14.2.7 | **16.3.4** | 16.x is the only **Active LTS** line. 16.3.4 is at or above 16.3.3, the August 2026 critical security release. |
| `react` | 18.3.1 | **19.2.8** | Required by Next 15 and 16. |
| `react-dom` | 18.3.1 | **19.2.8** | Must match `react`. |
| `eslint-config-next` | 14.2.7 | **16.3.4** | Must track `next`. |
| `eslint` | 8.57.0 | **9.39.5** | `eslint-config-next@16` peers `eslint >=9`. Installing 16 against ESLint 8 is a hard `ERESOLVE` failure. Resolved by upgrading ESLint, **not** by `--force` / `--legacy-peer-deps`. |
| `framer-motion` | 11.5.2 | **13.1.1** | 11.5.2 declares `peerDependencies.react: "^18.0.0"` only — it does not support React 19. 13.x declares `^18.0.0 \|\| ^19.0.0`. |
| `postcss` | 8.4.44 | 8.5.23 | Transitive; pulled forward by the toolchain. |

Unchanged, and verified as *not* needing a change:

| Package | Version | Why it did not move |
| --- | --- | --- |
| `@tsparticles/engine` / `react` / `slim` | 3.5.0 / 3.0.0 / 3.5.0 | `@tsparticles/react@3.0.0` peers `react: ">=16.8.0"` — **already React 19 compatible**. |
| `@tabler/icons-react` | 3.14.0 | Peers `react: ">= 16"`. |
| `tailwindcss` | 3.4.10 | Deliberately held on Tailwind 3. Tailwind 4 is a separate config rewrite and would make a hero regression impossible to bisect. |
| `clsx`, `tailwind-merge` | 2.1.1 / 2.5.2 | No React peer. |

`next` and `eslint-config-next` are pinned exactly (no caret), preserving the convention already in the repo and keeping a security-sensitive dependency reproducible.

### Node.js

| Where | Value |
| --- | --- |
| Required by `next@16.3.4` | `>=20.9.0` (was `>=18.17.0` on 14.2.7) |
| Installed locally | **v24.15.0** ✅ |
| `package.json` `engines` | **not set** — see [§7](#7-deferred) |
| `vercel.json` | does not exist |
| Vercel project setting | **not verified** — see [§6](#6-verification-results) |

---

## 2. Research findings

Read 2026-09-01. The docs snapshot reported `version: 16.3.4`, `lastUpdated: 2026-08-25`.

- <https://nextjs.org/docs/app/guides/upgrading/version-15>
- <https://nextjs.org/docs/app/guides/upgrading/version-16>
- <https://nextjs.org/support-policy>
- <https://nextjs.org/blog/nextjs-security-release-august-2026-update>
- <https://motion.dev/docs/react-upgrade-guide>

**Support status today:** 16.x is Active LTS (released 2025-10-21, stays Active until 17.x ships). 15.x is Maintenance LTS with **EOL 2026-10-21** — roughly 13 months away, which is why the migration lands on 16 rather than stopping at 15. Everything at or below 14.x is unsupported.

**Security:** the August 2026 release fixed two *critical* vulnerabilities — a `libheif`/`sharp` AVIF path allowing unauthenticated RCE during image optimization, and a Windows-filesystem RCE affecting apps using both routers. Patched in **16.3.3** and **15.5.24**. Both hops land above those floors (15.5.25, then 16.3.4).

### Where the brief was out of date

The brief asked that its own contents be verified rather than trusted. Six items did not survive checking:

1. **`sharp` does not need installing.** The brief said it "is not installed and the build warns twice." No sharp warning appears at 14.2.7, 15.5.25 or 16.3.4. `next@16.3.4` declares `"sharp": "^0.35.4"` in its own `optionalDependencies`, so it is already installed and resolvable. Adding it to `package.json` would duplicate a dependency Next owns.
2. **`next.config.mjs` had three remote patterns, not two.** The brief listed `ik.imagekit.io` and `images.unsplash.com`. There was also `api.dicebear.com` — see [§3](#note-on-remotepatterns).
3. **`viewport` / `themeColor` needed no migration.** `app/layout.js` exports neither, so there was nothing to move out of the `metadata` object. (The `viewport` hits in the repo are framer-motion's `viewport={{ once: true }}` scroll prop — unrelated.)
4. **`@tsparticles/react` was never a React 19 risk.** It peers `react >=16.8.0`. No decision was needed and nothing was downgraded.
5. **The orphan pair is a chain, not two independent files.** `ProjectsData.js` is imported by nothing; `ProjectCarousal.js` is imported *only* by `ProjectsData.js`. Both are unreachable.
6. **Route sizes cannot be compared at 16.** Next 16 deliberately removed the `Size` and `First Load JS` columns from `next build` output as inaccurate for RSC. The size comparison in [§6](#6-verification-results) is therefore 14 → 15 only.

### framer-motion: why `framer-motion@13`, not `motion`

The brief preferred moving to the `motion` package "over pinning an old one". `framer-motion` is not an old pinned package — it is still published, at **13.1.1, the same version as `motion@13.1.1`**, with identical React peer ranges. Staying on it satisfies React 19 with a one-line `package.json` change; switching to `motion/react` would rewrite the import line in 8 component files for no functional gain, against the brief's own "no refactoring, no import reordering" rule.

Per the upgrade guide, 11 → 12 has **no** React breaking changes, and 12 → 13's only breaking change is dropping the optional `@emotion/is-prop-valid` dependency, which affects Styled Components / Emotion users. This repo uses neither (verified: no `styled-components` or `@emotion` anywhere), so it does not apply.

---

## 3. Breaking changes

### Next 15

| Change | Applies? | Evidence |
| --- | --- | --- |
| Async request APIs (`cookies`, `headers`, `draftMode`, `params`, `searchParams`) | **No** | `git grep -n "cookies()\|headers()\|draftMode\|searchParams\|params"` over all `.js/.jsx/.mjs` returned **zero hits**. No dynamic routes exist — `app/` contains only `page.js`, `layout.js`, `loading.js`, `sitemap.js`. |
| React 19 minimum | **Yes** | Bumped to 19.2.8. No use of `useFormState`, `ReactDOM.render`, string refs, or class `defaultProps`/`propTypes` (verified by grep). |
| `fetch` no longer cached by default | **No** | No `fetch()` call in application code. |
| `GET` Route Handlers uncached | **No** | No `route.js` anywhere. |
| Client router cache `staleTimes` | **No** | Single-page app; no `<Link>` navigation between routes. |
| `runtime: "experimental-edge"` removed | **No** | No route segment config in the repo. |
| `@next/font` → `next/font` | **No** | Already `next/font/google` at `app/layout.js:1`. |
| `bundlePagesExternals` / `serverComponentsExternalPackages` renamed | **No** | Neither key present in `next.config.mjs`. |
| `NextRequest.geo` / `.ip` removed | **No** | No middleware, no `NextRequest` usage. |
| Speed Insights auto-instrumentation removed | **No** | Not used. |

### Next 16

| Change | Applies? | Evidence |
| --- | --- | --- |
| **Turbopack is the default builder** | **Yes — required a code fix** | No custom `webpack` config exists (so no `--webpack` opt-out needed), but Turbopack rejected a server-relative import. See [§4](#appcomponentsdpjs--the-only-forced-code-change). |
| **`next lint` removed** | **Yes — required a config migration** | `package.json` had `"lint": "next lint"`. See [§4](#eslintconfigmjs). |
| **ESLint flat config default** | **Yes** | `.eslintrc.json` replaced by `eslint.config.mjs`; ESLint upgraded 8 → 9. |
| Node.js ≥ 20.9 | **Satisfied** | Local v24.15.0. Vercel setting unverified — see [§7](#7-deferred). |
| Async request APIs — sync access fully removed | **No** | Same zero-hit grep as above. |
| Async `params`/`id` for `opengraph-image` / `icon` / `apple-icon` | **No** | No image-generation file conventions exist; `og-image.png` is a static file in `public/`. |
| Async `id` for `sitemap` | **No** | `app/sitemap.js:1` is `export default function sitemap()` with no `generateSitemaps`, so it receives no `id`. |
| `middleware` → `proxy` rename | **No** | No `middleware.js` / `.ts` in the repo. |
| Parallel routes require `default.js` | **No** | No `@slot` directories (`find app -name "@*" -type d` empty). |
| `revalidateTag` second argument | **No** | `next/cache` never imported. |
| PPR / `experimental_ppr` removed | **No** | Not used. |
| `experimental.dynamicIO` / `useCache` removed | **No** | Not used. |
| `serverRuntimeConfig` / `publicRuntimeConfig` removed | **No** | Not used. |
| AMP removed | **No** | Not used. |
| `devIndicators` options removed | **No** | Not configured. |
| `unstable_rootParams` removed | **No** | Not used. |
| Scroll-behavior override change | **No** | No `scroll-behavior` declaration in `app/globals.css` or `tailwind.config.js`. The page is `h-dvh overflow-hidden` and never scrolls. |
| `next/legacy/image` deprecated | **No** | Uses `next/image`. |
| `images.domains` deprecated | **No** | Already on `remotePatterns`. |

### `next/image` config changes (Next 16)

| Change | Applies? | Evidence |
| --- | --- | --- |
| `qualities` default → `[75]` | **No** | No `quality=` prop anywhere; the default 75 is inside the new allowlist. |
| `localPatterns.search` now required for query strings | **No** | No local image `src` contains `?` (grep clean). |
| `minimumCacheTTL` 60s → 4h | **Yes, behaviourally** | Affects the `ik.imagekit.io` project images. Left at the new default: these are static project screenshots that do not change. Worth knowing if an image is ever swapped in place at the same URL. |
| `imageSizes` drops `16` | **Cosmetic** | Only shrinks the emitted `srcset`. No 16px rendering in this design. |
| `maximumRedirects` → 3 | **No** | ImageKit and dicebear serve directly. |
| `dangerouslyAllowLocalIP` | **No** | No local-IP image hosts. |
| `dangerouslyAllowSVG` | **No — and deliberately left off** | The three dicebear avatars at `app/Components/Testimonials.js:231` are SVGs served through a **raw `<img>`**, which bypasses `next/image` entirely, so no SVG ever reaches the optimizer. Enabling `dangerouslyAllowSVG` would let attacker-controlled SVG through the optimizer, and SVG can carry script. It must stay off unless those avatars are routed through `next/image` *and* a strict CSP is added — a `PLAN.md` decision, not a migration one. |

### Note on `remotePatterns`

`images.unsplash.com` was removed — zero references in any source file. The remaining two:

- `ik.imagekit.io` — **in use** via `next/image` (`app/Components/Projects.js:18`). Kept.
- `api.dicebear.com` — referenced in `Testimonials.js`, but only through a raw `<img>`, so `next/image` never requests it. Its entry is therefore also functionally unused today. **Left in place deliberately:** `PLAN.md` is expected to convert that `<img>` to `<Image>` (it is the source of the `@next/next/no-img-element` warning), at which point the entry becomes necessary. Removing and re-adding it across two branches would be churn.

---

## 4. What changed in the code

Four source files, plus dependency and config manifests.

| File | Hop | Change | Origin |
| --- | --- | --- | --- |
| `package.json` | 1 & 2 | Version bumps; `"lint": "next lint"` → `"eslint ."` | Manual bumps; lint script by codemod |
| `package-lock.json` | 1 & 2 | Regenerated | npm |
| `app/Components/DP.js` | 2 | `import dp from "/public/dp.png"` → `"@/public/dp.png"` | **Manual — required** |
| `next.config.mjs` | 2 | Removed the unused `images.unsplash.com` remote pattern | Manual |
| `.eslintrc.json` | 2 | **Deleted** | Superseded by flat config |
| `eslint.config.mjs` | 2 | **Added** | `@next/codemod next-lint-to-eslint-cli`, then hand-trimmed |
| `components/ui/ProjectCarousal.js` | 2 | **Deleted** (187 lines) | Manual — dead code |
| `app/Components/ProjectsData.js` | 2 | **Deleted** (28 lines) | Manual — dead code |
| `AGENTS.md`, `CLAUDE.md` | 2 | **Added** | Generated by `next dev` in Next 16 |

**No component logic, JSX, styling, or Tailwind class was modified.** The hero source is byte-identical to 14.2.7 apart from the one import path in `DP.js`.

### `app/Components/DP.js` — the only forced code change

```diff
-import dp from "/public/dp.png";
+import dp from "@/public/dp.png";
```

`next build` failed hard on Next 16:

```
Error: Module not found: Can't resolve './public/dp.png'
server relative imports are not implemented yet.
Please try an import relative to the file you are importing from.
```

Webpack resolved the leading-slash path against the project root; Turbopack, now the default builder, does not implement server-relative imports. `@/` is the alias the rest of the repo already uses (`jsconfig.json` maps `"@/*"` → `"./*"`), so this matches existing convention and preserves the static-import behaviour that gives `next/image` its intrinsic width and height.

### `eslint.config.mjs`

The codemod ran `@eslint/migrate-config` and reported `Config does not export an array or supported pattern. Manual migration required.` It still produced a working flat config, but with four dead lines (`path`, `fileURLToPath`, `__filename`, `__dirname` — none referenced). Those were removed. It also left the superseded `.eslintrc.json` behind, which was deleted. Final file:

```js
import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([{
    extends: [...nextCoreWebVitals],
}]);
```

### Deleted orphans

`ProjectsData.js` is imported by nothing; `ProjectCarousal.js` is imported only by `ProjectsData.js`. Both were unreachable from `app/page.js`. `ProjectCarousal.js` also tripped the new `react-hooks/purity` rule (`Math.random()` during render, line 54). The brief authorised deletion as the correct fix if they blocked, and `PLAN.md` C13 wants them gone. **No lint rule was disabled or downgraded to achieve this.**

---

## 5. Edge cases hit

### 5.1 Text anti-aliasing changed — the one genuine rendering delta

This is the only visual difference between 14.2.7 and 16.3.4.

**What happens:** hero text renders with **subpixel (RGB) anti-aliasing** after the migration, where before it used **grayscale** anti-aliasing. Same font files, same glyphs, same positions.

**Root cause — measured, not guessed.** Probing computed styles on the four hero text nodes:

```
BASELINE (framer-motion 11.5.2): ancestor DIV { will-change: transform, opacity }
AFTER    (framer-motion 13.1.1): ancestor DIV — no will-change at all
```

framer-motion 11 leaves `will-change` on the wrapper *after* the entry animation finishes, which keeps the subtree promoted to its own compositing layer, and Chrome falls back to grayscale AA on composited layers. framer-motion 13 correctly clears `will-change` on completion, the layer is dropped, and subpixel AA returns. Stale `will-change` is a known performance bug; removing it is an improvement. **This originates in framer-motion, not Next.js** — hop 2 (15 → 16) alone produced a `0.0000%` pixel difference.

**Why it is not a hero regression:** every element of the visual contract has a *byte-identical* bounding box, font size, weight and colour. Measured exactly, with no tolerance applied:

```
                     baseline           after
  "Hi!"              49,121,39,36    →  49,121,39,36     EXACT
  "I'm"              32,178,358,32   →  32,178,358,32    EXACT
  "ZUBAIR"           32,210,358,48   →  32,210,358,48    EXACT
  "Bin Shaukat"      32,244,226,60   →  32,244,226,60    EXACT
  "Web Developer"    42,524,152,73   →  42,524,152,73    EXACT
  "Mobile Developer" 203,745,165,61  →  203,745,165,61   EXACT
  dot nav x5         all             →  all              EXACT
```

**It is invisible on real devices.** The effect only exists at `devicePixelRatio: 1`. At DPR 2 — what every phone and modern laptop uses — Chrome uses grayscale AA regardless of layer promotion, and the difference collapses into the noise floor:

| Viewport | Differing px | Strongly differing |
| --- | --- | --- |
| 390×844 @ **DPR 1** | 2.81% | 0.31% |
| 390×844 @ **DPR 2** | 0.36% | **0.023%** |
| *(same-build noise floor)* | *0.47%* | *0.005%* |

At 390 CSS px the real device is a phone at DPR 3. **This needs a decision from you** — see [§7](#7-deferred).

### 5.2 `next/font` family naming changed

`next/font/google` emits a different `font-family` value in 15+:

```
before: __Yatra_One_4f563a, __Yatra_One_Fallback
after:  "Yatra One", "Yatra One Fallback", cursive
```

Internal to `next/font`. The same font loads, the box is identical, and the added `cursive` generic sits at the end of the chain where it is never reached. No action needed.

### 5.3 ESLint 9 surfaced 7 new errors in pre-existing code — **needs your decision**

The warnings the brief protected were **not** promoted to errors and are untouched:

```
app/Components/Testimonials.js:231:23                    warning  @next/next/no-img-element
components/ui/background-beams-with-collision.js:134:6   warning  react-hooks/exhaustive-deps
```

(The third, `ProjectCarousal.js:52` `exhaustive-deps`, disappeared with the deleted file.)

But `eslint-config-next@16` ships React-Compiler-aware rules that did not exist in 14.2.7. They flag **pre-existing patterns in live hero code** as errors:

```
components/ui/background-beams-with-collision.js
  202:28  error  Cannot call impure function during render      react-hooks/purity
  203:28  error  Cannot call impure function during render      react-hooks/purity
  223:35  error  Cannot call impure function during render      react-hooks/purity
components/ui/hello-card.js
  23:8 24:8 25:8 26:8  error  Cannot create components during render  react-hooks/static-components
```

- `background-beams-with-collision.js` — `Math.random()` inside the `Explosion` component, which generates the randomised collision debris. That randomness is the intended visual effect.
- `hello-card.js` — an `Icon` component defined inside the render body. **This file renders the "Hi!" dashed-bracket badge**, an explicit item in the visual contract.

**Nothing was suppressed and no rule was relaxed.** These are left as-is because fixing them means refactoring live, hero-critical components, which the brief forbids during migration. **They block nothing:** Next 16's `next build` no longer runs linting, so build and deploy are unaffected. See [§7](#7-deferred).

### 5.4 `next dev` writes `AGENTS.md` and `CLAUDE.md`

Next 16 generates both on `next dev` and re-creates them if deleted. Committed so the working tree stays clean. Disable with `agentRules: false` in `next.config.mjs` if unwanted.

### 5.5 `npm ls` reports `@img/sharp-wasm32` as extraneous

Persists after a clean `npm ci`. It is one of `sharp`'s optional platform packages, `sharp` is an optional dependency of `next@16.3.4`, and the package **is** present in `package-lock.json`. Cosmetic npm accounting for optional platform binaries; it does not affect the build.

### 5.6 What to watch in production

1. **First paint of the hero fonts.** The custom `@font-face` faces in `app/globals.css:5-24` still declare no `font-display`, so the FOIT window is unchanged — but Turbopack emits CSS differently from webpack, which can shift *when* those faces resolve. Deliberately not fixed here (`PLAN.md` C14). Watch the hero on a cold, throttled load.
2. **Total Blocking Time.** Consistently ~330 ms worse (see [§6](#lighthouse)). Real, and expected from React 19 + framer-motion 13.
3. **Image cache TTL.** Now 4 hours by default. If an ImageKit URL is ever replaced in place, the old image can persist far longer than before.

---

## 6. Verification results

| Gate | Result |
| --- | --- |
| `npm run build` — zero errors, no new warnings | ✅ Compiles in ~4.6 s on Turbopack. Zero errors, and the build emits **no** warnings at all (Next 16 no longer lints during build). |
| Every route still `○ Static` | ✅ All four — `/`, `/_not-found`, `/robots.txt`, `/sitemap.xml`. **No route flipped to `ƒ`.** |
| Route sizes vs baseline | ⚠️ Comparable for 14 → 15 only; Next 16 removed the columns. `/` grew **202 kB → 221 kB** First Load JS (+9.4%) from React 19 + framer-motion 13. |
| `npm run start` — all routes load | ✅ `/` 200, `/robots.txt` 200, `/sitemap.xml` 200, unknown path 404 — identical to baseline. `robots.txt` byte-identical; `sitemap.xml` differs only in its `new Date()` build timestamp; content types unchanged. |
| **Zero hydration warnings** | ✅ Zero console output of any kind, in the production build, at all four viewports, across all five section transitions. |
| `npm run dev` — HMR works | ✅ Ready in 4.4 s. An edit to `app/layout.js` propagated live (`<title>` changed, then reverted). |
| Interactions | ✅ All five sections navigate and render correct content; dot nav works; dock links hover; **styled-jsx (`About.js:251` marquee) compiles under Turbopack** — `.animate-marquee` and `@keyframes marquee` are present exactly when About is mounted and absent otherwise, so scoping is still correct. |
| Hero pixel-identical at 390 / 640 / 1440 | ⚠️ Geometry and typography **exactly identical** at all four widths (390, 639, 640, 1440), including the `sm:` variant swap at 639→640 (65 → 73 elements). One rendering delta: text AA mode — [§5.1](#51-text-anti-aliasing-changed--the-one-genuine-rendering-delta). Hop 15 → 16 in isolation: **0.0000%**. |
| Lighthouse (Chrome, mobile) — no category worse | ⚠️ Performance 63 → 61. See below. |
| `npm audit` — no critical/high in the Next chain | ✅ **Production chain: 0 vulnerabilities** (was 3, including 1 critical). |
| `npm ls --depth=0` diffed, every change explained | ✅ [§1](#1-versions). Raw: `docs/deps-before.txt` vs `docs/deps-after.txt`. |
| Deployed to a Vercel preview | ❌ **Not done — blocked.** See below. |
| `MIGRATION.md` written | ✅ This file. |

### Security: the actual point of this migration

Production-only audit (`npm audit --omit=dev`), which is what ships:

| | Baseline 14.2.7 | After 16.3.4 |
| --- | --- | --- |
| Total | **3 (2 high, 1 critical)** | **0** |

The baseline's critical finding was `GHSA-7gfc-8cq8-jh5f` — *Next.js authorization bypass* (CVE-2025-29927) — alongside two Server Actions / Server Components DoS advisories. All cleared.

The 6 remaining `npm audit` findings are **devDependencies only** (`glob`, `brace-expansion`, `minimatch`, `picomatch`, `postcss-selector-parser`, `yaml` — ESLint and Tailwind build tooling). `next` does not appear in the vulnerability list, and none reach the shipped bundle.

### Lighthouse

Chrome was not installed on this machine, so **Chrome for Testing 152.0.7977.54** was used — Google's official Chrome build, not Edge. Median of **3 runs** per build; single runs proved unreliable (one outlier mobile run scored 46 with CLS 0.178, which did not reproduce).

**Mobile** (`--form-factor=mobile`, throttled):

| Category | Baseline | After | Δ |
| --- | --- | --- | --- |
| Performance | 63 | **61** | −2 ⚠️ |
| Accessibility | 94 | 94 | same |
| Best practices | 100 | 100 | same |
| SEO | 100 | 100 | same |

| Metric (median of 3) | Baseline | After | Δ |
| --- | --- | --- | --- |
| Total Blocking Time | 1242 ms | 1574 ms | **+332 ms** ⚠️ |
| Largest Contentful Paint | 3979 ms | 3905 ms | −74 ms ✅ |
| Cumulative Layout Shift | 0 | **0** | none ✅ |

Per-run scores: baseline `[63, 63, 61]`, after `[61, 62, 61]` — the distributions overlap, and **CLS was 0 in every single run on both builds**. The consistent, real regression is TBT, which tracks the +19 kB of First Load JS from React 19 and framer-motion 13. This is the expected cost of the React 19 requirement rather than a migration defect. The page ships ~221 kB of JS for a portfolio; the beams and particle field dominate, and reducing that is a `PLAN.md` concern.

**Desktop:** Performance 98 → **99**, Accessibility 96 → 96, Best practices 100 → 100, SEO 100 → 100.

### Reproducing the visual check

The harness is committed at `docs/post-migration/capture2.js` and `compare3.js`.

It was calibrated before use: capturing the *same* build twice establishes a noise floor (≤0.47% differing / ≤0.005% strongly differing pixels; ±3 px geometry jitter from the dot-nav scale settle). Three decorative layers are irreducibly random and are frozen or hidden rather than compared — the tsParticles canvas, the in-flight beams, and the collision debris, all of which call `Math.random()` per render. All CSS animations are pinned to a deterministic end state so the `animate-pulse` blob cannot drift with capture timing. Everything else — every element's box, font, weight, colour and gradient — is compared strictly.

Raw output: `docs/post-migration/visual-contract.txt`. Screenshots: `docs/baseline-premigration/` and `docs/post-migration/` (`live-*.png` as rendered, `frozen-*.png` as compared).

### Vercel preview — **outstanding**

Not completed: the Vercel CLI is not installed, the project has no `.vercel` link, and authenticating requires an interactive browser login that cannot be automated from here. This matters precisely because Node version and build environment differ from local — the gate most likely to catch a mismatch is the one still open.

To finish it (in a Claude Code session, `!` runs a command directly):

```bash
npm i -g vercel
vercel login
vercel link
vercel            # preview deploy of the current branch
```

Then confirm on the preview URL: the hero renders at 390 / 640 / 1440, the console is clean, all five sections navigate, and — most importantly — **the Vercel project's Node.js version is 20.9 or newer** (Settings → General → Node.js Version). Next 16 will not build below 20.9.

---

## 7. Deferred

Left untouched for `PLAN.md`, so nothing falls between the two documents:

| Item | Where | Why deferred |
| --- | --- | --- |
| Metadata: no `metadataBase`, wrong hostname, `keywords`/`authors`/`creator` misplaced inside `openGraph`, `twitter.images` pointing at a bare origin | `app/layout.js:11-53` | `PLAN.md` C1. Explicitly out of scope; mixing it in would make both changes un-reviewable. |
| Font loading: no `font-display` on the three `@font-face` rules; unsubsetted TTFs | `app/globals.css:5-24` | `PLAN.md` C14. |
| `<img>` → `next/image` for the dicebear avatars | `app/Components/Testimonials.js:231` | Source of the surviving `no-img-element` warning. Needs the `dangerouslyAllowSVG` / CSP decision in [§3](#nextimage-config-changes-next-16). |
| `react-hooks/exhaustive-deps` on `parentRef` | `components/ui/background-beams-with-collision.js:134` | Pre-existing; fixing it changes live hero behaviour. |

**Three decisions I did not make for you:**

1. **The text anti-aliasing change ([§5.1](#51-text-anti-aliasing-changed--the-one-genuine-rendering-delta)).** Layout is provably identical and the effect vanishes at DPR ≥ 2, so I accepted it. If you want the old grayscale rendering back at DPR 1, it takes an explicit `will-change: transform` on the hero text wrapper — which reintroduces the stale-layer cost framer-motion 13 just removed. Recommendation: leave it.
2. **The 7 new lint errors ([§5.3](#53-eslint-9-surfaced-7-new-errors-in-pre-existing-code--needs-your-decision)).** They do not block the build. Fixing them means refactoring `hello-card.js` (the "Hi!" badge) and the beams' randomness — real changes to hero code that belong in their own reviewable commit, with the visual harness re-run afterwards.
3. **`engines.node`.** Not added to `package.json`. Adding `"engines": { "node": ">=20.9.0" }` would document Next 16's floor and make a bad Vercel Node setting fail loudly instead of silently — but it also changes deploy behaviour, so it is your call rather than a migration side effect.

---

## 8. Rollback

Both hops are separate commits and revert cleanly.

**Full rollback to 14.2.7:**

```bash
git checkout main            # the migration never touched main
rm -rf node_modules .next
npm ci
npm run build
```

**Roll back only hop 2, staying on 15.5.25** — still supported, still above the 15.5.24 security floor. This is the recommended option if Next 16 specifically misbehaves:

```bash
git revert --no-commit a807a69
git commit -m "Revert Next 16 migration, stay on 15.5.25"
rm -rf node_modules .next
npm ci
npm run build
```

**Undo both hops but keep the baseline artifacts:**

```bash
git revert --no-commit a807a69 b094f06
git commit -m "Revert Next.js migration to 14.2.7"
rm -rf node_modules .next && npm ci
```

If production is already deployed and needs reverting immediately, roll back in the Vercel dashboard (Deployments → previous deployment → Promote to Production) — faster than a rebuild — then land the git revert afterwards.

> ⚠️ Reverting to 14.2.7 **restores the critical authorization-bypass advisory** (CVE-2025-29927) and two DoS advisories. Treat it as a short-term measure only.
