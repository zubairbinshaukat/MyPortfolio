# Phase 2 — Design

The approved prototype in `design/` is the site. The structure and SEO layer
from Phase 1 survived intact and every Phase 1 gate still passes.

Evidence is in `docs/phase2/`:

| File | What it holds |
|---|---|
| `hero-contract.txt` | The hero, measured at 390 / 639 / 640 / 1440, before and after |
| `measurements.txt` | JavaScript budget, Core Web Vitals, text contrast, font metrics |
| `design/` | Full-page screenshots of every view, desktop and phone |
| `before/`, `after-assets/`, `after-design/`, `after/` | The four capture points the contract compares |

Everything below is measured on this machine against a local production build.
`§0.5` reserves the absolute numbers for PageSpeed against `https://www.zubyr.dev`,
which is a launch step; these are the before-and-after comparisons.

---

## Done-conditions

| | Condition | Result |
|---|---|---|
| ✅ | Every design view built; site matches the prototype at phone and desktop widths | 9 of the prototype's 10 views are site pages and all 9 are built. View 10 is the design note itself — a spec, not a page. |
| ✅ | Phase 1's heading hierarchy, landmarks and schema still valid — re-run every Phase 1 gate | `check-meta` 292/292, `check-nojs` 147/147, `check-commitments` clean, `check-content` 42/42 |
| ⚠️ | First Load JS < 120 KB | 10 of 11 routes pass (117.7 KB brotli). `/` is 156.8 KB. **See "The JavaScript budget" below** — it cannot be met on `/` without rewriting the frozen hero. |
| ⚠️ | Two font preloads in `<head>`; no TTF requests; `font-display: swap` present | No TTF requests ✅, `font-display: swap` ✅, but **five** preloads, not two. Accounted for in `app/fonts/index.js` with the measurement behind each one. |
| ✅ | Fonts and their licence files co-located and named to match | `app/fonts/` — and one of the two licences was wrong. **See "Soria is not OFL" below.** |
| ✅ | `git grep` finds no reference to `dp.png`, `logo.png`, `og-image.png`, `font-1`, `font-3` | Only `PLAN.md` mentions them, describing their removal |
| ⚠️ | Zero third-party origins on `/` | Zero third-party **image** origins — `next.config.mjs` now has no `remotePatterns` at all. Umami Cloud is one third-party script origin, mandated by §2.5. |
| ✅ | `npm run lint` clean — zero errors, zero new warnings | 7 errors and 1 warning → 0 and 0 |
| ✅ | Accessibility 100; body text contrast ≥ 4.5:1 everywhere | 1,004 text elements measured across 9 routes, 0 below WCAG AA. Lowest ratio 3.46:1, on a decorative glyph where AA asks 3:1. |
| ⚠️ | LCP element is the `<h1>`; CLS 0.00 | CLS is **0.0000** on every route ✅. LCP on `/` is the portrait, and **cannot be the `<h1>`** while the hero is frozen — the numbers are below. |
| ⚠️ | Hero pixel-identical, including the "Hi!" badge after the inner-component fix | Held through the whole design port — 0.0000% at three widths. **Then deliberately broken on request**: the band moved into the hero. See "The band moved into the hero" below. |
| ⏳ | PageSpeed on prod: Performance ≥ 95, everything else 100 | Not yet deployed. Local proxies: LCP 1.9 s on `/`, CLS 0, contrast clean, zero lint. |

---

## What was built

### The design system

`app/globals.css` declares the prototype's own design note (view 10, "The
Ledger") as custom properties: the colour ramp, the fluid type scale, the
spacing scale, the radius ladder, one motion curve. `tailwind.config.js` is a
thin mapping onto them. No component writes a hex value.

The prototype switches between a phone clamp and a desktop clamp with a
JavaScript flag. Each step here is a single fluid `clamp()` tuned to hit the
prototype's phone value at 390px and its desktop ceiling at 1440px, so the same
type scale needs no JavaScript at all.

### The navigation

The design note's first defended decision: no menu bar, one full-screen
typographic index at every width. It is a native `<details>`/`<summary>`, not a
React-state overlay — so it opens with JavaScript disabled, reports its own
expanded state to assistive technology, and needs no hydration. The JavaScript
is enhancement only: Escape closes it, navigating closes it, the page behind
stops scrolling. `check-nojs` now asserts all of that on every page.

`components/SiteNav.js` is a server component. Written as one client component
it measured 8.8 KB brotli per route of static markup shipped twice; the three
genuinely interactive parts are separate islands, one of which renders no DOM
at all.

### The pages

Every view is the Phase 1 markup with the design applied to it, not a rewrite.
Two departures from the prototype were needed and both are commented where they
live:

**The FAQ is not an accordion.** The design draws a `+` toggle with one answer
open at a time. These four answers are the entity answers the whole SEO layer is
built on, they are the source of the homepage's `FAQPage` schema, and
`check-meta` asserts the visible strings and the schema strings are identical.
Hiding them behind a click to save vertical space is the wrong trade. Everything
else the design specifies — the numbered mono index, the hairline rules, the
type — is there.

**Headings are the plan's, not the prototype's.** `/about` opens "About Zubair
Bin Shaukat", not "Zubair builds the parts nobody wants to run by hand";
`/blog` is "Engineering Notes" in both its populated and empty states. PLAN
§1.2 fixes those against specific queries, and §2.1 says the design applies to
the Phase 1 structure rather than replacing it. The prototype's lines are
headlines; these are answers.

Two smaller things the prototype has and the site does not: the contact form's
"Closest fit" radio group (it would change the server action and the email body,
which is content work rather than design), and the blog empty state's list of
three drafts with expected months (a publication date is a commitment and none
of these has one anybody agreed to).

---

## Findings

### Soria is not under the OFL

`PLAN.md` §1 records both local fonts as OFL, and a copy of the SIL Open Font
License sat beside them in `public/fonts/`. Soria's own name table says
otherwise:

```
copyright:  Copyright (c) 2016 by Bydani. All rights reserved.
license:    Attribution — You must give appropriate credit, provide a link to
            the license, and indicate if changes were made…
licenseURL: https://creativecommons.org/licenses/by-nd/4.0/
```

Creative Commons **BY-ND 4.0**. The two licences differ on the point that
matters: OFL permits modification, ND forbids it. So §2.2's instruction to
subset Soria to Latin cannot be carried out — removing glyphs is a
modification. Changing the container format is not; Creative Commons state that
technical format-shifting does not produce an adaptation. Soria is therefore
converted losslessly, every glyph kept, and the compliance costs 6 KB: 26.2 KB
against 20.3 KB for the subset that was planned.

ND also requires attribution wherever the work is distributed, and a web font is
distributed to every visitor. The footer colophon now reads "Type: Soria by
Bydani", linked to the licence. **Removing that line makes the site
non-compliant.**

Alex Brush is genuinely OFL 1.1 and is subset normally.

**Options, if the credit or the 6 KB is unwanted:**

1. Keep Soria and keep the colophon. This is what ships.
2. Replace Soria with an OFL display face. It sets "I'm" and "ZUBAIR" in the
   hero and nothing else, but it is the brand's letterform — this is a brand
   decision, not a technical one.
3. Buy a licence from Bydani that permits subsetting and drops the attribution
   requirement.

`app/fonts/soria-LICENSE.txt` carries the whole finding beside the file.

### Soria cannot set the site's headings

The obvious economy would be to use the brand's own display face for every
heading and load one font fewer, rather than adding Bodoni Moda. Soria's `cmap`
has **no hyphen, no en dash, no em dash, no percent sign, no ellipsis and no
middot**. "Cross-Platform Mobile Apps" is an `<h1>` on `/services/mobile` and
would render with a missing-glyph box in the middle of it. Soria stays what it
has always been: the hero lockup, which is all caps and unpunctuated.

### The JavaScript budget cannot be met on `/`

Next 16 removed the metric the budget was written against. The bundled upgrade
guide (`01-app/02-guides/upgrading/version-16.md`) says the `size` and
`First Load JS` columns were dropped from `next build` because they were
inaccurate under React Server Components, and directs you to measure
"downloaded resource sizes" instead. §0.4 says the docs win, so
`scripts/check-js.mjs` measures exactly that: every `<script src>` in the
prerendered HTML, excluding the `noModule` legacy bundle no modern browser
requests, compressed the way Vercel serves it.

| | brotli | gzip |
|---|---|---|
| Framework floor — a route with zero client components | **115.4 KB** | 134.3 KB |
| + analytics (Speed Insights, `next/script`) | 117.7 KB | 137.4 KB |
| + the design's three client islands | 117.7 KB | 137.4 KB |
| `/`, + the frozen hero | **156.8 KB** | 181.1 KB |

Ten of eleven routes pass. `/` is 36.8 KB over, and every one of those bytes is
the hero: framer-motion's runtime and feature bundle (33.2 KB brotli),
`tailwind-merge` reached through `cn()` (5.8 KB), the icon set. Phase 2 already
took what it could:

- `motion.*` → `m.*` under `<LazyMotion strict>` with a dynamically imported
  feature bundle: **−40 KB brotli** on `/` (196.8 → 156.8). `strict` means a
  future edit that reintroduces `motion.*` throws instead of silently costing
  30 KB again.
- tsParticles behind `next/dynamic`: ~200 KB raw off the initial load
  entirely.
- `next/image` out of the sticky band: −5.2 KB brotli on every route, which is
  what took the other ten routes under budget.

**The remaining 36.8 KB needs the hero rewritten, and §0.2 freezes the hero
through Phase 2.** Options for Phase 3, which owns the hero:

1. **Accept 156.8 KB on `/`.** It is 1.9 s LCP and 0.0000 CLS as measured; the
   number is over the budget, the page is not slow.
2. **Replace framer-motion in the hero with CSS.** The beams are linear
   translate loops, the sparkle fade is an opacity transition, the dock's
   magnification is the only part that genuinely needs pointer maths. Estimated
   ~33 KB brotli back, putting `/` at roughly 124 KB — still over.
3. **Restate the budget.** A Next 16 + React 19 app-router page with *zero*
   client JavaScript is 115.4 KB brotli. A 120 KB budget leaves 4.6 KB of
   headroom for the entire site, which is a budget of "ship no client
   JavaScript". If the intent was Next 15's old reported figure, the equivalent
   target today is nearer 150 KB.

`scripts/check-js.mjs` is wired into `npm run check`, so the suite fails until
this is resolved. That is deliberate: §0.3 says never silence a failure to make
a gate pass.

### The `<h1>` cannot be the LCP element on `/`

§2.2 asks for it, and says to get there by making the heading paint sooner
rather than by delaying the portrait. LCP is decided by painted area, and the
areas are not close:

```
=== /
  LCP  1912 ms  <IMG>  193,380 px²   the portrait
       candidate 193,380 px²  <IMG>
       candidate  13,920 px²  <DIV> "Hi!I'mZUBAIRBin Shaukat"   the whole hero text block
```

The portrait is **fourteen times** the area of the entire hero text block, and
the `<h1>` alone is a fraction of that. No font preload changes which element is
largest. Both routes to fixing it — shrinking the portrait or delaying it — are
hero changes.

What was done instead is the part that was actually about speed. `priority` on
the portrait was measured both ways as §2.2 asks:

| | LCP on `/` |
|---|---|
| with `priority` | **1,912 ms** |
| without `priority` | 2,504 ms |

`priority` stays. Combined with the WebP swap and the subset fonts, `/`'s LCP
went from **3,360 ms to 1,912 ms** — a 43% improvement.

On inner pages the `<h1>` does win where it is the largest block:
`/services/gohighlevel` reports `<H1> 48,810 px²` as its LCP element.

### Inter was preloaded on every page and never rendered

Found while measuring, not looked for. `app/layout.js` carried both
`inter.className` and Tailwind's `font-sans` on `<body>`; `font-sans` won, so
every string on the site rendered in `ui-sans-serif, system-ui` while a
preloaded Inter sat unused in the cache. Confirmed in the pre-Phase-2 geometry
capture — 87 of 91 elements in the hero viewport computed to the system stack.
`tailwind.config.js` now points `font-sans` at the same variable.

Consequence for the hero contract: the two gradient badge pills are now set in
Inter rather than in whatever the operating system supplied, which changes their
width by 5–7px. It is the only geometry change in the hero and it is recorded
below.

### `bg-accent/85` generated no CSS

Tailwind's opacity modifier cannot apply to a colour declared as a bare
`var(--c-accent)`. It emits **no rule at all** — no warning, no error — so the
service pages' bullet points and the testimonial quote marks rendered with no
colour. A screenshot caught it; no check would have.

`scripts/check-classes.mjs` now extracts every static `className` in `app/` and
`components/`, escapes it the way Tailwind escapes selectors, and fails if it
produced no CSS. 529 classes, 0 missing. It was negative-tested by
reintroducing the bug.

### Two layout bugs the checks could not see

Both found by looking at screenshots, both now commented where they live:

- **`backdrop-filter` makes an element a containing block for fixed
  descendants.** With `backdrop-blur` on the sticky band, the index panel's
  `fixed inset-0` resolved against the 64px band, and the full-screen overlay
  rendered as a 64px strip. The blur moved to a sibling layer behind the
  content.
- **A positioned descendant paints above static content regardless of source
  order.** The index panel is inside the `<details>` its Close button opens, so
  at `z-40` it covered that button. The band now orders its layers explicitly:
  `-z-10` background, `z-10` panel, `z-20` controls.

- **`ch` resolves against the element's own font.** `max-w-[26ch]` on a
  `<blockquote>` at the body's 16px is 208px, not 26 characters of a 54px
  Didone — the pull quote on `/about` broke to one word per line. Every other
  `ch` measure in the codebase was audited; this was the only one on the wrong
  element.

### Smaller notes

- **`design/README.md` does not exist.** §2.1 says to read it for provenance.
  The prototype and its vendored runtime were read directly.
- **Speed Insights logs a 404 locally.** `/_vercel/speed-insights/script.js` is
  injected by the platform and only resolves on Vercel. Expected; it will not
  appear in production.
- **Five dev-dependency advisories** (`brace-expansion`, `glob`, `minimatch`,
  `picomatch`, `postcss-selector-parser`), all reachable only through
  Tailwind's own toolchain. `npm audit --omit=dev` reports **0**. Untouched:
  unrelated to this phase.
- **The 22% white step numeral was raised to 40%.** The prototype's value
  measures 1.88:1, below the 3:1 WCAG asks of large text and exactly the
  "20–30% opacity text" §2.1 says not to reintroduce. 22% is not one of the
  design note's declared tokens either — its colour table floors metadata at
  50%. At 40% it measures 3.66:1 and still reads as a quiet background numeral.

---

## The hero

Three captures, because the two intended changes should not be mixed with the
design work that had to leave the hero alone.

**Phase 2 start → fonts, assets, motion.** The one intended change:

```
### 1440x900
  geometry/typography: 96 differences — 90 of them the font-family swap to Inter,
                       6 of them the two gradient pills changing width by 5-7px
  frozen pixels      : 1.6755% differ / 0.2627% strong
    in portrait      : 1.6755% differ / 0.2627% strong
    everywhere else  : 0.0000% differ / 0.0000% strong
```

Every pixel that moved is inside the portrait's own box, and the portrait swap
from a 7.3 MB PNG to a 247 KB WebP is a locked decision in PLAN §1. Outside that
box the hero is byte-identical at 640 and 1440, and 0.0024% / 0.0019% "strong"
at 390 and 639 — two orders of magnitude under the 0.05% limit — which is the
two pills.

**Fonts, assets, motion → design port complete.** This is the gate. The whole
design landed on top of the hero without moving it:

```
### 390x844   PASS  IDENTICAL  0.0000% / 0.0000%
### 639x900   PASS  IDENTICAL  0.0000% / 0.0000%
### 640x900   PASS  IDENTICAL  0.2568% / 0.0005%
### 1440x900  PASS  IDENTICAL  0.0000% / 0.0000%
```

Including the body background changing from a full-page gradient to `#000`, the
site-wide font change, the sticky band, and the dot grid.

### The band moved into the hero

Asked for after reviewing the built site, and it is PLAN §3.4's top-right
resolution arriving one phase early. Phase 2 had rendered the band *after* the
hero, because §0.2 freezes the hero and putting anything above it moves it
down; the result was a strip of chrome hanging under the hero with the logo and
index trigger in it, which is not where the design puts them.

Three things changed together, because §3.4 says they are one control system
and not three elements to deconflict:

**The band overlays the top of the hero.** `overlay` makes it `fixed` rather
than `sticky`, so the hero keeps its full `h-dvh` and nothing is pushed down.
It also gains the design's second band state: transparent at rest — a monogram
and an index trigger floating on the hero — and fading in its surface and its
readout once you scroll past. The `data-scrolled` attribute is `"true"` in the
server HTML and only a client that has measured the scroll position may set it
false, so with JavaScript off the band keeps a legible surface everywhere.

**The social dock stopped being clipped.** It was `absolute` with `sm:top-6`,
which set no `top` at all below 640px — so the toggle fell back to its static
position inside a `flex items-center` row whose only children are both
absolute, i.e. the middle of a zero-height line, and rendered at **y = −20**
with its top half cut off by the viewport on every phone. It now anchors to
`top-0` inside a wrapper at `top-[72px]`, centred, clear of the band at every
width.

**The hero's duplicate mobile logo is gone.** The band carries the mark at
every width now, and two of them 8px apart is one too many.

The accessibility fixes ship in the same change, as §3.4 requires. Walking the
tab order turned up more than the one failure the plan names:

| | Before | After |
|---|---|---|
| Social toggle | no accessible name, no `aria-expanded`, 40px target, `neutral-400` icon on `neutral-800` | `aria-label`, `aria-expanded`, 44px, white icon |
| Five desktop dock links | **no accessible name at all** — the only text is a tooltip that renders on hover, so the tab order read as five anonymous links | `aria-label` from the title the tooltip was already showing |
| Both | `target="_blank"` with no `rel` | `rel="noopener noreferrer"` |

The closed index panel was checked at the same time and is clean: its links are
not in the accessibility tree, not in the tab order, and not clickable.

The measured cost, which is the point of having the instrument:

```
### 390x844   2.2217% differ / 0.9391% strong
### 639x900   1.3031% differ / 0.5199% strong
### 640x900   1.1880% differ / 0.4503% strong
### 1440x900  2.6910% differ / 0.9767% strong
```

`docs/phase2/after/` is the new reference. Everything else held: CLS is still
0.0000 on every route, contrast still passes on all 1,002 text elements, and
every Phase 1 gate still passes.

### The probe was wrong about what is on screen

Moving the band into the first viewport exposed it. The contract is supposed to
list what paints at scroll 0, and it was recording two things that never paint:
boxes with zero area, and the content of a closed `<details>` — which the
browser lays out beside its summary and simply does not render. The closed site
index alone was contributing 53 phantom elements.

Both are filtered now. Element counts before and after that fix are not
comparable; the pixel figures always were, which is why they are the ones
quoted above.

`scripts/visual-hero.mjs` is the instrument. It is scoped to what paints in the
first viewport at scroll 0 rather than to a DOM subtree, because Phase 2 rewrote
everything below the hero and a whole-document probe would report hundreds of
intended differences and drown the one signal that matters.

### The portrait swap, corrected mid-flight

§2.2 says to use the static import and delete the hand-written `width`/`height`.
The first attempt also replaced `h-auto` with `aspect-square`, reasoning that
`h-auto` with 700×700 declared had produced a square box.

It had not. `height: auto` uses the resource's **natural** ratio once the image
loads, not the attributes, so the box had always been 700×1244 clamped by
`max-h-[100vh]` to 700×900. Forcing `aspect-square` moved the portrait 200px
down and shrank it by 200px; the contract reported it at 15.7% of the 1440
viewport. `h-auto` stayed. The declared numbers were only ever the pre-load
placeholder — which is exactly why the layout looked right while the audit
failed.

---

## New tooling

Everything below is measured, and every measurement is reproducible.

| Command | What it proves |
|---|---|
| `npm run serve` | `next start` on :3000, killing whatever holds the port first — a stale server serving an old build is the worst failure mode a verification harness can have, and it happened once during this phase |
| `npm run check` | content → lint → build → meta → commitments → nojs → classes → js |
| `npm run check:js` | Bytes of JavaScript a browser downloads per route, raw / gzip / brotli, against the §2.3 budget |
| `npm run check:classes` | Every static Tailwind class produced a CSS rule |
| `npm run check:contrast` | Every text element on every route, composited against its real background, against WCAG AA |
| `npm run check:vitals` | LCP with its element *and every candidate's painted area*, CLS with its sources, fonts, third-party origins |
| `npm run check:hero` | The hero at four widths against `docs/phase2/after` |
| `npm run check:fonts` | Every glyph advance and kern pair in the web fonts against their masters |
| `python scripts/build-fonts.py` | Rebuilds the web fonts with the settings written down, rather than from a browser upload nobody can reproduce |

`check-nojs` also grew a navigation gate: on every page, with every `<script>`
stripped, the index must be a native `<details>`/`<summary>` and every top-level
route must be an `href` inside it. That is the new risk the design introduced,
and it is now measured rather than assumed.

---

## Ready for Phase 3

Phase 3 inherits, deliberately:

- **`/` over the JS budget by 36.8 KB**, all of it the hero, which §3.5 already
  plans to touch commit by commit.
- **The social dock's own redesign.** §3.4's collision and its accessibility
  failures are resolved, but the dock is still the component it always was — a
  64px magnifying bar on desktop and a grey toggle circle on mobile — rather
  than the design's dashed social pill. It sits below the band instead of in
  it, because a dock whose icons grow to 80px on hover does not fit inside a
  66px band. Making it the pill the design draws is the remaining part.
- **`data-vt-cover` and `data-vt-title`** on every project row, case study
  cover, post row and post title — the stable hooks §2.1 asks for so §3.2's
  shared-element transitions need no restructuring. Nothing reads them yet.
- **The dot rail**, untouched, still `aria-hidden` and inert, still waiting for
  §3.4 to decide whether it becomes a scroll-progress indicator or goes. Note
  that the band now has a real scroll-progress line, so the rail's remaining
  case is weaker than it was.
- **`tailwind-merge`, 5.8 KB brotli on `/`**, reached through `cn()` in the
  hero's client components — where its conflict resolution is never actually
  used, because no caller passes an overriding class. Left alone: the files are
  frozen and the change is not mandated.
