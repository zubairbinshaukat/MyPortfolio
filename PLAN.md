# PLAN.md — zubyr.dev SEO + structure retrofit

Target spec: `seo-implementation.md` (repo root — note the actual filename is lowercase, untracked in git).
Audit date: **2026-09-01**. Every claim below is traceable to a file path, a build output, or the Lighthouse JSON described in §1.9.

---

## 1. What we have

### 1.1 Stack

| Thing | Value | Evidence |
|---|---|---|
| Framework | **Next.js 14.2.7**, **App Router** (`app/`) | `package.json:14`, `app/layout.js` |
| Language | **JavaScript only** — zero `.ts`/`.tsx` in repo | `jsconfig.json`, `find . -name "*.tsx"` → empty |
| Styling | **Tailwind CSS 3.4.1** + a lot of inline `style={{}}` objects; one `styled-jsx` global block | `tailwind.config.js`, `app/Components/About.js:251` |
| Package manager | **npm** (only `package-lock.json`) | root listing |
| Image optimizer | **`sharp` NOT installed** — build warns twice | `npm run build` output |
| Aliases | `@/*` → repo root | `jsconfig.json:4` |
| Dark mode | `darkMode: "class"`, `<html class="dark">` hardcoded | `tailwind.config.js:3`, `app/layout.js:57` |

Runtime deps: `framer-motion@11.5.2`, `@tsparticles/{engine,react,slim}@3.x`, `@tabler/icons-react@3.14`, `clsx`, `tailwind-merge`. **No three.js / R3F** — the spec's §8 Three.js clause does not apply; tsParticles is the equivalent risk.

### 1.2 Routes — the whole list

| Route | Rendered by | Build type |
|---|---|---|
| `/` | `app/page.js` | ○ Static |
| `/_not-found` | Next default | ○ Static |
| `/robots.txt` | `app/robots.txt` (static file) | ○ Static |
| `/sitemap.xml` | `app/sitemap.js` | ○ Static |

**There is one content route.** It is not even a long-scroll page — it is a **state-machine section swapper**: `app/page.js:13` defines `SECTIONS = ["hero","about","projects","testimonials","contact"]`, and `app/page.js:198-215` mounts **exactly one** section at a time inside `<AnimatePresence mode="wait">`. Wheel and touch are hijacked (`app/page.js:109-166`, `preventDefault` on `wheel`) to swap sections.

Consequence: **`about`, `projects`, `testimonials`, `contact` never exist in the initial HTML.** Confirmed against `.next/server/app/index.html` (25,093 bytes):

| String | Occurrences in server HTML |
|---|---|
| `ZUBAIR` | 1 |
| `Bin Shaukat` | 2 |
| `Hi!` | 1 |
| `Web Developer` / `Mobile Developer` | 1 / 1 |
| `Lahore` | 2 — **both inside `<meta>` tags only** |
| `OpenCinema` | **0** |
| `n8n` | **0** |
| `I build things for the web` | **0** |
| `zubairbinshaukat4455` (contact email) | **0** |
| any testimonial text | **0** |

### 1.3 `"use client"` files — 11 of them

| File | Line | Why it's client |
|---|---|---|
| `app/page.js` | 1 | `useState` section machine, `wheel`/`touch` listeners |
| `app/Components/About.js` | 1 | `setInterval` role rotator, framer-motion |
| `app/Components/Contact.js` | 1 | form `useState` |
| `app/Components/MainText.js` | 1 | only to host `<SparklesCore>` |
| `app/Components/Projects.js` | 1 | carousel index state + drag |
| `app/Components/ProjectsData.js` | 1 | **ORPHAN — imported by nothing** (verified) |
| `app/Components/Testimonials.js` | 1 | carousel index state |
| `components/ui/background-beams-with-collision.js` | 1 | animated beams, refs |
| `components/ui/floating-dock.js` | 6 | `useMotionValue`/`useSpring` magnify |
| `components/ui/ProjectCarousal.js` | 1 | **ORPHAN** — only imported by `ProjectsData.js` |
| `components/ui/sparkles.js` | 1 | tsParticles engine init |

Server components today: `app/layout.js`, `app/loading.js`, `app/Components/Hero.js`, `app/Components/DP.js`, `app/Components/UI/HeroText.js`, `app/Components/floating.js`, `components/ui/hello-card.js`.

### 1.4 Fonts — current state

**Via `next/font/google`** — `app/layout.js:1,4-9`:

| Family | Weights | Subsets requested | Emitted | Preloaded? |
|---|---|---|---|---|
| **Inter** | variable `100 900` | `["latin"]` | 7 woff2 faces (latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, vietnamese) totalling ~187 KB | **No** |
| **Yatra One** | `["400"]` | `["latin"]` | 3 woff2 — incl. **devanagari 47.7 KB** | **No** |

Yatra One renders exactly one word: `"Hi!"` at `components/ui/hello-card.js:29`.

**Via raw `@font-face` on unsubsetted TTF** — `app/globals.css:5-24`, files served from `/public/fonts/`:

| CSS family | File | Real family (name table) | Size | `font-display` | Used at |
|---|---|---|---|---|---|
| `Font1` | `/fonts/font-1.ttf` | **Skyscapers** | 33 KB | *(none)* | **nowhere** — `font-font1` class has 0 usages → dead |
| `Font2` | `/fonts/font-2.ttf` | **Soria** | 75 KB | *(none)* | `HeroText.js:9,10,26,27` — `"I'm"` + `ZUBAIR` |
| `Font0` | `/fonts/font-0.ttf` | **Alex Brush** | 47 KB | *(none)* | `HeroText.js:14,31` — `"Bin Shaukat"` |
| *(none)* | `/fonts/font-3.ttf` | **Niconne** | 44 KB | — | **no `@font-face` at all** → dead file |

Verified in the built stylesheet `.next/static/css/b46a14f937a9eace.css`:
`@font-face{font-family:Font2;src:url(/fonts/font-2.ttf) format("truetype");font-weight:400;font-style:normal}` — **no `font-display`** ⇒ browser default `auto` ⇒ FOIT on the hero lockup.

`grep -c 'as="font"' .next/server/app/index.html` → **0**. Nothing is preloaded; both hero display faces are third-order discoveries (HTML → CSS → `@font-face` → TTF).

**Fonts referenced but never loaded** (silent fallback to Inter/monospace) — ~25 inline `fontFamily` call-sites across `About.js`, `Projects.js`, `Testimonials.js`, `Contact.js`: `'Outfit'`, `'Sora'`, `'DM Sans'`, `'General Sans'`, `'JetBrains Mono'`, `'Fira Code'`.

### 1.5 Images

| File | Dimensions | Size | Format | How it's rendered |
|---|---|---|---|---|
| `public/dp.png` | **2160 × 3840** | **7,289 KB** | PNG RGBA | `next/image` static import, `app/Components/DP.js:3,27-34` — `width={700} height={700}`, `priority`, **no `sizes`** |
| `public/logo.png` | 512 × 512 | 214 KB | PNG RGBA | `next/image`, `app/Components/Hero.js:17-23` — `width={500} height={500}`, painted at 40×40, `alt="logo"` |
| `public/og-image.png` | **3448 × 2178** | **2,782 KB** | PNG | absolute URL in `app/layout.js:36`; metadata declares **1700 × 1030** → **dimensions lie** |
| `public/projects/biz-xpert.png` | 3444 × 2164 | 4,126 KB | PNG | `next/image` `Projects.js:186-193`, `width={500} height={500}` inside `aspect-[16/9]` |
| `public/projects/bizmobile1.png` | 598 × 1298 | 625 KB | PNG | same component |
| `public/projects/bizmobile2.png` | 592 × 1268 | 104 KB | PNG | referenced **only** by orphan `ProjectsData.js:24` |
| `public/projects/bizmobile3.png` | 546 × 1192 | 31 KB | PNG | same — orphan only |
| `https://ik.imagekit.io/xosswhicz/project1.png` | unverified | unverified | — | `Projects.js:18` |
| `https://api.dicebear.com/9.x/avataaars/svg?...` ×3 | SVG | — | SVG | **raw `<img>`**, `Testimonials.js:231` (ESLint `no-img-element` warning) |

**Zero WebP/AVIF source assets. Every raster asset in the repo is PNG.** `next.config.mjs` sets no `images.formats` (Next 14 default = `['image/webp']` on the optimizer only).

### 1.6 Animation libraries and where they load

- **framer-motion** — `app/page.js:4`, `About.js:4`, `Contact.js:4`, `Projects.js:4`, `Testimonials.js:4`, `sparkles.js:7`, `floating-dock.js:9-15`, `background-beams-with-collision.js:3`, `ProjectCarousal.js`. Statically imported everywhere — no `dynamic()`, no lazy chunk.
- **@tsparticles/{engine,react,slim}** — `components/ui/sparkles.js:4-5`, mounted by `MainText.js:18` (desktop hero divider only, `particleDensity={1200}`). Engine init in a `useEffect`, but the module is in the main bundle.
- **No three.js.**

### 1.7 Existing SEO surface

| Item | State |
|---|---|
| `metadata` | `app/layout.js:11-53` only. No other page has any. |
| `metadataBase` | **none** |
| `title.template` | **none** — plain string `"Zubair Bin Shaukat"` |
| `alternates.canonical` | **none** on any route |
| `robots` metadata object | **none** |
| Hostname used | **`https://zubairbinshaukat.vercel.app`** everywhere (`layout.js:32,36,51`, `sitemap.js:4`, `robots.txt:3`) — **not `zubyr.dev`** |
| `keywords` / `authors` / `creator` | present but **nested inside `openGraph`** (`layout.js:20-31`) → Next ignores them there; they emit no tags |
| `twitter.images` | `["https://zubairbinshaukat.vercel.app"]` (`layout.js:51`) → emits `<meta name="twitter:image" content="https://zubairbinshaukat.vercel.app/">` — **not an image** |
| JSON-LD / schema.org | **none** |
| `sitemap.xml` | `app/sitemap.js` — **1 URL**, vercel.app, no `changeFrequency`/`priority` |
| `robots.txt` | `app/robots.txt` static file — `Allow: /` + vercel.app sitemap. **No AI-crawler rules** |
| Redirects | **none** in `next.config.mjs` |
| `/llms.txt` | **none** |
| `opengraph-image` route | **none** |
| Internal `<a>` navigation | **zero.** Section nav is `onClick` (`app/page.js:292`). Only external links exist: `floating-dock.js:56,141`, `Contact.js:158,200`, `Projects.js:213` |
| Landmarks | `<section>` on the four non-hero components; **no `<nav>`, no `<main>`, no `<footer>`, no `<article>`** anywhere |
| `<h1>` count in server HTML | **4** — `hello-card.js:29` "Hi!" ×2 and `HeroText.js:10,27` "ZUBAIR" ×2, because desktop and mobile variants are both mounted and hidden with `sm:hidden` / `hidden sm:flex` (`Hero.js:26,29`) |

### 1.8 Build output — `npm run build`, Next.js 14.2.7

```
Route (app)                              Size     First Load JS
┌ ○ /                                    115 kB          202 kB
├ ○ /_not-found                          871 B            88 kB
├ ○ /robots.txt                          0 B                0 B
└ ○ /sitemap.xml                         0 B                0 B
+ First Load JS shared by all            87.1 kB
  ├ chunks/23-dcf9caf762f350c2.js        31.6 kB
  ├ chunks/fd9d1056-844a5cc198651369.js  53.6 kB
  └ other shared chunks (total)          1.95 kB
```

**Spec §8 budget is < 120 KB initial route JS. We are at 202 KB — ~1.7× over.**

Build warnings: `sharp` missing (×2); `@next/next/no-img-element` at `Testimonials.js:231`; `react-hooks/exhaustive-deps` at `background-beams-with-collision.js:134` and `ProjectCarousal.js:52`.

### 1.9 Lighthouse — actually run

Real run, not estimated. Method: `lighthouse@12.8.2` CLI, `--form-factor=mobile --screenEmulation.mobile`, headless **Microsoft Edge** (Chrome is not installed at either standard path on this machine), against `next start` on `http://localhost:3000/`, `2026-09-01T14:58:39Z`, **single run on localhost**. This is lab data with simulated throttling — it is not field/CrUX data and the spec (§4) is right that Search Console CWV is the number that counts.

| Category | Score |
|---|---|
| Performance | **48** |
| Accessibility | **94** |
| Best Practices | **100** |
| SEO | **100** |

| Metric | Value |
|---|---|
| FCP | 1.6 s |
| **LCP** | **4.1 s** |
| **TBT** | **2,230 ms** |
| **CLS** | **0.178** |
| Speed Index | 4.1 s |
| TTI | 9.3 s |
| Main-thread work | 22.0 s |
| Script bootup | 9.5 s |

- **LCP element = the portrait `<img>`** from `DP.js:27` (`largest-contentful-paint-element` = 4,110 ms). Not the `<h1>`.
- **CLS is one single shift, score 0.1776, caused by that same `<img>`.** Cause: `width={700} height={700}` reserves a 1:1 box, but the element paints at **330 × 586** because `className="w-full h-auto object-contain"` (`DP.js:32`) overrides the height. The reserved aspect ratio is wrong.
- Opportunities: `image-delivery` 208 KiB · `uses-responsive-images` 196 KiB · `render-blocking-resources` 800 ms (the single 7.7 KB CSS file) · `unused-javascript` 43 KiB · `legacy-javascript` 11 KiB.
- `font-display` audit flags exactly `/fonts/font-2.ttf` (32 ms) and `/fonts/font-0.ttf` (30 ms).
- Sole accessibility failure: **`button-name`** → `components/ui/floating-dock.js:69`, the mobile dock toggle has no accessible name.

> **The SEO score of 100 is a trap.** Lighthouse SEO only inspects the HTML that was delivered. It has no opinion about the fact that four of five sections' copy is absent from it.

---

## 2. What's blocking the SEO spec

| # | Gap | Severity |
|---|---|---|
| B1 | Four of five content sections render **only after JS**, one at a time (`app/page.js:198-215`). Violates spec §0 outright. | **Critical** |
| B2 | **One route exists.** Spec §1 requires 11. No sitelinks are possible from a single URL. | **Critical** |
| B3 | Canonical hostname is `zubairbinshaukat.vercel.app`, not `zubyr.dev`. Every metadata/sitemap/robots URL is wrong (`layout.js:32,36,51`, `sitemap.js:4`, `robots.txt:3`). No 301s (`next.config.mjs`). | **Critical** |
| B4 | **No JSON-LD at all.** Spec §3 calls this the highest-leverage item. | **Critical** |
| B5 | **4 `<h1>` per page**; no `<nav>`/`<main>`/`<footer>`/`<article>` landmarks. | **Critical** |
| B6 | **Zero internal `<a>` links.** Nav is `onClick` (`page.js:292`). The internal-link graph sitelinks feed on does not exist. | **Critical** |
| B7 | No `metadataBase`, no `alternates.canonical`, no title template, no `robots` object; `keywords`/`authors`/`creator` misplaced inside `openGraph` so they emit nothing. | **Important** |
| B8 | `sitemap.js` lists 1 URL; `robots.txt` names no AI crawlers (spec §4 wants GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, Applebot-Extended explicitly allowed). | **Important** |
| B9 | **CLS 0.178** from `DP.js:27` aspect-ratio mismatch. Spec §8 requires CLS = 0. | **Important** |
| B10 | **LCP 4.1 s** and it is a 7.3 MB PNG, not an HTML element. Spec §8 says LCP must be the hero heading, < 2.5 s. | **Important** |
| B11 | **First Load JS 202 KB** vs the < 120 KB budget; TBT 2,230 ms; framer-motion + tsParticles statically imported everywhere. | **Important** |
| B12 | Hero display faces served as **unsubsetted TTF with no `font-display` and no preload** (`globals.css:5-24`). | **Important** |
| B13 | `og-image.png` is 3448×2178 / 2.8 MB but declared 1700×1030; `twitter:image` points at the site root, not an image. Both break social + AI-citation previews. | **Important** |
| B14 | No `/about` third-person fact block, no FAQ block, no `FAQPage`/`Service`/`BreadcrumbList` schema (spec §3, §5). | **Important** |
| B15 | `button-name` a11y failure at `floating-dock.js:69`; no skip link; canvas layers lack `aria-hidden`; no `prefers-reduced-motion` handling anywhere. | **Important** |
| B16 | Wheel-hijack `preventDefault` (`page.js:109-122`) makes the page unnavigable by keyboard and hostile to reduced-motion users. | **Important** |
| B17 | Dead weight: `ProjectsData.js` + `ProjectCarousal.js` (orphans), `Font1`/Skyscapers (declared, unused), `font-3.ttf`/Niconne (no `@font-face`), `bizmobile2/3.png` (orphan-only refs). | Nice-to-have |
| B18 | ~25 inline `fontFamily` declarations for six font families that are never loaded (Outfit, Sora, DM Sans, General Sans, JetBrains Mono, Fira Code). | Nice-to-have |
| B19 | No `/llms.txt` (spec §5.5 — low value, 20 min, ship it). | Nice-to-have |
| B20 | `sharp` not installed → slower/worse image optimization in production. | Nice-to-have |

---

## 3. Change list

Ordering note: the hero-touching changes are **C14–C17** and are deliberately last and isolated. Everything before them must not modify `Hero.js`, `MainText.js`, `HeroText.js`, `DP.js`, `hello-card.js`, `floating.js`, or `background-beams-with-collision.js` beyond what is explicitly stated.

---

### C1 — Add `metadataBase`, title template, canonical, robots; fix the misplaced keys

**What it is** — Rewrite the root metadata export to spec §2 shape.

**Now** — `app/layout.js:11-53`. Plain-string title. No `metadataBase`, no `alternates`, no `robots`. `keywords`/`authors`/`creator` sit inside `openGraph` (lines 20-31) and emit nothing. `twitter.images` is `["https://zubairbinshaukat.vercel.app"]` (line 51).

**Target** — Exactly the block in spec §2, on the chosen canonical host, with `keywords`/`authors`/`creator` at top level and `twitter.images: ["/og.png"]` resolving through `metadataBase`.

**How**

```js
// app/layout.js — replace lines 11-53
export const metadata = {
  metadataBase: new URL("https://www.zubyr.dev"),   // ← see Open Question Q1
  title: {
    default: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
    template: "%s — Zubair Bin Shaukat",
  },
  description:
    "Zubair Bin Shaukat is a software engineer in Lahore, Pakistan building automation systems, GoHighLevel solutions, web and mobile applications.",
  applicationName: "Zubair Bin Shaukat",
  authors: [{ name: "Zubair Bin Shaukat", url: "https://www.zubyr.dev" }],
  creator: "Zubair Bin Shaukat",
  keywords: ["Zubair Bin Shaukat","zubyr dev","GoHighLevel developer","n8n automation developer","Next.js developer Lahore","React Native developer Pakistan"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: "https://www.zubyr.dev", siteName: "Zubair Bin Shaukat",
    title: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
    description: "Automation systems, GoHighLevel platforms, web and mobile development.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Zubair Bin Shaukat" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zubair Bin Shaukat — Software Engineer & Problem Solver",
    description: "Automation systems, GoHighLevel platforms, web and mobile development.",
    images: ["/og.png"],
    creator: "@zubairbinshaukt",   // matches floating.js:47
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};
```

**Risk** — None visual. Only risk is shipping the wrong hostname before DNS is live (Q1).

**Verify** — `npm run build && grep -o '<meta[^>]*>' .next/server/app/index.html` — expect `og:image` = `https://www.zubyr.dev/og.png`, `twitter:image` ending `.png`, and `<link rel="canonical" href="https://www.zubyr.dev/"/>`.

---

### C2 — Replace `og-image.png` with a real 1200×630 `og.png`

**What it is** — Correct OG asset.

**Now** — `public/og-image.png`, **3448 × 2178, 2,782 KB**, declared as 1700×1030 at `app/layout.js:38-39`.

**Target** — `public/og.png` at **exactly 1200 × 630**, ≤ 200 KB, referenced as a root-relative `/og.png`.

**How** — Two options, pick one:
1. Crop/resize the existing artwork to 1200×630 and re-export as PNG-8 or high-quality WebP-in-PNG-container. Do it once, by hand, in whatever tool made it.
2. Generate it dynamically with `app/opengraph-image.js` (`ImageResponse`, `size = { width: 1200, height: 630 }`) using the design tokens in §4 — near-black ground, the violet→magenta gradient, "Zubair Bin Shaukat" in Soria. Preferred once the fonts are self-hosted (C14), since it stays in sync.

Delete `public/og-image.png` after the switchover.

**Risk** — Social previews break if the file 404s. Low.

**Verify** — `node -e "const b=require('fs').readFileSync('public/og.png');console.log(b.readUInt32BE(16)+'x'+b.readUInt32BE(20), (b.length/1024|0)+'KB')"` → `1200x630`. Then paste the live URL into the LinkedIn Post Inspector and X Card Validator.

---

### C3 — Convert `app/robots.txt` to `app/robots.js` with AI-crawler rules

**What it is** — Spec §4 robots.

**Now** — `app/robots.txt` (static file), 3 lines, vercel.app sitemap, no AI-crawler block.

**Target** — Generated `robots.js` naming the AI crawlers explicitly.

**How** — `git rm app/robots.txt`, then:

```js
// app/robots.js
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot","ClaudeBot","PerplexityBot","Google-Extended","OAI-SearchBot","Applebot-Extended"], allow: "/" },
    ],
    sitemap: "https://www.zubyr.dev/sitemap.xml",
    host: "https://www.zubyr.dev",
  };
}
```

**Risk** — Both files present ⇒ ambiguity. **Delete the `.txt` in the same commit.**

**Verify** — `npm run build && npx serve .next` is unnecessary; instead `npm run start` then `curl -s localhost:3000/robots.txt` → must list all six AI agents.

---

### C4 — Expand `app/sitemap.js` to the full route map

**What it is** — Spec §4 sitemap.

**Now** — `app/sitemap.js:1-8` — one entry, vercel.app, no `changeFrequency`/`priority`.

**Target** — Every route from spec §1, plus generated project/blog entries.

**How**

```js
// app/sitemap.js
const base = "https://www.zubyr.dev";
const routes = ["","/about","/services/gohighlevel","/services/automation",
  "/services/web-development","/services/mobile","/projects","/blog","/contact"];

export default function sitemap() {
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : 0.8,
  }));
  // TODO append: PROJECTS.map(p => ({ url: `${base}/projects/${p.slug}` , ... }))
}
```

Do this **after** C6 so the URLs it advertises actually resolve.

**Risk** — Advertising 404s to Google. Gate on C6 being merged.

**Verify** — `curl -s localhost:3000/sitemap.xml | grep -c "<loc>"` → 9 (before projects/blog are appended). Then fetch each `<loc>` and assert HTTP 200.

---

### C5 — 301 redirects to one canonical host

**What it is** — Spec §1 migration note + §2 "pick one hostname".

**Now** — `next.config.mjs` has no `redirects()`. Nothing 301s `zubairbinshaukat.vercel.app` → `zubyr.dev`, and nothing normalises apex vs `www`.

**Target** — Old host and old paths permanently redirect to the canonical host.

**How** — in `next.config.mjs`:

```js
async redirects() {
  return [
    { source: "/:path*",
      has: [{ type: "host", value: "zubairbinshaukat.vercel.app" }],
      destination: "https://www.zubyr.dev/:path*", permanent: true },
    { source: "/:path*",
      has: [{ type: "host", value: "zubyr.dev" }],
      destination: "https://www.zubyr.dev/:path*", permanent: true },
  ];
},
```

Apex↔www is better handled at the Vercel domain level (set the redirect in the Vercel dashboard) — do **both**; the config rule is the fallback.

**Risk** — A misconfigured `has.host` can produce a redirect loop that takes the site down. Test on a preview deployment before promoting.

**Verify** — `curl -sI -H "Host: zubairbinshaukat.vercel.app" https://<preview>/ | head -3` → `HTTP/2 308` (Next emits 308 for `permanent: true`; that is a valid permanent redirect) with the right `location:`. Re-check post-deploy with `curl -sI https://zubairbinshaukat.vercel.app/`.

---

### C6 — Split the section machine into real routes

**What it is** — The structural change everything else depends on. Spec §1.

**Now** — `app/page.js` is a 339-line `"use client"` component that swaps `<Hero/> <About/> <Projects/> <Testimonials/> <Contact/>` in and out of a single DOM slot (`app/page.js:176-191, 198-215`).

**Target** — The route map from spec §1: `/`, `/about`, `/services/{gohighlevel,automation,web-development,mobile}`, `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/contact`. `/` becomes a **normal scrolling server-rendered page** whose sections are *summaries that link out* to the real routes.

**How**

1. Create the tree — every `page.js` a **server component**:
   ```
   app/page.js                                  (rewritten, no "use client")
   app/about/page.js
   app/services/gohighlevel/page.js
   app/services/automation/page.js
   app/services/web-development/page.js
   app/services/mobile/page.js
   app/projects/page.js
   app/projects/[slug]/page.js
   app/blog/page.js
   app/blog/[slug]/page.js
   app/contact/page.js
   ```
2. Move the hard data out of the client components into plain server-importable modules — `lib/content/projects.js` (from `Projects.js:13-41`), `lib/content/testimonials.js` (from `Testimonials.js:13-46`), `lib/content/contact.js` (from `Contact.js:19-49`), `lib/content/services.js` (new, needs copy — Q3).
3. Rewrite each section so the **text is server-rendered** and only the moving parts are client islands. Pattern:
   ```jsx
   // app/Components/Projects.js — server component now
   import { PROJECTS } from "@/lib/content/projects";
   import ProjectsCarouselClient from "./ProjectsCarousel.client";

   export default function Projects() {
     return (
       <section id="projects" aria-labelledby="projects-h">
         <h2 id="projects-h">Selected Work</h2>
         {/* real, crawlable, always-present list */}
         <ul className="sr-only-if-you-must">
           {PROJECTS.map(p => (
             <li key={p.slug}>
               <a href={`/projects/${p.slug}`}><h3>{p.name}</h3></a>
               <p>{p.desc}</p>
             </li>
           ))}
         </ul>
         <ProjectsCarouselClient projects={PROJECTS} />   {/* decoration */}
       </section>
     );
   }
   ```
   Prefer making the *visible* markup the crawlable markup rather than duplicating into `sr-only` — duplicate text is a smell. Only fall back to a visually-hidden list if the carousel genuinely cannot be server-rendered.
4. Add `<main>` around page content in each `page.js`, and a shared `<nav>` + `<footer>` in `app/layout.js` (see C7).
5. Delete the wheel/touch hijack (`app/page.js:87-174`), the section state machine, and the right-edge dot nav's `onClick` navigation — see C16 for how the dot nav survives visually.

**Risk** — This is the biggest change in the plan and it deletes the site's signature interaction. The hero must come through untouched: `Hero.js` is imported by the new `app/page.js` exactly as it was. Check by diffing the rendered hero DOM before/after (`curl -s localhost:3000/ | python -c "..."` or just a screenshot pair at 390×844 and 1440×900).

**Verify**
- `npm run build` lists all 11 routes.
- For each route: `curl -s localhost:3000/<route> | grep -c "<h1"` → **1**.
- `curl -s localhost:3000/ | grep -c "n8n\|OpenCinema\|zubairbinshaukat4455"` → **> 0** (today: 0).
- Disable JS in DevTools, reload `/` — all five sections' copy must be readable.

---

### C7 — Real `<nav>` + `<footer>` with crawlable `<a>` to every top-level route

**What it is** — The internal-link graph sitelinks are picked from. Spec §1.

**Now** — Zero internal links (verified). `floating-dock.js` links are all external social profiles.

**Target** — A `<nav>` in `app/layout.js` linking `/`, `/about`, `/services/*`, `/projects`, `/blog`, `/contact`; a `<footer>` repeating all of them; each service page cross-linking the other three services and back to `/`.

**How** — New server components `components/SiteNav.js` and `components/SiteFooter.js` using `next/link`, rendered in `app/layout.js` around `{children}`. Style them against the §4 tokens: near-black ground, violet→magenta on the active item, Inter at `text-sm`.

**Important — do not put this nav on top of the hero.** The hero already owns its top strip (`Hero.js:13-15`, the floating social dock at `sm:top-6`). Either render the site nav below the hero viewport on `/`, or give it a scroll-triggered reveal that starts fully transparent. The hero's first paint must look byte-identical.

**Risk** — Visual collision with the floating dock at `top-0`/`top-6`. Check at 390 px and 1440 px widths against a before-screenshot.

**Verify** — `curl -s localhost:3000/ | grep -o 'href="/[a-z/-]*"' | sort -u` → must contain all 9 top-level paths.

---

### C8 — Homepage JSON-LD `@graph`

**What it is** — Spec §3, the highest-leverage single item.

**Now** — No structured data anywhere.

**Target** — `components/SchemaOrg.js` (server component), rendered from `app/page.js`, emitting the `Person` + `WebSite` + `ProfilePage` graph verbatim from spec §3.

**How** — Copy the spec §3 component. Fill the real values already present in the codebase — do not invent:

| Field | Real value | Source |
|---|---|---|
| `email` | `zubairbinshaukat4455@gmail.com` | `Contact.js:23` |
| `telephone` | `+92 314 87 97 500` | `Contact.js:35` |
| `address` | Lahore, PK | `Contact.js:39` |
| `sameAs` | `https://github.com/zubairbinshaukat`, `https://www.linkedin.com/in/zubairbinshaukat`, `https://www.instagram.com/zubairbinshaukat`, `https://www.facebook.com/zubairbinshaukat1`, `https://x.com/zubairbinshaukt` | `floating.js:19,26,33,40,47` |
| `image` | `https://www.zubyr.dev/dp.webp` | after C15 |
| `knowsAbout` | GoHighLevel, n8n, Workflow Automation, Next.js, React, React Native, Node.js, AdonisJS, TypeScript, Python, C++, MERN | `About.js:20-31` |

Note `Contact.js:44-48` uses bare `github.com/…`, `linkedin.com/in/…`, `twitter.com/…` while `floating.js` uses the `www.`/`x.com` forms. **Normalise to one form** and use that same form in `sameAs` — spec §5.4/§6 is explicit that inconsistency splits the entity.

**Risk** — None visual (`<script type="application/ld+json">` renders nothing).

**Verify** — `curl -s localhost:3000/ | grep -o 'application/ld+json'` → 1 hit; extract the JSON and run it through Google's Rich Results Test and validator.schema.org. Must be zero errors.

---

### C9 — Per-page metadata + per-page schema

**What it is** — Spec §2 "every other page" and §3 per-page table.

**Now** — N/A, no other pages exist.

**Target** — Every route exports `metadata` (or `generateMetadata`) with a unique title, a **150–160 char** description, and `alternates.canonical`. Service pages carry `Service` schema, project/blog pages `CreativeWork`/`Article`, all inner pages `BreadcrumbList`.

**How** — Per page:

```js
export const metadata = {
  title: "GoHighLevel Development",   // template appends "— Zubair Bin Shaukat"
  description: "Custom GoHighLevel dashboards, marketplace apps and white-label builds for agencies. Built, documented and handed off running.",  // 149 chars — count it
  alternates: { canonical: "/services/gohighlevel" },
};
```

Write a tiny check script `scripts/check-meta.mjs` that crawls the built routes and asserts `140 <= description.length <= 160` and that titles are unique — cheaper than eyeballing 11 pages.

**Risk** — None visual.

**Verify** — `node scripts/check-meta.mjs` exits 0. Rich Results Test clean on one service page and one project page.

---

### C10 — One `<h1>` per page + semantic landmarks

**What it is** — Spec §1 rules, spec §10 checklist.

**Now** — 4 `<h1>` in the server HTML: `components/ui/hello-card.js:29` ("Hi!") rendered twice, and `app/Components/UI/HeroText.js:10` and `:27` ("ZUBAIR") — both HeroText variants are mounted, only CSS-hidden (`Hero.js:26` `hidden sm:flex`, `HeroText.js:7` `sm:hidden`).

**Target** — Exactly one `<h1>` in the DOM per page.

**How** — Two edits, both purely semantic, **zero visual delta**:

1. `components/ui/hello-card.js:29` — `<h1 …>Hi!</h1>` → `<span …>Hi!</span>`. It is a decorative badge, not a heading. `text-3xl font-yatra font-bold` on a `span` renders identically (`h1` has no default margin under Tailwind preflight).
2. Collapse the duplicate HeroText. Preferred fix, since it also removes duplicate DOM: render **one** `HeroText` and let CSS handle both layouts. If that's too invasive, demote the mobile variant's heading to a `<p>` with `aria-hidden="true"` and keep the desktop one as the sole `<h1>` — but the render-once fix is cleaner and reduces the SSR payload.

Then add landmarks: `<main>` in every `page.js`, `<nav>`/`<footer>` from C7, `<article>` on `/blog/[slug]` and `/projects/[slug]`, and a skip link (`<a href="#main" className="sr-only focus:not-sr-only …">`) as the first child of `<body>`.

**Risk** — The `h1`→`span` swap is visually inert under Tailwind preflight (`h1` gets `font-size: inherit; font-weight: inherit; margin: 0`), and both classes are explicit anyway. Confirm with a pixel diff of the badge at 1440×900. The HeroText de-duplication is the riskier half — verify at the `sm` breakpoint boundary (639 px / 640 px).

**Verify** — `curl -s localhost:3000/<route> | grep -c "<h1"` → 1, on every route. `npx lighthouse … --only-categories=accessibility` → heading-order and `button-name` both pass.

---

### C11 — Trim the JS: lazy-load tsParticles and the beams

**What it is** — Get First Load JS under the spec §8 budget of 120 KB.

**Now** — 202 KB First Load JS, TBT 2,230 ms, bootup 9.5 s. framer-motion and tsParticles are statically imported (`sparkles.js:4-5`, `MainText.js:3`, and 9 framer-motion import sites).

**Target** — `/` under 120 KB First Load JS; TBT under 200 ms.

**How**

1. **tsParticles → its own lazy chunk.** In `MainText.js`:
   ```jsx
   "use client";
   import dynamic from "next/dynamic";
   const SparklesCore = dynamic(
     () => import("@/components/ui/sparkles").then(m => m.SparklesCore),
     { ssr: false, loading: () => <div className="w-full h-full" aria-hidden="true" /> }
   );
   ```
   The placeholder must occupy the **same box** (`w-full h-full` inside the `w-[40rem] h-40` wrapper at `MainText.js:10`) so nothing shifts.
2. Same treatment for `BackgroundBeamsWithCollision`'s beam layer if it survives the bundle audit — but keep its **static** wrapper (the `bg-black` container at `background-beams-with-collision.js:70`) server-rendered so the hero ground paints immediately.
3. Delete the orphans (C13) — removes `ProjectCarousal.js`'s framer-motion import from the graph.
4. Drop `particleDensity` from `1200` (`MainText.js:22`) only if the bundle target still isn't met — this one is visible, so treat it as a last resort and A/B the screenshots.
5. Re-check `unused-javascript` (43 KiB) and `legacy-javascript` (11 KiB) after the above; the latter usually clears by updating browserslist (`npx update-browserslist-db@latest`, which the build already asks for).

**Risk** — The particle field must still appear, identically, once loaded. Because it's already `opacity-0` until `particlesLoaded` fires (`sparkles.js:43`), deferring the import is invisible. Verify by watching the divider region at 1440×900 for 3 s.

**Verify** — `npm run build` → `/` First Load JS **< 120 kB**. `npx lighthouse … --only-categories=performance` → TBT drops from 2,230 ms.

---

### C12 — Accessibility + reduced motion

**What it is** — Spec §8's a11y clause; 25% of Lighthouse and an AI-parsing signal.

**Now** — `button-name` fails at `components/ui/floating-dock.js:69` (mobile dock toggle, icon-only, no label). No skip link. Canvas/particle layers are not `aria-hidden`. `prefers-reduced-motion` appears **nowhere** in the repo. The wheel handler `preventDefault`s unconditionally (`app/page.js:110`).

**Target** — Accessibility 100; motion respects the OS setting.

**How**

1. `components/ui/floating-dock.js:69-74` — add `aria-label="Open social links"` and `aria-expanded={open}` to the `<button>`.
2. `aria-hidden="true"` on the particle wrapper (`MainText.js:10` div) and the beams container.
3. Skip link as the first `<body>` child (C10).
4. Global reduced-motion escape hatch in `app/globals.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
   This kills the DP blob pulse (`DP.js:12`), the dot pulses (`DP.js:49,52`), and the marquee (`About.js:260`) for users who asked for that. **It does not change the default appearance.**
5. For framer-motion, gate the decorative loops with `useReducedMotion()` where the CSS rule can't reach (the beams' `repeat: Infinity` transitions).
6. Contrast: `text-white/30` (`Contact.js:147`) and `text-white/20` (`Contact.js:177`) on near-black are **well under 4.5:1**. Raise the low-alpha body text to at least `text-white/60` on the rebuilt pages. Do not touch hero text — hero copy is white or gradient-filled and already passes.

**Risk** — The reduced-motion block is a global `!important` sweep; it can look wrong if someone later relies on a transition for layout. Acceptable, and it only applies under the media query.

**Verify** — `npx lighthouse … --only-categories=accessibility` → 100, `button-name` passes. Toggle "Emulate prefers-reduced-motion: reduce" in DevTools Rendering → blob and marquee stop, layout unchanged.

---

### C13 — Delete dead code and dead assets

**What it is** — Housekeeping that shrinks the bundle and the repo.

**Now**
- `app/Components/ProjectsData.js` — imported by nothing (verified by grep).
- `components/ui/ProjectCarousal.js` — imported only by the above.
- `app/globals.css:12-17` declares `Font1` → `/fonts/font-1.ttf` (**Skyscapers**); the `font-font1` class has **zero** usages.
- `public/fonts/font-3.ttf` (**Niconne**, 44 KB) — no `@font-face` anywhere.
- `public/projects/bizmobile2.png` (104 KB), `bizmobile3.png` (31 KB) — referenced only from the orphan `ProjectsData.js:24`.
- `tailwind.config.js:15` `font1` family alias.

**Target** — All of the above gone, unless Q7 says the bizmobile screenshots are wanted for the `/projects/[slug]` case study.

**How** — `git rm` the four files; delete `globals.css:12-17` and `tailwind.config.js:15`. Do the bizmobile deletion **after** Q7 is answered.

**Risk** — Near zero; nothing imports any of it. `git grep` each name once more immediately before deleting.

**Verify** — `npm run build` succeeds; `git grep -n "ProjectsData\|ProjectCarousal\|font-font1\|font-3.ttf"` → no hits.

---

### C14 — HERO · Self-host Soria + Alex Brush as subset woff2 via `next/font/local`

**What it is** — Spec §8 "max 2 families + 1 mono, variable, subset, `display: swap`, preloaded". This is the first of the four hero-touching changes.

**Now** — `app/globals.css:5-24`:
```css
@font-face { font-family: "Font2"; src: url("/fonts/font-2.ttf") format("truetype"); font-weight: normal; font-style: normal; }
@font-face { font-family: "Font0"; src: url("/fonts/font-0.ttf") format("truetype"); font-weight: normal; font-style: normal; }
```
75 KB and 47 KB **unsubsetted TrueType**, **no `font-display`** (⇒ `auto` ⇒ FOIT), **no preload** (`grep -c 'as="font"'` on the built HTML → 0), discovered only after the stylesheet parses. Lighthouse `font-display` flags both.

**Target** — Both faces as **subset woff2**, loaded through `next/font/local` with `display: "swap"`, `preload: true`, and a CSS variable, so Next emits a `<link rel="preload" as="font" crossorigin>` in `<head>`.

**How**

1. Subset and convert (offline, once — `fonttools` via `pip install fonttools brotli`):
   ```bash
   # Soria renders only: I ' m Z U B A I R   → but keep full Latin for future headings
   pyftsubset public/fonts/font-2.ttf \
     --unicodes="U+0020-007E,U+00A0,U+2018-201D,U+2013-2014" \
     --layout-features="kern,liga" --flavor=woff2 \
     --output-file=app/fonts/soria-regular.woff2

   pyftsubset public/fonts/font-0.ttf \
     --unicodes="U+0020-007E,U+00A0,U+2018-201D,U+2013-2014" \
     --layout-features="kern,liga" --flavor=woff2 \
     --output-file=app/fonts/alexbrush-regular.woff2
   ```
   Expect roughly 15–25 KB each, down from 75/47 KB. Neither font is variable — `next/font/local` handles static faces fine.
2. Declare them in `app/layout.js`:
   ```js
   import localFont from "next/font/local";

   const soria = localFont({
     src: "./fonts/soria-regular.woff2",
     weight: "400", style: "normal",
     variable: "--font-soria", display: "swap", preload: true,
     adjustFontFallback: false,      // no metric-compatible system serif; see Risk
     fallback: ["Georgia", "serif"],
   });
   const alexBrush = localFont({
     src: "./fonts/alexbrush-regular.woff2",
     weight: "400", style: "normal",
     variable: "--font-alex", display: "swap", preload: true,
     adjustFontFallback: false,
     fallback: ["cursive"],
   });
   ```
   Add `${soria.variable} ${alexBrush.variable}` to the `<body>` className (`app/layout.js:59`).
3. Point Tailwind at the variables — `tailwind.config.js:11-16`:
   ```js
   fontFamily: {
     yatra:  ["var(--font-yatra)", "cursive"],
     font0:  ["var(--font-alex)", "cursive"],     // Alex Brush — "Bin Shaukat"
     font2:  ["var(--font-soria)", "serif"],      // Soria — "ZUBAIR"
   },
   ```
   **Keep the `font0` / `font2` class names.** `HeroText.js:9,10,14,26,27,31` then needs no edit at all — this is the single most important detail for keeping the hero byte-identical.
4. Delete `app/globals.css:5-24` and `public/fonts/*.ttf`.

**Risk** — This is the change most likely to shift the hero by a pixel. Two specific hazards:
- **Subsetting can drop kerning or the apostrophe.** `HeroText.js:9` renders `"I'm"` with a **typewriter apostrophe** `U+0027` (inside `{"I'm"}`), which is in the ASCII range above — fine. The layout metadata uses `U+2019` (`layout.js:14` `I’m`) — also covered.
- **`adjustFontFallback`** would inject a `size-adjust` fallback face. For a display face used at 108 px, a mis-sized fallback flash is more visible than a plain swap. Set it to `false` and accept a short swap, or set `display: "block"` for these two faces only if any flash is unacceptable — but `block` costs LCP, so prefer `swap` given the `<h1>` becomes the LCP element (C15).

**Verify**
- `npm run build && grep -o 'as="font"[^>]*' .next/server/app/index.html` → **2 preload links** (today: 0).
- `grep -o '@font-face{font-family:__soria[^}]*}' .next/static/css/*.css` → contains `font-display:swap`.
- `npx lighthouse … ` → `font-display` audit passes; no `/fonts/*.ttf` in the network log.
- **Pixel diff the hero** at 1440×900 and 390×844, before vs after. The "ZUBAIR" glyph advance widths must be identical — if subsetting stripped `kern`, they won't be. That's what `--layout-features="kern,liga"` is for.

---

### C15 — HERO · Portrait to WebP/AVIF, correct `sizes`, and hand LCP to the `<h1>`

**What it is** — The single biggest CWV win on the page, and the LCP-element decision the spec §8 demands.

**Now** — `app/Components/DP.js:3,27-34`:
```jsx
import dp from "/public/dp.png";
<Image src={dp} alt="Zubair Bin Shaukat - Software Developer"
       width={700} height={700}
       className="w-full h-auto object-contain sm:w-[90%] max-h-[100vh] md:w-full"
       priority />
```
Source is **2160 × 3840, 7,289 KB PNG**. No `sizes`. Lighthouse: this element **is the LCP at 4,110 ms**, and it is **the sole source of CLS 0.178** because `700×700` reserves a square while it paints 330×586.

**Target** — WebP (with AVIF preferred by the optimizer), correct intrinsic aspect ratio, an explicit `sizes`, and **the `<h1>` "ZUBAIR" as the LCP element**.

**LCP decision: the `<h1>` should be the LCP element.** Reasons, in order:
1. Spec §8 states it outright — "LCP must be an HTML element (the hero heading), never the canvas."
2. Text LCP is bounded by the font, which is ~20 KB after C14 and now preloaded. Image LCP is bounded by a decoded 9:16 photograph, which will never be as fast at 108 px-heading speed.
3. On desktop the `<h1>` is at `lg:text-[108px]` in the left half (`Hero.js:26`) and is genuinely a large, above-fold, contentful paint. On mobile the portrait occupies the lower 50% (`Hero.js:30`) while the text occupies the upper 50% (`HeroText.js:7`) — the heading is the higher, earlier element in both layouts.
4. Google will pick whichever paints largest; we influence it by making the heading paint *sooner* (preloaded font, C14) and the portrait paint *no earlier than it must*.

Concretely: **keep `priority` off the portrait is wrong** — dropping it entirely would push the portrait to lazy and could make it *pop in* visibly. Instead: keep the image eager but demote its fetch priority so the font preload wins the queue. Use `priority={false}` + `loading="eager"` + `fetchPriority="low"` is not expressible cleanly through `next/image`; the practical form is to **remove `priority`** and add `loading="eager"`. Measure both variants (see Verify) and keep whichever gives the lower LCP **without** a visible pop-in.

**How**

1. Convert the source (offline, once — `squoosh-cli` or `sharp`):
   ```bash
   npx -y sharp-cli -i public/dp.png -o public/dp.webp resize 1080 1920 -- webp --quality 82
   # target: < 250 KB. Also emit an AVIF if you want a hard floor:
   npx -y sharp-cli -i public/dp.png -o public/dp.avif resize 1080 1920 -- avif --quality 55
   ```
   1080 × 1920 is 2× the largest box the portrait ever paints into (`max-w-[700px]` at `DP.js:9`). 2160 × 3840 is 4× and pure waste.
2. Rewrite the `<Image>`:
   ```jsx
   import dp from "/public/dp.webp";
   …
   <Image
     src={dp}                              /* static import → intrinsic 1080×1920, no width/height needed */
     alt="Zubair Bin Shaukat, software engineer based in Lahore, Pakistan"
     sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 700px"
     className="w-full h-auto object-contain sm:w-[90%] max-h-[100vh] md:w-full"
     loading="eager"
   />
   ```
   The static import supplies the **true** aspect ratio, which is what kills the CLS. Do **not** hand-write `width={700} height={700}` again.
   The `sizes` values come from `Hero.js:30` (`sm:w-[50%] … w-[80%]`) and `DP.js:9` (`max-w-[700px]`).
3. Add `formats: ["image/avif", "image/webp"]` to `next.config.mjs` `images`.
4. Install `sharp` (`npm i sharp`) so production optimization isn't degraded (build warns about this today).
5. Improve the `alt` text — spec §5.6. The current `"Zubair Bin Shaukat - Software Developer"` is fine; the version above is more fact-dense for AI extraction. Also fix `Hero.js:20` `alt="logo"` → `alt=""` with `aria-hidden` (it is decorative, a 40×40 mark) **or** `alt="Zubair Bin Shaukat"` if it's the wordmark. Also: `logo.png` is 512×512 / 214 KB painted at 40×40 (`Hero.js:22`) — resize it to 96×96 WebP.

**Risk** — WebP/AVIF conversion of a portrait with a transparent alpha channel (`colorType=6`, RGBA) can produce halo artefacts around the hair/edges against the `#000000` ground. **Inspect the converted file at 100% before committing**, specifically the hair edge against black. If the alpha degrades, drop to `--quality 90` WebP or keep PNG but at 1080×1920 (which alone cuts ~7.3 MB to well under 2 MB).

The `sizes` value changes which srcset candidate is chosen. Wrong `sizes` = blurry portrait. Check at 390 px, 768 px, 1440 px.

**Verify**
- `node -e "…"` on the new file → `1080x1920`, **< 250 KB**.
- `npx lighthouse http://localhost:3000/ --form-factor=mobile …` →
  - `cumulative-layout-shift` → **0.00** (today 0.178);
  - `largest-contentful-paint-element` snippet is the **`<h1>`**, not the `<img>`;
  - `uses-responsive-images` and `image-delivery` savings → 0.
- Side-by-side screenshot vs. the pre-change build at 390×844 and 1440×900. **The portrait must be indistinguishable.**

---

### C16 — HERO · Keep the dot nav and social pill bar looking identical while making them real links

**What it is** — Spec §0's "navigation must be real crawlable `<a>`" applied to the two hero navigation elements, with zero visual change.

**Now**
- Right-edge dot nav: `app/page.js:283-334`. Five `<motion.button onClick={navigateToSection}>`. `sm:w-3 sm:h-3 w-2.5 h-2.5 rounded-full`, active dot = the violet→magenta gradient with `shadow-lg shadow-purple-500/50`, inactive = `bg-gray-400`. Has an `aria-label` already (`page.js:296`). Also drives the load-time "tutorial" pulse (`page.js:58-84`).
- Floating social pill bar: `app/Components/floating.js` → `components/ui/floating-dock.js`. Already renders `next/link` `<a>` — but they are all **external** social profiles, so they contribute nothing to the internal link graph.

**Target** — The dot nav becomes five `<a href="#hero|#about|#projects|#testimonials|#contact">` (after C6 turns `/` into a scrolling page) or `<a href="/about">` etc. **Identical rendered pixels.** The social bar is left alone visually and gains `rel="me"` — which is a real entity signal for spec §6.

**How**

1. Dot nav — swap the element, keep every class and every motion prop:
   ```jsx
   <motion.a
     href={`#${section}`}
     key={section}
     whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
     className="relative group"                    /* unchanged */
     aria-label={`Go to ${section} section`}       /* unchanged */
   >
   ```
   `<a>` and `<button>` both render as the same box here because the sizing lives entirely on the inner `<motion.div>` (`page.js:318`) — but **`<button>` carries UA styles that `<a>` does not** (and vice versa). Add `className="… inline-block"` if the anchor's default `inline` changes the flex-child geometry. Verify with a diff, don't assume.
   The `disabled={showTutorial}` prop (`page.js:297`) has no `<a>` equivalent — replace with `style={{ pointerEvents: showTutorial ? "none" : undefined }}`.
2. Social bar — `components/ui/floating-dock.js:141` and `:56`, add `rel="me noopener noreferrer"` to the `<Link>`s. `rel="me"` is the standard bidirectional identity claim and pairs with the `sameAs` array from C8.
3. Keep the load-time tutorial pulse exactly as-is (`page.js:58-84`, `285-323`). It is decoration on already-painted HTML, which spec §8 explicitly permits.

**Risk** — The `button`→`a` swap is the classic source of a 1–2 px drift (line-height, `display`, focus ring). Pixel-diff the right edge at 1440×900 **and** tab through to confirm the focus ring still lands on the dot.

**Verify** — Screenshot diff of the right 80 px column, before vs after. `curl -s localhost:3000/ | grep -o 'href="#[a-z]*"' | wc -l` → 5.

---

### C17 — HERO · Remove the remaining CWV drag without touching appearance

**What it is** — The residual invisible wins the constraints allow.

**Now**
- `render-blocking-resources`: the single 7,690-byte stylesheet, est. **800 ms**.
- Blob and dot `animate-pulse` (`DP.js:12,49,52`) animate `opacity` — already compositor-friendly. The blob's `rounded-[40%_60%_70%_30%/40%_50%_60%_50%]` + `opacity-80` on a gradient is a large paint area.
- No `preconnect` tags exist to remove (verified — the head has 4 `<link>`s, none is a preconnect). Spec's "preconnect removal" item is **already satisfied**; after C14/C15 there will be **zero third-party origins** on `/`, which is the goal state.
- Two remote image origins remain in `next.config.mjs:4-17` — `ik.imagekit.io` (used, `Projects.js:18`) and `images.unsplash.com` (**unused** — grep: 0 hits).

**How**

1. **Self-host the remaining remote assets.** Download `https://ik.imagekit.io/xosswhicz/project1.png` into `public/projects/opencinema.webp` and the three dicebear SVGs into `public/avatars/*.svg` (or replace with real photos — Q6). Then drop all three `remotePatterns` from `next.config.mjs`. This removes 2–3 DNS+TLS handshakes from the non-hero sections and lets C18's `<img>` fix use `next/image`.
2. **`will-change: transform` on the blob** (`DP.js:12`) to pin it to its own compositor layer:
   ```jsx
   <div className="… animate-pulse [will-change:opacity]" />
   ```
   Only `opacity` animates, so promote for `opacity`, not `transform`. Do the same on the two decorative dots (`DP.js:49,52`).
3. The 7.7 KB render-blocking CSS is Next's single emitted stylesheet — it is not worth inlining or splitting for a file that size. **Do nothing here**; the 800 ms figure is Lighthouse's simulated-throttle estimate on localhost and will not survive real HTTP/2 + CDN. Re-measure after C11 and C15 rather than optimising against a lab artefact.

**Risk** — `will-change` on too many elements costs memory. Three elements is fine. The blob's `animate-pulse` timing must be unchanged: Tailwind's `pulse` is `2s cubic-bezier(0.4,0,0.6,1) infinite`, opacity `1 → .5 → 1` — layer promotion does not alter it.

**Verify** — DevTools → Rendering → "Paint flashing": the blob region should stop repainting the whole hero on each pulse tick. `npx lighthouse …` → performance score improves and no new audit regresses. Screenshot diff: identical.

---

### C18 — Non-hero: `<img>` → `next/image`, and the fonts the sections ask for but never load

**What it is** — Two cleanups on the rebuildable half of the site.

**Now**
- `app/Components/Testimonials.js:231` uses a raw `<img>` for the avatar (ESLint `no-img-element` warns on every build).
- ~25 inline `fontFamily` declarations across `About.js`, `Projects.js`, `Testimonials.js`, `Contact.js` name `'Outfit'`, `'Sora'`, `'DM Sans'`, `'General Sans'`, `'JetBrains Mono'`, `'Fira Code'` — **none of which is loaded by anything**. They all silently fall through to Inter (or the generic `monospace`).

**Target** — `next/image` everywhere; the type system reduced to what spec §8 allows (**2 families + 1 mono**), self-hosted and subset.

**How**

1. Testimonials avatars → `next/image` with explicit `width={40} height={40}` (they paint at `w-9 h-9 sm:w-10 sm:h-10`). Needs the assets self-hosted first (C17.1).
2. **Decide the type system and load it properly.** The hero already commits to three faces: **Soria** (serif display), **Alex Brush** (script), **Inter** (sans body). Spec §8's budget is 2 families + 1 mono. The clean resolution:
   - Keep **Soria** and **Alex Brush** as the hero-only display pair (C14) — they render a handful of words.
   - Keep **Inter** as the single body/UI sans and **delete every `'Outfit'`/`'Sora'`/`'DM Sans'`/`'General Sans'` declaration**, letting them inherit Inter. This is what already renders today, so it is a zero-pixel change — it just stops lying in the CSS.
   - Add **one** mono via `next/font/google` (`JetBrains_Mono`, `subsets: ["latin"]`, `weight: ["400","600"]`, `variable: "--font-mono"`) for the eyebrow/label treatment that the sections clearly want — this one **will** change appearance on the non-hero sections, which is permitted.
   - **Drop Yatra One** if the "Hi!" badge can use Soria at the same size. Yatra One currently costs a 47.7 KB Devanagari face for three characters. **Check this against the hero constraint first** — if the "Hi!" glyphs differ visibly, keep Yatra One and subset it to `U+0048,U+0069,U+0021` via `next/font/google`'s automatic subsetting (which already only preloads latin). Treat "drop Yatra One" as **blocked on a visual diff**, not automatic.
3. Wire the mono through `tailwind.config.js` as `mono: ["var(--font-mono)", "monospace"]` and replace the inline `fontFamily` strings with `font-mono`.

**Risk** — Step 2's Yatra One question touches the hero badge. Do it as its own commit, diff the badge at 1440×900, and revert if the "Hi!" wordmark reads differently.

**Verify** — `npm run build` → no `no-img-element` warning. `curl -s localhost:3000/ | grep -o "as=\"font\"" | wc -l` → matches the number of preloaded faces. Screenshot diff of the "Hi!" badge before/after.

---

### C19 — `/about` fact block + homepage FAQ + `FAQPage` schema

**What it is** — Spec §5.2 and §5.3, the AI-readability layer.

**Now** — The only bio is `About.js:161-172`, first person, decorative, and **not in the server HTML**.

**Target** — `/about` opening with two third-person sentences that fully answer "Who is Zubair Bin Shaukat?"; a homepage FAQ block with literal `<h3>` question headings; `FAQPage` schema whose text matches the visible copy **word for word**.

**How**

1. `/about` opener, third person, fact-dense — draft from what the repo already asserts (`About.js:161-172`, `Contact.js:19-41`):
   > Zubair Bin Shaukat is a full-stack software engineer based in Lahore, Pakistan. He builds business automation systems with GoHighLevel and n8n, web applications with Next.js and the MERN stack, and cross-platform mobile apps with React Native.

   Then: stack, years, notable outcomes, links. **Years and outcomes are not in the repo — see Q11.**
2. Homepage FAQ, the four literal headings from spec §5.3, each answered in complete factual sentences.
3. `FAQPage` JSON-LD generated **from the same constant** that renders the visible copy, so they cannot drift:
   ```js
   // lib/content/faq.js — single source
   export const FAQ = [
     { q: "Who is Zubair Bin Shaukat?", a: "Zubair Bin Shaukat is a full-stack software engineer based in Lahore, Pakistan…" },
     …
   ];
   ```
   Render `<h3>{item.q}</h3><p>{item.a}</p>` and feed the same array to the schema builder.

**Risk** — Schema/visible-text mismatch is a manual-action risk. Generating both from one constant removes it structurally.

**Verify** — Rich Results Test on `/` shows a valid FAQ block. `curl -s localhost:3000/ | grep -c "Who is Zubair Bin Shaukat?"` → **2** (once in the `<h3>`, once in the JSON-LD) and the strings must be byte-identical.

---

### C20 — `/llms.txt`

**What it is** — Spec §5.5. Low value, zero risk, 20 minutes.

**Now** — Does not exist.

**Target** — `public/llms.txt`, markdown, one line per key page.

**How** — Static file:
```
# Zubair Bin Shaukat — zubyr.dev
Software engineer in Lahore, Pakistan. Automation, GoHighLevel, web and mobile.

## Pages
- [About](https://www.zubyr.dev/about): Background, stack, and location.
- [GoHighLevel Development](https://www.zubyr.dev/services/gohighlevel): Custom dashboards and marketplace apps.
…
```

**Risk** — None.

**Verify** — `curl -s localhost:3000/llms.txt | head -3`.

---

## 4. Design tokens

Extracted from the existing hero. Hex values verified against the compiled stylesheet `.next/static/css/b46a14f937a9eace.css`, not from Tailwind's documented palette. **Every new page must use these.**

### Color

| Token | Value | Where it comes from |
|---|---|---|
| `--ground` | `#000000` | `Hero.js:12` `bg-black`; `background-beams-with-collision.js:70` `dark:from-black dark:to-black` |
| `--ground-elevated` | `#08080C` | `Projects.js:195` — the near-black used by the non-hero card sections |
| `--accent-from` | `#a855f7` | `from-purple-500` |
| `--accent-via` | `#8b5cf6` | `via-violet-500` |
| `--accent-to` | `#ec4899` | `to-pink-500` |
| **`--accent-gradient`** | `linear-gradient(to right, #a855f7, #8b5cf6, #ec4899)` | **the signature.** `DP.js:12` (blob), `DP.js:19,41` (badges), `HeroText.js:13,30` (script lockup), `page.js:320` (active dot), `page.js:234` (back-to-top) |
| `--glow-indigo` | `#6366f1` | `MainText.js:12-13` divider; `background-beams:175,224` beam |
| `--glow-sky` | `#0ea5e9` | `MainText.js:14-15` divider highlight |
| `--surface` | `rgba(255,255,255,0.03)` | `About.js:189`, `Contact.js:80` |
| `--surface-border` | `rgba(255,255,255,0.05)` – `rgba(255,255,255,0.07)` | `About.js:190`, `Contact.js:81` |
| `--dock-bg` | `#171717` (neutral-900) | `floating-dock.js:86` |
| `--dock-chip` | `#262626` (neutral-800) | `floating-dock.js:147` |
| `--dot-inactive` | `#9ca3af` (gray-400) | `page.js:321` |
| `--badge-text` | `#f3f4f6` (gray-100) | `hello-card.js:29` "Hi!" |
| `--eyebrow` | `rgba(168,85,247,0.7)` | `About.js:110`, `Projects.js:123`, `Contact.js:124` |
| `--ambient-glow` | `radial-gradient(ellipse at center, rgba(168,85,247,0.07) 0%, transparent 70%)` | `About.js:85` |
| `--body-fallback` | `linear-gradient(to bottom right, #111827, #581c87, #4c1d95)` | `layout.js:60` — **never visible**; the hero paints `#000` over it |
| Loader ramp | `#8b5cf6 → #b650df → #d147c7 → #e244af → #ec4899` | `globals.css:52-59`; 12-stop version at `globals.css:61-77` (`.gradient3`) |
| Tech accents | `#61DAFB` React · `#A78BFA` violet-400 · `#FF6B35` orange · `#EA4B71` n8n · `#F97316` · `#FFD43B` | `About.js:20-31`, `Contact.js:19-49` |

**Contrast warning:** `text-white/30` (`Contact.js:147`) and `text-white/20` (`Contact.js:177`) fail 4.5:1 on `#000`. Floor for body copy on new pages: **`text-white/60`**.

### Type

| Role | Family | Loaded via | Used at |
|---|---|---|---|
| Display serif | **Soria** | `/fonts/font-2.ttf` → `font-font2` → *(→ `next/font/local` after C14)* | `HeroText.js:9,10,26,27` |
| Script accent | **Alex Brush** | `/fonts/font-0.ttf` → `font-font0` → *(→ `next/font/local` after C14)* | `HeroText.js:14,31` |
| Badge | **Yatra One** | `next/font/google`, `--font-yatra` | `hello-card.js:29` |
| Body / UI sans | **Inter** | `next/font/google`, `inter.className` on `<body>` | everything else |
| Mono | *(none loaded — see C18)* | — | ~25 inline `fontFamily` sites |

**Scale — take these verbatim for new pages:**

| Element | Classes | Source |
|---|---|---|
| Hero `<h1>` | `text-5xl md:text-7xl lg:text-[108px] font-bold font-font2` | `HeroText.js:10,27` |
| Script lockup | `text-5xl md:text-7xl lg:text-8xl font-medium font-font0 py-4 -mt-6` | `HeroText.js:14,31` |
| "I'm" kicker | `text-2xl font-bold font-font2 mt-2` | `HeroText.js:9,26` |
| Badge | `text-3xl font-yatra font-bold`, box `px-4 py-3`, dashed `border-zinc-700` | `hello-card.js:21,29` |
| Section `<h2>` | `text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-white/90` | `About.js:121` |
| Card `<h3>` | `text-lg sm:text-xl font-bold text-white/85 mb-1.5` | `Projects.js:236` |
| Eyebrow | `text-[11px] tracking-[0.25em] uppercase font-semibold` | `About.js:108` |
| Body | `text-sm sm:text-[15px] leading-[1.8]` | `About.js:156` |
| Micro-label | `text-[10px] font-semibold uppercase tracking-wider` | `Contact.js:177` |

### Motion

| Token | Value | Source |
|---|---|---|
| Section transition | `0.55s cubic-bezier(0.32, 0.72, 0, 1)` | `page.js:206-209` |
| **`--ease-out`** | `cubic-bezier(0.22, 1, 0.36, 1)` | `About.js:64`, `Contact.js:72` |
| Fade-up entrance | `y: 16 → 0`, `blur(6px) → 0`, `0.5s` | `About.js:58-66` |
| Stagger | `staggerChildren: 0.07`, `delayChildren: 0.15–0.2` | `About.js:54`, `Contact.js:113` |
| Pulse (blob, dots) | Tailwind `animate-pulse` = `2s cubic-bezier(0.4,0,0.6,1) infinite`, opacity `1 → .5` | `DP.js:12,49,52` |
| Marquee | `25s linear infinite`, `translateX(0 → -50%)`, pause on hover | `About.js:252-265` |
| Dock magnify spring | `mass: 0.1, stiffness: 150, damping: 12`, 40px → 80px over ±150px | `floating-dock.js:106-136` |
| Hover lift | `y: -2 to -3`, `scale: 1.03–1.1` | `About.js:224`, `Contact.js:205` |
| Tutorial pulse | 8 steps × 300 ms, `scale: [1,1.8,1]`, `rotate: [0,180,360]` | `page.js:62-80, 301-305` |

### Shape & surface

| Token | Value | Source |
|---|---|---|
| Blob | `rounded-[40%_60%_70%_30%/40%_50%_60%_50%]`, `opacity-80` | `DP.js:12` |
| Badge pills | `rounded-full px-6 py-3`, `rotate(-12deg)` / `rotate(6deg)`, `shadow-lg` | `DP.js:19,41` |
| Cards | `rounded-2xl` (project) / `rounded-xl` (info rows) | `Projects.js`, `Contact.js:163` |
| Chips | `rounded-full px-4 py-2.5` / `px-2.5 py-1` | `About.js:187`, `Projects.js:255` |
| Dock | `rounded-2xl h-16 px-4 pb-3 gap-4 items-end` | `floating-dock.js:86` |
| Grid texture | 1px white @ 0.1α, `60px 60px`, wrapper `opacity-[0.025]` | `About.js:72-77` |
| Accent glow ring | `inset 0 0 0 1px {accent}20, 0 0 40px {accent}06` | `Projects.js:283` |

---

## 5. Build order

Each phase has a done-condition. **Do not start a phase before the previous one's done-condition holds.** SEO and structure land before any visual work; the hero is Phase 6, last and isolated.

### Phase 0 — Baseline (½ day)
C13 (dead code), `npm i sharp`, `npx update-browserslist-db@latest`. Capture reference screenshots of the hero at **390×844** and **1440×900** and commit them to `docs/baseline/` — every subsequent phase diffs against these.
**Done when:** build is clean of the `sharp` warning and the two baseline PNGs are committed.

### Phase 1 — Metadata + crawl infra (1 day)
C1, C2, C3, C5. Not C4 yet — it must not advertise routes that don't exist.
**Done when:** `/` emits `<link rel="canonical">` on the canonical host; `robots.txt` names all six AI crawlers; the vercel.app redirect returns 308 on a preview deploy; `og.png` is exactly 1200×630 and previews correctly in the LinkedIn Post Inspector.

### Phase 2 — Routes (3–5 days, the long pole)
C6, then C7, then C10, then C4.
**Done when:** `npm run build` lists 11 routes; every route has exactly one `<h1>`; with JS disabled, `/` shows all five sections' copy; `curl` on `/` finds links to all 9 top-level paths; every `<loc>` in `sitemap.xml` returns 200.

### Phase 3 — Schema + per-page meta (1–2 days)
C8, C9.
**Done when:** Rich Results Test is clean on `/`, one service page, and one project page; `scripts/check-meta.mjs` exits 0.

### Phase 4 — Content + AI-readability (2–3 days, gated on Q3/Q4/Q11)
C19, C20.
**Done when:** `/about`'s first two sentences answer "Who is Zubair Bin Shaukat?" with name + role + location + specialties; the FAQ `<h3>` text and the `FAQPage` schema strings are byte-identical.

### Phase 5 — Performance, non-hero (1–2 days)
C11, C12, C17.1, C18.
**Done when:** `/` First Load JS **< 120 kB**; Lighthouse mobile Accessibility **100**; TBT under 200 ms; zero third-party origins on `/`.

### Phase 6 — Hero (2 days, one commit per change, each independently revertable)
**C14 → screenshot diff → C15 → screenshot diff → C16 → screenshot diff → C17.2 → screenshot diff.** Do not batch these.
**Done when:** the hero is pixel-identical to `docs/baseline/` at both widths **and** Lighthouse mobile shows CLS **0.00**, LCP **< 2.5 s** with the **`<h1>` as the LCP element**, and 2 font preloads in `<head>`.

### Phase 7 — Ship & verify (½ day + ongoing)
Search Console + Bing verification, submit sitemap, request indexing per route, run the spec §6 off-site entity checklist in one sitting, and record the incognito baseline for "Zubair Bin Shaukat" per spec §10.
**Done when:** every box in spec §10 is ticked and Lighthouse mobile is ≥ 95 on all four categories.

---

## 6. Open questions

| # | Question | Why it blocks |
|---|---|---|
| **Q1** | **`www.zubyr.dev` or `zubyr.dev`?** And is the domain live on Vercel yet, or is `zubairbinshaukat.vercel.app` still the only host? | C1, C3, C4, C5, C8 all hardcode it. Spec §2 says pick one and 301 the other; the spec's own examples use `www.`. Getting this wrong ships wrong canonicals sitewide. |
| **Q2** | **Soria's webfont license.** Alex Brush is OFL (Google Fonts) so subsetting and self-hosting is fine. **Soria's license is unverified** — I could not determine it from the repo. Do you have a webfont license permitting subsetting and self-hosting? | C14. If not, Soria must be swapped for a licensed serif, which **would** change the hero — that requires your explicit sign-off. |
| **Q3** | **Who writes the four service pages?** There is no GoHighLevel / n8n / web-dev / mobile copy anywhere in the repo. | C6, C9, C19 (Phase 2 and 4 both stall without it). |
| **Q4** | **Case-study material for `/projects/[slug]`?** Only 3 projects exist (`Projects.js:13-41`), and only 2 have live links (`bizmobile` has `link: ""`). | Spec §1 requires `/projects/[slug]`. Three thin stubs may be worse than one good `/projects` index. |
| **Q5** | **`/blog` on day one?** No MDX pipeline, no MDX deps, no posts. | Spec §1 lists `/blog` and `/blog/[slug]`; §7 calls posts the cheapest ranking asset. Ship an empty `/blog`, or defer the route until post #1 exists? An empty indexed route is a weak signal. |
| **Q6** | **The three testimonial avatars are generated dicebear cartoons** (`Testimonials.js:19,30,41`), not photos of the people quoted. Keep, replace with real photos, or drop the avatars? | Affects C17.1 and E-E-A-T credibility of the quotes. |
| **Q7** | **`public/projects/bizmobile2.png` and `bizmobile3.png`** are referenced only from the orphan `ProjectsData.js:24`. Delete, or wire into a Biz-Xpert Mobile case study? | C13, C6. |
| **Q8** | **Does the wheel-hijack section-swap interaction survive on `/` after the split?** My plan assumes **no** — `/` becomes a normal scrolling page, because spec §0 requires all copy present and §8's a11y clause is incompatible with unconditional `preventDefault` on `wheel`. That deletes the site's signature interaction. | Largest single behavioural change in the plan. If you want it kept, it has to become a progressive enhancement over a fully server-rendered scrolling page, which is materially more work. |
| **Q9** | **Analytics?** Spec §8 permits analytics and nothing else. Vercel Analytics, Plausible, GA4, or none? | Phase 7; affects the third-party-origin count. |
| **Q10** | **Does the Blogger duplicate still exist,** and do you control its DNS/redirects? Spec §6 flags it as competing for your own name. | Phase 7 off-site checklist. Nothing in the repo tells me its URL. |
| **Q11** | **Years of experience and notable outcomes** for the `/about` fact block. The repo asserts stack and location but no dates, no client names, no numbers. | C19 — spec §5.2 says "AI quotes facts, not vibes"; I won't invent them. |

---

### Notes on what I could not verify

- `https://ik.imagekit.io/xosswhicz/project1.png` — dimensions and file size **unverified** (not fetched; no network calls were made to third parties during this audit).
- **Soria's font license** — **unverified** (see Q2).
- Lighthouse numbers in §1.9 are a **single local lab run in headless Edge** on `localhost`. Chrome is not installed at either standard path on this machine. Treat them as a relative baseline for before/after diffing, not as field data.
- Production/CrUX Core Web Vitals — **not available**; nothing is deployed to `zubyr.dev` that I can measure.
