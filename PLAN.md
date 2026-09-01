# zubyr.dev — Build Plan

Three phases. Each is independently shippable and independently revertable. No phase opens until the previous one's done-conditions hold.

Companion documents in the repo: `seo-implementation.md` (the SEO spec), `PLAN.md` (the pre-migration audit — **now partly stale**, see §2), `MIGRATION.md` (what the Next.js upgrade actually did), `design/` (the approved visual prototype).

---

## 0. Ground rules

These hold in every phase. They are not negotiable and not subject to an agent's judgement.

### 0.1 The governing rule

> **Every word Google or an AI needs must exist in server-rendered HTML before any JavaScript runs.**

Animation, transitions, and the preloader are decoration layered over real, crawlable text. If you delete every animation and disable JavaScript, the site must still be a complete, readable, rankable website.

Test it by viewing source, not by trusting the rendered page.

### 0.2 The hero contract

The hero is the design anchor and it survives all three phases visually unchanged. These files are frozen until Phase 3, and even then each change is its own commit:

`app/Components/Hero.js` · `MainText.js` · `UI/HeroText.js` · `DP.js` · `components/ui/hello-card.js` · `app/Components/floating.js` · `components/ui/floating-dock.js` · `components/ui/sparkles.js` · `components/ui/background-beams-with-collision.js`

Preserved exactly: the "Hi!" dashed-bracket badge, the "I'm ZUBAIR" Soria lockup, the Alex Brush "Bin Shaukat", the divider glow and particle field, the portrait on its violet blob, the two gradient badge pills, and the floating social bar.

Baseline screenshots live in `docs/post-migration/`. **Re-capture them at the start of Phase 1** at 390×844, 639px, 640px, and 1440×900 — the current set predates nothing but confirms the post-migration state, and every later diff runs against it.

### 0.3 No escape hatches

Never silence a failure to make a gate pass. No `eslint.ignoreDuringBuilds`, no `typescript.ignoreBuildErrors`, no `--force`, no `--legacy-peer-deps`, no rule downgrades, no suppression comments. If something won't work cleanly, stop and report it as a blocker with the exact error and two or three options.

### 0.4 Research before writing

Next.js 16 ships its own documentation inside `node_modules/next/dist/docs/` and writes an `AGENTS.md` telling agents to read it rather than rely on training data. **Those bundled docs are the authority** — they match the exact installed version. Read the relevant guide before writing code in any area you haven't touched. Where this plan and the bundled docs disagree, the docs win; note the discrepancy in your phase report.

### 0.5 Verification is measured, not asserted

- **Local:** Edge DevTools → Lighthouse panel (Chromium engine, same audits). Chrome is not installed and will not be.
- **Authoritative:** PageSpeed Insights against the **production URL** `https://www.zubyr.dev`. Vercel deployment protection blocks PSI on preview URLs, so previews are verified by hand and by build output only.
- **Field data:** CrUX currently reports insufficient real-world data for the site. Search Console's Core Web Vitals report will stay empty until traffic arrives. This is expected. Lab scores are all you have for now, which is why they get checked every phase rather than once at the end.

### 0.6 Delegation

| Work | Model |
|---|---|
| Planning, review, every phase gate | Fable |
| Motion design, preloader, transition choreography | Opus |
| Bulk implementation | Sonnet |
| Copy-paste, constants, alt text, checklist runs | Haiku |

Fable reviews every phase against its done-conditions. A failing gate reopens the phase. Never parallelise two agents editing the same file.

---

## 1. Locked decisions

Settled. Do not relitigate these.

| Item | Decision |
|---|---|
| Canonical host | `https://www.zubyr.dev`. Apex and `zubairbinshaukat.vercel.app` already 307 to it at the Vercel edge. |
| Redirects in `next.config.mjs` | **Do not add them.** Vercel handles this before app code runs. `PLAN.md` C5 is void. |
| Email | `thedevzubair@gmail.com` — replaces the old address everywhere: contact, footer, schema, metadata. |
| Phone | **Removed entirely.** Not in the UI, not in schema. |
| X handle | `x.com/zubairbinshaukt` — the missing "a" is correct, X caps usernames at 15 characters. `x.com` is the only URL form used anywhere, including `sameAs`. |
| Blogger | Link removed from the site. |
| Logo | `public/logo.svg` (already added) replaces the 512×512 PNG. |
| Portrait | `public/dp.webp` (already added) replaces the 7.3 MB PNG. |
| Fonts | OFL licence files already in `public/fonts/`. Renaming and relocation happen in Phase 2. |
| Analytics | Umami Cloud, site ID `f5f90ae1-bb5f-4e48-a52c-d9dc17c0ab0d`, plus Vercel Speed Insights. |
| Blog | Ships in Phase 1. |
| Section-swap interaction | Replaced by real scrolling pages with Lenis + scroll-snap. |
| `app/loading.js` | Deleted in Phase 3, in the same commit that adds the preloader. |
| Testimonial copy | Unchanged from current text. Monogram placeholder avatars until real photos arrive. |
| Current 3 projects | Deleted wholesale when the real case studies arrive. |
| Node | 24.x local. **Vercel dashboard must be set to match.** |

---

## 2. Current state — post-migration

`PLAN.md`'s audit is accurate on architecture and stale on versions and metrics. What's true now:

- **Next 16.3.4, React 19.2.8, framer-motion 13.1.1, ESLint 9.39.5.** Turbopack is the builder. Production dependency vulnerabilities: 0.
- **Mobile Lighthouse baseline is 61**, not the 48 in `PLAN.md`. That number came from a different tool and is void. CLS measured 0 consistently across runs; the 0.178 figure was an unreproducible outlier. TBT rose ~332ms from React 19's larger runtime.
- **One `<h1>` rule is still violated** — 4 in the server HTML.
- **Four routes exist.** Eleven are needed.
- **Four of five content sections are absent from server HTML** — the section-swapper mounts one at a time.
- **7 ESLint errors** surfaced by `eslint-config-next@16`'s React Compiler rules, all in pre-existing code. They block nothing (Next 16's build no longer lints) but two are real bugs. Fixed in Phase 2.
- `sharp` is **not** needed — Next 16 ships it as an optional dependency. `PLAN.md` is wrong on this.
- `@tsparticles/react` was never a React 19 risk. `PLAN.md` is wrong on this too.
- A **third remote pattern** exists that `PLAN.md` missed: `api.dicebear.com`.

**Immediately, before Phase 1:** add `"engines": { "node": ">=20.9.0" }` as a top-level field in `package.json`, and confirm the Vercel dashboard Node version matches local. One commit.

---

# Phase 1 — Foundation

**Goal:** every page that will ever exist, exists — with correct semantic HTML, correct metadata, correct structured data, and real content. Deliberately unstyled beyond the hero.

**Why unstyled:** if the site scores 100/100/100/100 with no design applied, then any later drop has exactly one suspect. Debugging a performance regression through a styled, animated site is guesswork; through a plain one it's arithmetic.

**What you must supply before this phase can finish:** service page copy, case study material, years of experience, notable outcomes, client types. Phases 1.6 and 1.7 stall without them. Start writing now.

### 1.1 Content architecture

Build the single-source-of-truth layer first. Everything else imports from it.

```
lib/
  site.js          name, email, canonical URL, location, socials, tagline, nav structure
  services.js      the four services: slug, title, description, body copy
  testimonials.js  quotes, attribution, avatar reference
  faq.js           Q&A pairs — feeds BOTH the visible FAQ and the FAQPage schema
  projects.js      reads content/projects/*.mdx, exports getAll() / getBySlug() / getFeatured()
  blog.js          same for content/blog/*.mdx
  schema.js        JSON-LD builders, all reading from site.js

content/
  projects/*.mdx   frontmatter + case study body
  blog/*.mdx       frontmatter + post body
```

**Rules:**

- Every fact appears **once**. The email lives in `lib/site.js` and nowhere else — footer, contact page, JSON-LD `sameAs`, and page metadata all import it. This is what prevents the entity-inconsistency problem the SEO spec warns about, and it's why the email change is a one-line edit rather than a search-and-replace.
- `lib/faq.js` feeds the rendered `<h3>` questions **and** the schema from the same array. A mismatch between visible text and FAQ schema is a manual-action risk; generating both from one constant makes it structurally impossible.
- Frontmatter carries structured data: `title`, `slug`, `summary`, `client`, `year`, `stack[]`, `cover`, `coverWidth`, `coverHeight`, `featured`, `publishedAt`, `updatedAt`. Image dimensions in frontmatter are what keep CLS at zero as content is added.
- Keep frontmatter field names identical across every file. One post using `date` where another uses `publishedAt` silently breaks sorting.

**MDX tooling — read the bundled docs, then choose:**

Two viable paths. Evaluate both and justify the pick in the phase report.

- `gray-matter` for frontmatter + **`next-mdx-remote-client`** for rendering. Note that `next-mdx-remote` itself was **archived in April 2026**; `next-mdx-remote-client` is the maintained community successor.
- `@next/mdx`, the official package, which sources local MDX directly in the app directory with Server Component support. It does **not** support YAML frontmatter by default — the documented pattern is exporting a `metadata` const from the MDX file instead.

**Do not use Contentlayer.** It has been archived and unmaintained since 2024.

Add `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, and a syntax highlighter (`rehype-pretty-code` or `shiki`) for the blog.

### 1.2 Routes

Build all eleven as **server components**. No `"use client"` in any `page.js`.

| Route | Title tag | H1 | Primary keyword |
|---|---|---|---|
| `/` | Zubair Bin Shaukat — Software Engineer & Problem Solver | Zubair Bin Shaukat | zubair bin shaukat, zubyr dev |
| `/about` | About | About Zubair Bin Shaukat | who is zubair bin shaukat |
| `/services/gohighlevel` | GoHighLevel Development | GoHighLevel Custom Dashboards & Marketplace Apps | gohighlevel expert, ghl developer |
| `/services/automation` | n8n & Workflow Automation | Automation Systems with n8n | n8n automation developer |
| `/services/web-development` | Web Development | Web Development with Next.js & React | next.js developer lahore |
| `/services/mobile` | Mobile App Development | Cross-Platform Mobile Apps | react native developer pakistan |
| `/projects` | Projects | Selected Work | zubair bin shaukat portfolio |
| `/projects/[slug]` | {Project} — Case Study | {Project name} | project-specific |
| `/blog` | Blog | Engineering Notes | — |
| `/blog/[slug]` | {Post title} | {Post title} | post-specific |
| `/contact` | Contact | Start a Project | hire zubair bin shaukat |

Titles are short because Google uses them as sitelink labels. The `%s — Zubair Bin Shaukat` template appends the brand.

**Structural requirements:**

- Exactly **one `<h1>` per route**, logical `h2`/`h3` beneath, no skipped levels.
- Real `<nav>`, `<main>`, `<article>`, `<footer>` landmarks. A skip-to-content link as the first `<body>` child.
- Navigation is real `next/link` anchors. No `onClick` routing anywhere.
- Homepage links to all nine top-level routes in both nav and footer — that internal link graph is what sitelinks are generated from.
- Each service page cross-links the other three and back to `/`.

**Homepage composition:** hero (untouched) → what I do, four cards each linking its service page → selected work, 3–4 featured case studies → how I work, three steps → FAQ → CTA and footer.

### 1.3 Dismantle the section machine

`app/page.js` currently swaps five sections through one DOM slot with hijacked wheel and touch events. It becomes a normal scrolling page.

- Move hard-coded data out of the client components into `lib/` (`Projects.js:13-41`, `Testimonials.js:13-46`, `Contact.js:19-49`).
- Rewrite each section so text is server-rendered and only genuinely interactive parts are client islands. Prefer making the **visible** markup crawlable over duplicating content into `sr-only` — duplicate text is a smell, and a visually-hidden list is a last resort, not the pattern.
- Delete the wheel and touch handlers (`app/page.js:87-174`) and the section state machine.
- The dot nav's fate is decided in Phase 3 — leave the markup for now, remove only its `onClick` navigation.

**The hero component itself is imported unchanged.** Diff the rendered hero DOM before and after.

### 1.4 Metadata

Root metadata in `app/layout.js` per `seo-implementation.md` §2: `metadataBase`, title template, description, `applicationName`, `authors`, `creator`, `keywords` **at top level** (they currently sit inside `openGraph` and emit nothing), `alternates.canonical`, full `openGraph` and `twitter` blocks, `robots` with `max-image-preview: large`.

Every other route exports its own `metadata` with a unique title, a **150–160 character** description, and `alternates.canonical`. Dynamic routes use `generateMetadata()` fed from frontmatter.

Check whether `viewport`, `themeColor`, or `colorScheme` sit inside the metadata object — they belong in a separate `export const viewport`.

Write `scripts/check-meta.mjs`: crawl built routes, assert descriptions are 140–160 characters and titles are unique. Cheaper than eyeballing eleven pages, and it becomes a permanent regression guard.

### 1.5 Structured data

`components/SchemaOrg.js`, a server component rendering the `Person` + `WebSite` + `ProfilePage` `@graph` from `seo-implementation.md` §3, with values read from `lib/site.js`.

- `email` → `thedevzubair@gmail.com`. **No `telephone` field.**
- `sameAs` → GitHub, LinkedIn, `https://x.com/zubairbinshaukt`, Instagram. **No Blogger.** Every URL in exactly the form used on the site.
- `image` → `https://www.zubyr.dev/dp.webp`
- `knowsAbout` → GoHighLevel, n8n, Workflow Automation, Next.js, React, React Native, Node.js, AdonisJS, TypeScript, Python, MERN
- `WebSite.name` = "Zubair Bin Shaukat" — this is what makes Google show your name as the brand label above the URL.

Per page: `Service` on service pages with `provider` pointing at the Person `@id`; `Article` or `CreativeWork` on blog and project pages; `BreadcrumbList` on all inner pages; `FAQPage` on the homepage, generated from `lib/faq.js`.

Validate every page type in Google's Rich Results Test and validator.schema.org. Zero errors.

### 1.6 Content

- **`/about`** — third person, fact-dense. The first two sentences must fully answer "Who is Zubair Bin Shaukat?" — name, role, location, specialties. Then stack, years, outcomes, links. AI systems lift these close to verbatim, so they must be complete factual sentences, not fragments.
- **FAQ** — the four literal questions from the spec, each with a plain factual answer.
- **Service pages** — from your copy.
- **Projects** — placeholder MDX until your real case studies arrive. The current three are deleted, not adapted.
- **Blog** — at least one real post at launch. An indexed empty route is a weak signal.

### 1.7 Crawl infrastructure

- `app/sitemap.js` — all nine static routes plus generated project and blog entries. Delete the single vercel.app URL.
- Convert `app/robots.txt` to `app/robots.js`, allowing `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`, `Applebot-Extended`. **Delete the `.txt` in the same commit** — two files is ambiguity.
- `app/opengraph-image.js` using `ImageResponse` at exactly 1200×630, built from the brand tokens. Delete the 3448×2178 / 2.8 MB `og-image.png`, whose declared dimensions were wrong anyway. Generated beats hand-made here because it can't drift out of sync.
- `public/llms.txt` — markdown list of key pages with one-line descriptions. Low value today; twenty minutes, zero risk.

### Phase 1 done-conditions

- [ ] `npm run build` lists all 11 routes, every one static
- [ ] Every route: exactly one `<h1>`, no skipped heading levels
- [ ] JS disabled → every page's full copy is readable
- [ ] `curl` on `/` finds links to all nine top-level paths
- [ ] Every `<loc>` in `sitemap.xml` returns 200
- [ ] `robots.txt` names all six AI crawlers; no stray `.txt` file remains
- [ ] Rich Results Test clean on `/`, one service page, one project page, one blog post
- [ ] FAQ `<h3>` text and `FAQPage` schema strings are byte-identical
- [ ] `node scripts/check-meta.mjs` exits 0
- [ ] OG image is exactly 1200×630 and previews correctly in the LinkedIn Post Inspector
- [ ] No old email, no phone number, no Blogger link, no vercel.app URL anywhere: `git grep` each
- [ ] Hero pixel-identical to `docs/post-migration/`
- [ ] PageSpeed on prod: **100 SEO, 100 Accessibility, 100 Best Practices**, Performance ≥ 95

---

# Phase 2 — Design

**Goal:** the approved prototype in `design/` becomes the real site, and the asset and lint debt clears. The structure and SEO layer from Phase 1 must survive intact.

**Prerequisite:** Phase 1 green.

### 2.1 Port the prototype

`design/Zubyr Below Hero.dc.html` is the reference. Read `design/README.md` for provenance.

- Convert to React components against the **existing** Phase 1 markup. The HTML structure, heading hierarchy, and landmarks from Phase 1 are correct — the design applies to them. **Do not restructure the DOM to suit the design.** If the design genuinely requires a structural change, flag it and justify it; don't do it silently.
- Extract the prototype's design tokens into Tailwind config and CSS custom properties. No magic hex values scattered through components.
- Server components by default. `"use client"` only where there's real interactivity.
- **Body copy contrast floor is `rgba(255,255,255,0.6)`.** The old site used 20–30% opacity text that failed 4.5:1. Do not reintroduce it.
- Every image: `next/image`, explicit dimensions, real alt text, correct `sizes`.

The prototype has no shared element transitions — those are Phase 3. Build the markup so they can be added without restructuring: stable elements, predictable class hooks on card images and titles.

### 2.2 Assets

**Fonts** — currently unsubsetted TTF with no `font-display` and no preload, discovered third-order (HTML → CSS → `@font-face` → TTF). Lighthouse flags both.

1. Rename for legibility: `font-2.ttf` → `soria-regular`, `font-0.ttf` → `alexbrush-regular`. Move to `app/fonts/`. **Move the OFL licence files with them** and name them to match: `soria-OFL.txt`, `alexbrush-OFL.txt`. A licence separated from its font is a licence that doesn't apply to anything.
2. Subset to Latin and convert to woff2 — Font Squirrel's Webfont Generator or Transfonter, both browser-based. Expect ~75 KB → ~20 KB and ~47 KB → ~15 KB.
3. Load via `next/font/local` with `display: "swap"`, `preload: true`, and a CSS variable. Set `adjustFontFallback: false` — at 108px display sizes a mis-metric'd fallback flash is worse than a clean swap.
4. Point Tailwind at the variables but **keep the `font0` / `font2` class names**. `HeroText.js` then needs no edit at all. This is the single most important detail for keeping the hero identical.
5. Delete `app/globals.css:5-24`, the TTF files, `font-1.ttf` (Skyscapers — declared, zero usages), and `font-3.ttf` (Niconne — no `@font-face` at all).

Verify the subset preserved kerning: the "ZUBAIR" glyph advance widths must be identical. That's what `--layout-features="kern,liga"` protects.

**Images**

- `logo.svg` replaces `logo.png` in `Hero.js`. Inline it or use a plain `<img>` — a 40×40 vector needs no optimizer. Delete the 214 KB PNG.
- `dp.webp` replaces `dp.png` in `DP.js`. **Use the static import so the true aspect ratio comes from the file** — do not hand-write `width`/`height` again; the old `700×700` on a 9:16 image is what caused the aspect-ratio mismatch. Add `sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 700px"`. Delete the 7.3 MB PNG.
- Testimonial avatars: monogram placeholders, designed. Not cartoon generators.
- Self-host or remove the remaining remote image origins — `ik.imagekit.io` (used), `api.dicebear.com` (used, being replaced), `images.unsplash.com` (unused, delete). Goal: **zero third-party origins on `/`**.

**LCP decision:** the `<h1>` should be the LCP element, not the portrait. Reasons: the spec requires it; text LCP is bounded by a 20 KB preloaded font while image LCP is bounded by a decoded photograph; and the heading sits higher in both layouts. Achieve it by making the heading paint sooner (preloaded subset font) rather than by delaying the portrait. Measure both with and without `priority` on the image and keep whichever gives lower LCP **without** a visible pop-in.

### 2.3 JavaScript budget

Target: **under 120 KB First Load JS.**

- **framer-motion → `LazyMotion` + `m` components.** The library can't tree-shake below ~34 KB because of its props-driven API, but `m` plus `LazyMotion` brings initial render to ~4.6 KB with features loading after. Swap `motion.div` → `m.div`, wrap in `<LazyMotion features={domAnimation}>`, add `strict` so any regression throws instead of silently re-bloating.
- **Lazy-load tsParticles.** `dynamic(..., { ssr: false })` with a placeholder occupying the identical box so nothing shifts. It's already `opacity-0` until `particlesLoaded` fires, so deferring the import is invisible.
- Delete the orphans: `app/Components/ProjectsData.js` and `components/ui/ProjectCarousal.js`, imported by nothing.
- Remove the ~25 inline `fontFamily` declarations naming six fonts that are never loaded (`Outfit`, `Sora`, `DM Sans`, `General Sans`, `JetBrains Mono`, `Fira Code`). They already fall through to Inter, so deleting them is a zero-pixel change that stops the CSS lying. Add **one** mono via `next/font/google` for eyebrows and labels, wired as `font-mono`.

### 2.4 The seven ESLint errors

Fix, don't suppress. Two matter:

- **The inner component in `hello-card.js`** — a component defined inside another component remounts on every render. That's a real bug, not a style rule, and it's in the "Hi!" badge. This file is hero-adjacent: fix it in Phase 2 but **screenshot-diff the badge on its own**.
- **`Math.random()` during render in the beams** — React Compiler correctly flags this as impure. Move the randomness to `useState` initialisers or a ref so it's generated once, not per render.

The pre-existing warnings (`no-img-element`, `exhaustive-deps`) get resolved by the work above.

### 2.5 Analytics

- **Umami** via `next/script` in `app/layout.js`, `strategy="afterInteractive"`, site ID `f5f90ae1-bb5f-4e48-a52c-d9dc17c0ab0d`. Not a raw `<script>` tag.
- **Vercel Speed Insights** — `npm i @vercel/speed-insights`, one component in the layout, enabled in the dashboard. This is the real-user Core Web Vitals data; Lighthouse is a simulation.
- Nothing else. No GTM, no chat widget, no third scripts.

### Phase 2 done-conditions

- [ ] Every design view built; site matches the prototype at phone and desktop widths
- [ ] Phase 1's heading hierarchy, landmarks, and schema **still valid** — re-run every Phase 1 gate
- [ ] First Load JS **< 120 KB**
- [ ] Two font preloads in `<head>`; no TTF requests; `font-display: swap` present
- [ ] Fonts and their licence files co-located and named to match
- [ ] `git grep` finds no reference to `dp.png`, `logo.png`, `og-image.png`, `font-1`, `font-3`
- [ ] Zero third-party origins on `/`
- [ ] `npm run lint` clean — zero errors, zero new warnings
- [ ] Accessibility 100; body text contrast ≥ 4.5:1 everywhere
- [ ] LCP element is the `<h1>`; CLS 0.00
- [ ] Hero pixel-identical, including the "Hi!" badge after the inner-component fix
- [ ] PageSpeed on prod: Performance ≥ 95, everything else 100

---

# Phase 3 — Motion and hero

**Goal:** the site moves the way it should, and the hero's outstanding issues resolve — each in isolation, each revertable.

**Prerequisite:** Phase 2 green. Motion is added to a site that already scores ≥ 95 without it. If a score drops, the motion is the suspect, not the content.

### 3.1 Smooth scroll

**Lenis.** It runs on native scroll — wrapping the browser's own scroll so `position: sticky`, anchor links and accessibility keep working — and by default honours `prefers-reduced-motion`, disabling smoothing and making programmatic scrolls jump instantly. That's what replaces the wheel hijack.

- `npm install gsap lenis`. Import the React wrapper from `lenis/react`; the old `@studio-freight/*` packages are retired. `smoothTouch` is gone — use `syncTouch` for touch smoothing.
- Add CSS scroll-snap per section so the section-to-section feel survives on a real scrolling page.
- **Reset scroll on route change**, or navigation lands mid-page. Easy to miss, very obvious when wrong.
- Register `gsap.registerPlugin(ScrollTrigger)` once at module level. Use `useGSAP()` from `@gsap/react` — a drop-in `useEffect` replacement that automates cleanup.
- Call `ScrollTrigger.refresh()` after font load and image load; trigger positions drift otherwise.

GSAP is fully free including all former Club plugins — SplitText, ScrollTrigger, ScrollSmoother, MorphSVG — with the standard licence covering commercial use. SplitText was rewritten with a ~50% size reduction and built-in screen-reader accessibility, which is what makes a character-split heading reveal safe for crawlers.

### 3.2 Page transitions — three tiers

**Tier 1, every route change: View Transitions.** A crossfade with a small upward lift, **≤ 300 ms**, on `cubic-bezier(0.22, 1, 0.36, 1)`.

This solves a real problem: in the App Router the outgoing page unmounts before an exit animation can run, and `template.js` only gives you enter animations. The View Transitions API sidesteps it because the browser snapshots the old page before it's gone.

Implementation — **verify against the bundled docs, sources disagree**: Next exposes `experimental.viewTransition` in `next.config`, paired with React 19.2's `<ViewTransition>` imported from `react` itself. Some sources report it promoted to a top-level `viewTransition` key in 16.2+ and a `transitionTypes` prop on `<Link>`. Establish what the installed version actually supports before building on it. The plain `document.startViewTransition` path works regardless and is the fallback if the integration is too raw.

Same-document transitions are well supported (Chrome 111+, Safari 18+, Firefox 144+). Unsupported browsers get an ordinary navigation — no polyfill, no feature detection needed for basic use.

**Tier 2, list → detail only: shared elements.** Projects index → case study, and blog index → post. The card image and title persist and grow into the detail page. Matching `view-transition-name` on both ends; assign it dynamically to the clicked card, since one element can hold a given name at a time.

Pair with prefetching — Next 16.3's Instant Navigations and Partial Prefetching. A transition over a prefetched page feels instant; over a page still fetching it feels like lag.

**Tier 3, one deliberate moment: the mobile menu overlay.** Full-screen, staggered link reveals. The one place a longer, more theatrical transition earns its keep.

**Rules:** nothing over 300 ms for tier 1 — the user has already decided to go somewhere and every extra frame is friction. No loading curtain on internal navigation; the pages are static and prefetched, so a wipe over ready content is theatre that costs real time. Everything skipped under `prefers-reduced-motion`.

### 3.3 The preloader

First visit only. **A cosmetic overlay on top of already-rendered HTML, never a gate in front of it.** The page is static and fully painted when it arrives; the overlay mounts after hydration on top of a hero that's already there. Crawlers and the LCP metric never see it.

Design it — the agent brainstorms and may do better than this. Reference direction, from the original blueprint:

- **0.0–0.6 s** — mono boot lines typing in, staggered, top-left. Bottom-right a counter climbing 00 → 100 on an eased curve that hesitates near 87 before snapping. The hesitation is what makes it read as real.
- **0.6–1.4 s** — the name in Soria, revealed character by character with a clip-path wipe rising through each letter, while thin 1px lines draw across connecting a few dots — a flat foreshadow of the hero.
- **1.4–2.0 s** — counter hits 100, one beat of hold, then the overlay exits as three vertical panels sliding up on a 60 ms stagger. The hero's own text settles `y: 20 → 0` timed to the last panel, so reveal and hero intro read as one continuous move.

**Fixed constraints — not design decisions:**

- Pure DOM, CSS, GSAP. No canvas, no images, no fonts of its own; it reuses the already-preloaded Soria.
- `"use client"` island. Initial HTML contains **zero** preloader markup. Nothing blocks first paint, zero CLS.
- **≤ 2.2 s**, skippable on any click or keypress, once per session. Session flag in memory or a cookie — **never `localStorage`**.
- `prefers-reduced-motion` → skipped entirely.
- Dark ground matching the page so the handoff is invisible.
- **PageSpeed scores must be identical with it on and off.** If they aren't, the implementation broke the rule — that's a bug, not a tradeoff.

Note: the original concept existed to mask a Three.js warm-up. There is no Three.js here, only tsParticles, which is far lighter — so there is less dead time to hide. Consider **1.6 s** rather than 2.2 s. A preloader with nothing to conceal is pure theatre, and theatre wears out on the second visit.

**Delete `app/loading.js` in this same commit.** It's a Suspense fallback that shows *instead of* the page — the exact "gate in front of content" pattern being replaced. Deleting it earlier would leave a window with no loading state; check nothing else references it.

### 3.4 The top-right collision

Three related problems, confirmed in `docs/post-migration/frozen-390x844.png` and visible at other widths:

1. The design's index button and the hero's floating social dock both claim the top-right corner on mobile. Two competing controls in one corner at 390px.
2. The social dock is broken independently — it renders as a bare unlabelled square with no visible icons, and it's the element failing the `button-name` audit.
3. The dot nav is stranded mid-right-edge, overlapping the portrait, and its original job disappeared when the section machine did.

**Treat the top-right as one control system, not two elements to deconflict.** Brainstorm and propose: fold the socials into the overlay menu, move the dock to the bottom on mobile, make the index button the only persistent control, or something better. Justify the choice. The dot nav either becomes a scroll-progress indicator or it goes — decide, don't leave it stranded.

Audit **all** of `docs/post-migration/` at every captured width, not just the one screenshot. The same class of problem likely exists at 639/640 where the hero swaps variants.

The fix ships with the accessible name, `aria-expanded`, and ≥ 44px tap targets. The accessibility fix and the layout fix are the same commit, not two.

### 3.5 Hero commit sequence

One commit each, screenshot-diffed between every one. Never batched.

1. Font loading (2.2, if deferred to here)
2. Portrait swap and `sizes` (2.2, if deferred to here)
3. Nav and dock resolution (3.4)
4. `will-change: opacity` on the pulsing blob and dots — layer promotion, invisible, cheap

### Phase 3 done-conditions

- [ ] Lenis smooth scroll; scroll resets on route change; reduced-motion disables it
- [ ] Tier 1 transitions on every route change, ≤ 300 ms
- [ ] Shared element transitions on projects → case study and blog → post
- [ ] Preloader: ≤ 2.2 s, skippable, once per session, reduced-motion skips, zero markup in initial HTML
- [ ] **PageSpeed identical with preloader on and off** — the defining test
- [ ] `app/loading.js` deleted; nothing references it
- [ ] Top-right resolved at 390 / 639 / 640 / 1440; `button-name` passes; tap targets ≥ 44px
- [ ] Dot nav has a defined purpose or is gone
- [ ] Hero pixel-identical apart from the deliberate nav change
- [ ] First Load JS still < 120 KB
- [ ] PageSpeed on prod: Performance ≥ 95, Accessibility / Best Practices / SEO 100

---

# 4. Launch

Runs after Phase 3, mostly outside the repo.

### 4.1 Off-site entity reinforcement

On-site schema *claims* the identity; these links *confirm* it. Do them in one sitting.

- [ ] LinkedIn website field → `https://www.zubyr.dev`
- [ ] GitHub profile website + README link — GitHub is a high-authority domain
- [ ] X and Instagram bios → `zubyr.dev`
- [ ] Any freelance profile → `zubyr.dev`
- [ ] **Blogger duplicate: 301 to `zubyr.dev` or reduce to a stub pointing at it.** It currently competes with you for your own name.
- [ ] Every profile in `sameAs` links back — the relationship has to be bidirectional
- [ ] Identical display name, headline and photo across all profiles

### 4.2 Indexing

- [ ] Search Console: submit `sitemap.xml`, request indexing per route
- [ ] Bing Webmaster Tools: verify and submit — ChatGPT search leans on Bing's index
- [ ] IndexNow via Vercel
- [ ] Record the incognito baseline for "Zubair Bin Shaukat" and "zubyr dev"; recheck at 30 days

### 4.3 Final gate

- [ ] Every box in `seo-implementation.md` §10
- [ ] PageSpeed on `https://www.zubyr.dev` ≥ 95 across all four categories
- [ ] OG image renders in LinkedIn, X and WhatsApp preview tests
- [ ] Ask ChatGPT, Claude and Perplexity "Who is Zubair Bin Shaukat?" and record what they say. That's the real test of the AI-readability layer, and it's the one nobody runs.

---

# 5. Open questions

Answer before the phase that needs it.

| # | Question | Blocks |
|---|---|---|
| Q1 | **Service page copy** — four pages, GoHighLevel / automation / web / mobile. | Phase 1.6 |
| Q2 | **Case study material** — which projects, with real problems, approaches and outcomes. Numbers if you have them. | Phase 1.6 |
| Q3 | **Years of experience and notable outcomes** for the `/about` fact block. The repo asserts stack and location but no dates and no numbers, and I won't invent them. | Phase 1.6 |
| Q4 | **First blog post.** At least one at launch — an empty indexed route is a weak signal. | Phase 1.6 |
| Q5 | **Testimonial photos** — placeholder monograms ship without them, but they're worth chasing. | Phase 2.2 |
| Q6 | **The three dicebear avatars are generated cartoons**, not the people quoted. Replace with real photos, or drop avatars entirely and let the quotes stand? | Phase 2.2 |
| Q7 | **`bizmobile2/3.png`** — delete with the old projects, or keep for a case study? | Phase 2.2 |
| Q8 | **Vercel Node version** — confirm the dashboard is set to match local 24.x. | Immediately |