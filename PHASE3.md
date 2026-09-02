# Phase 3 — Motion and hero

Motion added to a site that already scored without it, and the hero's
outstanding issues closed. Every claim below is measured on this machine
against a local production build; `§0.5` reserves the absolute numbers for
PageSpeed against `https://www.zubyr.dev`, which is a launch step.

Evidence is in `docs/phase3/`:

| File | What it holds |
|---|---|
| `hero-contract.txt` | The hero at 390 / 639 / 640 / 1440, Phase 2 against Phase 3, split by region |
| `preloader.txt` | §3.3's defining test — every metric with the overlay on and off |
| `measurements.txt` | JavaScript budget, Core Web Vitals, text contrast |
| `after/` | The new hero baseline. `npm run check:hero` compares against it |
| `intro/`, `overlay/` | The intro sequence and the index overlay, captured mid-flight |

---

## Done-conditions

| | Condition | Result |
|---|---|---|
| ✅ | Lenis smooth scroll; scroll resets on route change; reduced-motion disables it | Lenis 1.3.26, loaded after hydration and **not** in any route's initial scripts. Reduced motion never downloads it. Forward navigations reset to 0; back navigations keep the restored position. |
| ✅ | Tier 1 transitions on every route change, ≤ 300 ms | React's `<ViewTransition>` in `app/template.js`. 130ms out, 260ms in, `cubic-bezier(0.22, 1, 0.36, 1)`. Verified firing on navigation. |
| ✅ | Shared element transitions on projects → case study and blog → post | Verified: the clicked row's title and cover are the only named elements, and both are paired on the detail page. **The blog pair is built and unexercised** — the only post is `draft: true`, so `/blog` renders its empty state. See "The blog pair" below. |
| ✅ | Preloader: ≤ 2.2 s, skippable, once per session, reduced-motion skips, zero markup in initial HTML | 1.615 s measured. Session cookie, never `localStorage`. Four structural claims asserted by `npm run check:preloader`. |
| ✅ | **PageSpeed identical with preloader on and off** | LCP medians 1848 ms vs 1940 ms — 92 ms apart against a 280 ms noise floor measured on the control arm itself. CLS 0.0000 vs 0.0000, same LCP element, no added LCP candidate, at 412×823 / Slow 4G / 4× CPU. And LCP is recorded **736–922 ms before the overlay exists**, in every run. |
| ✅ | `app/loading.js` deleted; nothing references it | Deleted in Phase 1 (`c7ca0b7`). `git grep` finds no reference. |
| ✅ | Top-right resolved at 390 / 639 / 640 / 1440; `button-name` passes; tap targets ≥ 44px | One control in the corner at every width. The dock is deleted, so there is no `button-name` failure to pass — the element is gone. Every social link is 44×44. |
| ✅ | Dot nav has a defined purpose or is gone | Gone, with three reasons. |
| ✅ | Hero pixel-identical apart from the deliberate nav change | **0.0000% differing pixels outside the band and the dot rail, at all four widths.** |
| ❌ | First Load JS still < 120 KB | 10 of 11 routes pass at 118.3 KB. `/` is 151.1 KB, down from Phase 2's 156.9. The remaining 33.4 KB is framer-motion and the hero components that use it. **See "The JavaScript budget" below.** |
| ⏳ | PageSpeed on prod: Performance ≥ 95, Accessibility / Best Practices / SEO 100 | Not yet deployed. Local proxies: CLS 0.0000 on every route, 1,043 text elements all clear AA, zero lint, every Phase 1 and Phase 2 gate still passing. |

---

## §3.1 — Smooth scroll

`components/SmoothScroll.js`. It renders no DOM and ships no library in any
route's initial bundle.

**Lenis is imported dynamically, not through `lenis/react`.** §3.1 says to use
the React wrapper. Measured, that costs more than it gives: `lenis/react`
imports Lenis at module scope, so the library lands in every route's initial
bundle at 4.8 KB brotli — and the inner routes sit at 118.3 KB against a
120 KB budget, so a static import puts all eleven of them over it. The
wrapper's value is its context and its `useLenis` hook, and nothing here
consumes either. `await import("lenis")` puts it in a chunk fetched after
hydration; smooth scrolling is decoration over a page that already scrolls
natively, so arriving a moment late is the right failure mode.

That is now a permanent guard rather than a note: `check-js` fails if the
Lenis library appears in any route's initial scripts. A future edit that
reaches for the React wrapper fails locally instead of in a PageSpeed run three
weeks later.

**Reduced motion never downloads it.** Lenis honours the preference on its own
— `respectReducedMotion` sets `lerp = 1`, which is no smoothing — but under the
query this component does not load the library at all. The media query is
watched, so toggling the OS setting takes effect in either direction without a
reload.

**Two distinct scroll bugs, two fixes.** Clicking a link mid-inertia let Lenis
win the next frame and land you halfway down a page you had just opened;
`stopInertiaOnNavigate` kills the animation on any link click, and an explicit
`scrollTo(0, { immediate: true })` on pathname change is the belt to its
braces. Going back is the opposite problem: the browser has restored a
position and forcing 0 would throw it away, so a `popstate` flag makes the
reset skip and re-measures Lenis instead.

### Snapping, and why there are two mechanisms

§3.1 says to "add CSS scroll-snap per section". CSS `scroll-snap-type` and
Lenis cannot both drive the same scroller: Lenis moves the document with
`scrollTo` on every frame and the browser's snap engine re-snaps after each of
those, so the two fight and the page stutters at every section edge.

So the markers are declared once — `data-snap-root` on the homepage's `<main>`,
`data-snap` on the hero and the six sections — and read twice:

- **With JavaScript off**, `html:has([data-snap-root])` turns on CSS
  `scroll-snap-type: y proximity` and the browser does it natively.
- **With Lenis running**, `html.lenis` switches that off and `lenis/snap`
  produces the same feel from inside Lenis's own loop. It is 1.8 KB brotli
  inside the already-deferred chunk.

`proximity`, never `mandatory`: several of these sections are taller than the
viewport, and a mandatory snap on a section you cannot see the end of is how a
reader gets pulled back to a boundary they were deliberately scrolling past.
Both mechanisms are off under `prefers-reduced-motion`.

The markers are attributes on elements that already existed, not wrappers
around them. A single extra `<div>` around the hero renumbers all 98 elements
the hero contract indexes and reports a hundred differences that are not
differences — which is exactly what the first attempt did.

`scroll-padding-top: 66px` on `<html>` came with this and fixes something
older: every `#heading` anchor link on the blog used to land with its heading
hidden behind the sticky band.

---

## §3.2 — Page transitions

### The API question, settled against the installed version

§3.2 says "verify against the bundled docs, sources disagree". The bundled
guide (`01-app/02-guides/view-transitions.md`) is unambiguous for 16.3.4:
**view transitions work in the App Router with no configuration**, through
React's `<ViewTransition>` imported from `react` itself, and `<Link>` accepts
`transitionTypes`. There is no `experimental.viewTransition` flag to set and
none was added — `next.config.mjs` is still empty.

`react@19.2.8` in `node_modules` does not export `ViewTransition`; Next's
vendored React does, and app code resolves to it. Confirmed by building.

### Tier 1 — every route change

A crossfade with a 10px upward lift. 130 ms out, 260 ms in after the exit
finishes, on the site's one curve. Under §3.2's 300 ms ceiling.

**It lives in `app/template.js`, and that is the interesting part.** React only
fires a `<ViewTransition>`'s `enter` and `exit` when the boundary mounts and
unmounts, and a layout does neither — the guide says so in as many words: "Put
the wrapper in each `page.tsx`, not the layout." A template is the third option
it does not mention and the right one here: Next remounts it on every
navigation, so the boundary unmounts and mounts exactly once per route change.
One file, one definition of the transition, and no page can be added without
it.

**The band does not move.** It is the one element in the same place on every
route, so it is what a reader's eye holds still. `view-transition-name:
site-band` lifts it out of the page snapshot into a group of its own, and that
group is told not to animate — the content crossfades and lifts, the chrome
does not.

`::view-transition { pointer-events: none }` so a click during the 260 ms is
not swallowed by the overlay. Reduced motion zeroes every
`::view-transition-*` duration, which the site's blanket rule cannot reach:
`*` does not match a pseudo-element the browser generates outside the document
tree.

### Tier 2 — list to detail

Every row is named, not just the clicked one. §3.2 says to "assign it
dynamically to the clicked card, since one element can hold a given name at a
time" — the constraint is real, the conclusion is not needed here, because the
name is derived from the slug and three rows hold three different names.
Assigning on click would make every row a client component and ship the whole
list as JavaScript to animate one of them.

React does the dynamic part anyway. Measured mid-transition on `/projects`:

```
before  H2:none  DIV:none  H2:none  DIV:none  H2:project-title-opencinema  DIV:project-cover-opencinema
ready   FIGURE:project-cover-opencinema  H1:project-title-opencinema
```

Only the clicked row is named — that is `default="none"` doing what §3.2 asks
for, without a click handler.

The names come from `lib/view-transitions.js` and both ends import them. A
shared-element transition is a string match: if the two differ by a character
it does not fail, it silently does not morph, which is the worst shape a bug
can have.

**Prefetching matters and the docs say why.** "The morph plays when the
destination content renders in the same commit as the navigation, which is the
case with prefetched pages." Measured: clicking a case-study link on the
homepage without scrolling to it first produced no morph; the same click after
the row had entered the viewport — which is when Next prefetches, and is also
the only way a reader could have clicked it — morphed correctly.

**Partial Prefetching and Cache Components were evaluated and not adopted.**
§3.2 suggests pairing with them. Every route here is prerendered static; the
bundled `link.md` says `prefetch` defaults to fetching the *full* route
including its data for static routes, so navigations are already instant and
there is nothing for Partial Prefetching to improve. `cacheComponents: true` is
a migration with real risk and no measurable gain on a site with no dynamic
segment.

### The blog pair

Built, symmetric with the projects pair, and currently unexercised: the single
post in `content/blog/` is `draft: true`, so `/blog` renders its empty state
and there is no row to morph from. It will work the day a post is published,
and the projects pair — identical code through the same helper — is verified
working.

### Tier 3 — the index overlay

§3.2's rule is that nothing may take longer than 300 ms, because the reader has
already decided to go somewhere. The overlay is the exception it names, and
this one runs about 900 ms: the panel wipes down from under the band, the
purple wash fades up behind it, the eight routes rise one after another, and
the contact row arrives last.

Four CSS animations and no JavaScript. The index is a native `<details>`, so
its children go from `display: none` to laid out when it opens and a CSS
animation on a newly displayed element starts from its first frame. No state,
no `AnimatePresence`, no hydration — and it works with scripting disabled,
which is where this navigation has to work.

The stagger tightened from 70 ms to 55 ms and now starts at 260 ms, where the
panel wipe ends. Eight rows at 70 ms put the last one 490 ms behind the first,
and a reader looking for "Contact" was watching a queue.

**Lenis is stopped while the panel is open.** `overflow: hidden` on the body is
the whole lock when the browser owns the scroll; Lenis does not read it and
would keep scrolling the page under a full-screen overlay. Both are applied,
because Lenis is absent under reduced motion and before hydration and the body
rule is what holds in those cases. Verified: a 900px wheel event over the open
panel moves the page 0px.

---

## §3.3 — The intro overlay

1.615 s, first visit per session, and structurally incapable of affecting the
metrics.

### The sequence

Boot lines type in top-left while a counter climbs bottom-right; the name wipes
up glyph by glyph in the Soria the hero has already preloaded, with two
hairlines drawing outward under it; the counter reaches 100, holds a beat, and
the ground leaves as three vertical panels sliding up on a 60 ms stagger. The
hero's own lockup settles `y: 20 → 0` timed to finish on the same millisecond
as the last panel — 20 ms + 440 ms against 2 × 60 + 340 — so the reveal and the
hero's entrance read as one move rather than a curtain followed by an entrance.

The counter hesitates at 87 before snapping to 100. §3.3 asks for it, and it is
the detail that makes the number read as a measurement rather than a tween: a
number that climbs smoothly to 100 is a progress bar with no progress behind
it, and everyone knows it.

The four boot lines are honest — they are four things the page actually did, in
order, and the last one is true before the overlay is visible. A fake progress
log reads as a lie the second time somebody sees it.

### 1.6 s, not 2.2

§3.3 offers the choice and gives the reason: the original concept existed to
mask a Three.js warm-up, and there is no Three.js here. The only warm-up this
could hide is tsParticles, which is dynamically imported and fades itself in
over a second regardless. There is nothing to conceal, so the sequence is paced
to be watched once rather than to fill a gap.

### No GSAP

§3.3's constraint is "pure DOM, CSS, GSAP. No canvas, no images, no fonts of
its own". It is pure DOM and CSS, and there is no GSAP.

Measured before deciding: `gsap.min.js` is 25.1 KB brotli and `ScrollTrigger`
another 15.8, against a route already 31 KB over the §2.3 budget. Every
movement in the sequence is a keyframe with a delay, which CSS does natively.
The one thing CSS cannot express is the counter's hesitation, and that is
fifteen lines of `requestAnimationFrame` writing to a single text node — no
React state changes per frame, so it cannot show up in Total Blocking Time.

The constraint's purpose is that the overlay must be weightless. Not shipping
40.9 KB to satisfy the letter of it is the stronger reading. `gsap` and
`@gsap/react` were installed, measured, and uninstalled.

### The three bugs the instrument found

`scripts/check-preloader.mjs` was written to prove the on/off equality and
found three real defects on the way. All three were invisible in the finished
page.

**1. The hero was briefly unhidden and uncovered.** The first version set
`data-intro="playing"` on `<html>` in the same callback as `setShow(true)`.
Measured, there was a frame where the attribute was on the document and the
overlay had not yet been committed — the hero rendered with its name missing
and nothing over it. The flag moved to a layout effect, which runs after React
has mutated the DOM and before the browser paints, so the overlay and the rule
that hides what is behind it become true together.

**2. The overlay could appear before the page's LCP was recorded.** This is the
one that matters. The first version waited one animation frame after hydration.
On three runs in seven, hydration finished up to 393 ms *before* the portrait
painted, so the overlay existed while the page's LCP element had not been
painted yet — the "gate in front of content" shape, from a component written
specifically not to be one.

The mount is now gated on the browser having recorded the `largest-contentful-paint`
entry. The metric §3.3 protects is written down before anything is drawn over
it, and the check asserts the ordering per run rather than inferring it.

The obvious second signal — `load`, whichever comes first — was tried and
removed. Measured, `load` can fire long before first paint (685 ms against a
first paint at 1728 ms in headless Chrome), and racing the two put the overlay
back in front of an unpainted page on exactly the slowest runs. A fallback that
fires early is not a fallback. `load` remains the path for an engine with no
`largest-contentful-paint` entry type — Safari — which is also an engine where
there is no LCP metric for the overlay to disturb.

**3. The counter's clock started too early.** It timed from the effect rather
than from the first frame it was painted in, so on a cold load — where the
particle engine and the motion bundle are both arriving — its first visible
value was 087. The climb and the hesitation had already happened, off screen.

### The defining test

```
5 runs per arm, interleaved, first pair discarded
412x823, Slow 4G, 4x CPU — the same emulation as check:vitals

                   LCP median   LCP spread   CLS median   LCP element
  preloader off        1848 ms       280 ms       0.0000   img
  preloader on         1940 ms       380 ms       0.0000   img

  ok  LCP is recorded before the overlay exists, in every run
      5/5; margins 816, 922, 785, 736, 749 ms
  ok  LCP difference is inside the control arm's own noise
      92 ms apart, tolerance 280 ms (the off arm's own spread)
  ok  the overlay adds no LCP candidate
  ok  CLS identical  —  0.0000 vs 0.0000
  ok  LCP element identical  —  img vs img
```

That is one run of it, recorded in `docs/phase3/preloader.txt`. Across every
run of this check the two medians have landed within the control arm's spread
and the ordering assertion has been 5/5 or 7/7 — the LCP is written down
between 736 ms and 1195 ms before the overlay exists, depending on how slow the
machine was, and never after.

Plus four structural claims: zero preloader markup in the prerendered HTML;
under `prefers-reduced-motion` nothing mounts, no attribute is set and no
cookie is written; the second view in a session has no overlay; and the
overlay's own text clears WCAG AA at 5.28:1.

**The tolerance is measured, not chosen.** An early version of this check
failed on a 200 ms gap that reversed sign on the next run — locally, LCP equals
FCP on every load and what it records is mostly how busy the machine was. A
fixed tolerance against that either fails at random or would pass a real
regression, so the tolerance is the control arm's own spread: the arms must
differ by less than the preloader-off arm differs from itself.

**It runs throttled.** The first version measured at 1440×900 with no
throttling and passed comfortably — while measuring the wrong machine. An
overlay's cost is a main-thread cost, and 4× CPU is where it would show.

### The suppression mechanism is the product's own

`lib/intro.mjs` exports the cookie name and is imported by the component, by
`check-preloader`, by `visual-hero` and by `check-contrast`. There is no
test-only "off" branch that could drift from the real one, and a rename cannot
leave a test silently suppressing nothing.

`visual-hero` and `check-contrast` set it because both would otherwise be
non-deterministic — a contrast gate that samples a different set of elements
depending on how busy the machine was is not a gate. The overlay's own colours
are audited deliberately, while it is on screen, by `check-preloader`.

---

## §3.4 — The top-right, resolved as one control system

§3.4 asks for one answer to three problems rather than three deconflictions.
The answer is the design's own: view 01.1 draws the resting band as monogram ·
social pill · Index, and captions the condensed state "section readout replaces
the pill on scroll".

| Problem | Resolution |
|---|---|
| Two controls claiming the top-right at 390px | One control in the corner at every width: the Index trigger. The socials moved to the middle of the band, the only place nothing else wants. |
| The dock rendering as a bare unlabelled square | Deleted, with `components/ui/floating-dock.js` and `app/Components/floating.js`. A 64px magnifying bar whose icons grow to 80px was never going to fit a 66px band. |
| The dot rail stranded over the portrait | Deleted. |

**The dot rail goes, for three reasons.** The band already has the
scroll-progress indicator the design specifies — a 1px gradient hairline, the
only place the design note allows the gradient to run edge to edge — so
promoting the rail would have been a second answer to a question already
answered. It overlapped the portrait at 390 and 639. And its five dots were
labelled hero / about / projects / testimonials / contact: three of those
sections no longer exist under those names. It was not a control that had lost
its handler; it was a diagram of a site that is not this one.

**The pill and the readout swap on the readout, not on scroll.** `peer` on the
readout, `peer-[:not(:empty)]:hidden` on the pill. The obvious mechanism is the
band's `data-scrolled` attribute, but it flips at 8px while the readout does
not fill until a section crosses a third of the way down the viewport — keying
the pill to it blanks the centre of the band for most of the hero's height on
the way past. This hands the slot over at the exact moment there is something
to hand it to, and it does the same thing with JavaScript disabled, where the
readout is empty forever and the pill simply stays.

**44×44, and the band did not grow.** The band is 66px tall with 10px of
padding, so a control inside it has 44px to work in, and a bordered pill with
44px links inside would be 46px. The dashed border is drawn as an `outline`
with a negative offset — painted, not laid out — so each link is a full 44×44
and the band is still exactly 65px at all four widths. Measured.

Below 480px the pill is not rendered; the band has room for the monogram and
the Index trigger and nothing else. The socials are not the pill's to own
anyway: the index overlay now lists all four with 44px rows, and the footer
lists them again. Both work with JavaScript disabled. A phone loses the pill
and loses nothing.

Each chip is `aria-hidden` and each link carries an `aria-label`. Two mono
characters are a logo, not a name — "gh" read aloud is not "GitHub", and the
previous dock's five anonymous links were exactly this mistake made with icons.

**One entity inconsistency closed with it.** The dock linked a Facebook profile
that appeared in no `sameAs` and in no footer — the one place on the site where
the entity set said one thing and the UI said another. `site.socials` is now
the only list of profiles that exists.

---

## §3.5 — The hero commit sequence

Items 1 and 2 (font loading, portrait swap) were done in Phase 2. Item 3 is
§3.4 above. Item 4 was tried and reverted.

### `will-change: opacity` was measured and removed

§3.5's fourth item is `will-change: opacity` on the pulsing blob and the two
dots, described as "layer promotion, invisible, cheap". Two of those three
words hold.

The instrument was first shown to have a zero noise floor — two consecutive
captures of the same build differ by 0.0000% at all four widths. Against that:

```
with `will-change-[opacity]`   0.1168% strongly-differing pixels at 639x900,
                               0.0068-0.0091% at the other three widths
without it                     0.0000% at all four
```

Promoting the blob to its own compositor layer changes how an 80% gradient is
blended against the ground. Nothing moves and nothing resizes — the geometry
probe is identical either way — but pixels change, and §3.5's own
done-condition is that the hero is pixel-identical apart from the deliberate
nav change. A commit whose stated justification is that it is invisible does
not get to break that when it turns out not to be.

The hint also buys less than it appears to: opacity animations are already
promoted and run on the compositor in every current engine, so `will-change`
moves that promotion earlier rather than creating it. The measurement and the
reasoning are recorded in `app/Components/DP.js` where the class would have
gone, so the decision is visible to the next reader rather than absent.

### The hero contract

```
                         all pixels        in band+dock      in dot-rail    everywhere else
  390x844    0.6362% / 0.6003% strong   0.4764% / 0.4508%   0.1598% / 0.1495%   0.0000% / 0.0000%
  639x900    1.9810% / 0.4238% strong   1.8896% / 0.3382%   0.0915% / 0.0856%   0.0000% / 0.0000%
  640x900    2.0446% / 0.4566% strong   1.8866% / 0.3399%   0.1580% / 0.1167%   0.0000% / 0.0000%
  1440x900   2.2340% / 0.5761% strong   2.1638% / 0.5242%   0.0702% / 0.0519%   0.0000% / 0.0000%
```

**Zero differing pixels outside the two strips §3.4 changed, at every width.**
The lockup, the portrait, the violet blob, the badge pills, the divider glow
and the particle field are byte-identical to Phase 2. `docs/phase3/after/` is
the new baseline and `npm run check:hero` compares against it.

`visual-hero.mjs` grew multi-region support to produce that table. Phase 3
changed two separate places in one frame, and a single bounding box around both
would have been most of the hero, which proves nothing.

### The fourth `<h1>`, closed

§0.2 froze the hero until Phase 3, and `check-meta` has been pinning `/` at
four `<h1>` elements since Phase 1 with a note saying so. The freeze lifts here.

`HeroText` renders a mobile and a desktop variant — both always in the HTML,
because the switch is CSS — and each contained the `HelloCard` "Hi!" badge,
also marked up as an `<h1>`. The badge is a `<p>`, the desktop lockup is a
`<p>`, and the heading is the mobile variant's: Google indexes mobile-first, so
the crawl that decides how this page is understood renders at a phone width
where that lockup is the visible one. Whichever variant is demoted becomes a
`display: none` element in the other layout; putting the surviving heading
where the indexing crawler can see it painted is the version of that trade with
something to gain.

Tailwind's preflight already sets `font-size: inherit; font-weight: inherit` on
every heading level, so the tag swap is a zero-pixel change — verified: the only
differences the contract reported were the tag names themselves, with identical
geometry. `KNOWN_H1_COUNTS` in `check-meta.mjs` is now empty rather than
deleted: an empty exception list states that there are no exceptions, where no
list at all only states that nobody wrote one.

---

## The JavaScript budget

The one failing condition, and the only one.

```
route                         chunks     raw    gzip  brotli   budget
/                                  9   568.4   174.5   151.1   OVER
/about  … /blog/idempotency-keys   7   463.7   138.1   118.3     ok
/contact                           7   468.5   139.6   119.6     ok
```

Phase 2 handed over `/` at 156.9 KB. Phase 3 added Lenis (deferred, 0 KB
initial), the view-transition layer (0 KB — `<ViewTransition>` is a React
built-in and the animations are CSS), the intro overlay (1.2 KB) and the social
pill (server-rendered), and recovered 7 KB:

| | |
|---|---|
| `tailwind-merge` removed from `cn()` | −5.8 KB on `/` |
| `@tabler/icons-react` removed with the dock | −2.0 KB on `/` |
| `gsap`, `@gsap/react` | installed, measured at 40.9 KB, uninstalled |
| Islands added (SmoothScroll, template, preloader) | +0.5 KB every route, +1.7 KB on `/` |

Phase 2 recorded that `tailwind-merge`'s conflict resolution was never actually
used, and left it because §0.2 froze the files that reach it. Checked again
before removing it: every call site passes a base class list and an optional
override, and no override collides with the base. If a future caller does
introduce one, clsx keeps both classes and the cascade decides, which is
Tailwind's documented behaviour and not a silent failure.

**What is left is attributable to one thing.** The homepage's 33.4 KB above the
shared baseline, chunk by chunk:

```
0shbdydncz_dh.js   18.5 KB brotli   framer-motion
091fgd8dil18r.js   13.9 KB brotli   framer-motion features, the beams, the preloader
2pduq9-c4u_gn.js    0.9 KB brotli   page code
```

`/` reaches 118.7 KB and clears the budget if — and only if — framer-motion
leaves the hero. Two components use it: the sparkles fade, which is five lines
of CSS to replace, and `background-beams-with-collision.js`, which is not.

**That was considered and not done.** The beams are seven looping translates
with per-beam durations and repeat delays, plus collision detection and a
twenty-particle burst. The looping part is a CSS keyframe; the collision is
seven `setInterval`s calling `getBoundingClientRect()` on three elements every
50 ms — 420 forced layout reads per second, permanently, which is a real
main-thread cost independent of the bundle. Rewriting it is a genuine
improvement on both axes.

It is not done because it cannot be verified. `visual-hero.mjs` hides the
beams' collision debris and the particle canvas in order to be deterministic at
all, so a rewrite of exactly those layers is the one change the instrument
cannot measure — and "hero pixel-identical" is a Phase 3 done-condition. It is
not in §3.5's commit list either. Doing it blind, in the phase whose gate is
pixel identity, is the wrong order of operations.

The decision it leaves is a real one and it belongs to the owner: **31 KB and a
permanent 420-reads-per-second layout cost on the homepage, against rewriting
the beams without a pixel instrument that can see them.** The alternative worth
considering first is extending the instrument — a seeded, frame-pinned capture
of the beams — which would make the rewrite verifiable and is a day's work
rather than a gamble.

---

## New tooling

| Command | What it proves |
|---|---|
| `npm run check:preloader` | §3.3's defining condition: every metric with the overlay on and off, at 412×823 / Slow 4G / 4× CPU, plus four structural claims and the LCP ordering |
| `npm run check:js` | Now also fails if a library that must be deferred — Lenis today — appears in any route's initial scripts |
| `npm run check:hero` | Compares against `docs/phase3/after`, and `compare` now accepts more than one region per viewport |

Every Phase 1 and Phase 2 gate still passes: `check-content` 42/42,
`check-meta` 292/292, `check-commitments` clean, `check-nojs` 147/147,
`check-classes` 562/562, `check-contrast` 1,043 elements 0 below AA,
`check-fonts` 32/32, `npm run lint` zero errors and zero warnings, CLS 0.0000
on every route.

---

## Ready for launch

Phase 4 is off-site work — profile links, `sameAs` reciprocity, Search Console
— and needs nothing from the repository. Two things go with it:

- **`/` is 31 KB over the JavaScript budget**, all of it framer-motion in the
  hero, with the decision written up above.
- **The blog's shared-element transition is unexercised** until a post is
  published. `content/blog/idempotency-keys.mdx` is `draft: true` because §1.6
  says the copy is not in Zubair's voice yet; the transition, the row, the
  index and the `Article` schema are all built and waiting for it.

---

# Review follow-up

Six issues from review. Each is diagnosed below before its fix, because two of
them had causes that were not what they looked like.

## 1. The index overlay animated only on the first open — CAUSE

**A closed `<details>` freezes its animations instead of removing them, and a
CSS animation that has already finished never restarts.**

Measured on the closed panel, before it had ever been opened:

```
closed           panelAnims: ["panel-wipe:running@0"]     display: flex
open  #1 @60ms   panelAnims: ["panel-wipe:running@49"]    clip-path: inset(0 0 46.5%)
open  #1 settled panelAnims: ["panel-wipe:finished@340"]  clip-path: inset(0 0 0%)
closed again     panelAnims: ["panel-wipe:finished@340"]
open  #2 @60ms   panelAnims: ["panel-wipe:finished@340"]  clip-path: inset(0 0 0%)
```

The animation exists while the panel is closed and its clock reads zero. Chrome
renders closed `<details>` content into `::details-content` with
`content-visibility: hidden`, which *skips* the subtree rather than destroying
it, and a skipped subtree's animations are frozen, not removed. The first open
let the clock run. The close froze it at `finished`. Every later open unfroze an
animation already filling its end state — so nothing moved, at `currentTime`
340, for the rest of the page's life.

This is not the `display: none` case, which is the one everybody assumes. A CSS
animation restarts when its element re-enters the box tree from `display: none`,
or when `animation-name` changes; `content-visibility: hidden` does neither, and
a `<details>` toggle never remounts anything. **There is no arrangement of CSS
classes on that element that plays on every open.**

**Fix.** The motion moved to `components/IndexBehaviour.js` and the Web
Animations API, where `element.animate()` constructs a new Animation on every
call and replay is the mechanism rather than something the mechanism has to be
tricked into. The usual workaround — strip the class, force a reflow, re-add it
— is a synchronous layout on every open, which is the thing issue 6 is about not
doing. Verified over three open/close cycles and a rapid open/close/open:

```
open  #1  translateY -900 -> 0, 31 distinct values    close #1  0 -> -900, 30 distinct
open  #2  translateY -900 -> 0, 31 distinct values    close #2  0 -> -900, 26 distinct
open  #3  translateY -900 -> 0, 36 distinct values    close #3  0 -> -900, 30 distinct
```

## 2. The overlay comes down, and leaves the same way

A panel descending from the top edge and retracting through it. **337ms open,
343ms close**, measured from click to the last animation settling, against the
400ms ceiling.

```
open    panel   0 - 300   translateY(-100%) -> 0
        wash    0 - 300   opacity 0 -> 1
        links  60 - 304   opacity and translateY(-14px), 12ms apart, 160ms each
        foot  200 - 340

close   links   0 - 190   reverse order, 10ms apart, 120ms each
        foot    0 - 120
        wash  100 - 340
        panel 100 - 340   0 -> translateY(-100%)
```

Everything is on `cubic-bezier(0.22, 1, 0.36, 1)`. The links start while the
panel is still arriving, so the routes ride down with it rather than queueing
behind it; on the way out they leave first and the panel follows, which is the
same order reversed and is why the close does not read as a different animation.

`prefers-reduced-motion` cuts it to an instant show and hide — verified: the
panel has zero animations and no transform, and the second click closes it
immediately. That is the native `<details>` behaviour, which is also what a
browser with JavaScript disabled gets.

Closing had to be intercepted to exist at all: a `<details>` closes
synchronously on click, leaving no frame in which its contents are still
rendered, so `preventDefault()` on the summary and `open = false` after the
animation is the only way an exit can run.

## 3. The social pill is now on every page, at every width

The readout used to replace it. Wrong trade, for a reason that is not visual:
those four links are the only rendered corroboration of the `sameAs` array in
the Person schema, and an entity signal present for the first screenful of one
route is weaker than one present on all eleven.

The band is a three-column grid now — `1fr auto 1fr` — so the pill sits on the
viewport's midline at every width regardless of what flanks it. Measured, the
pill's centre is the viewport centre at 360, 390, 480, 639, 640, 768, 1024 and
1440, there is no horizontal overflow at any of them, and the band is still
exactly 65px tall.

The room came from two places, in this order:

- **The readout moved to the left, beside the monogram, from 768px up.** Below
  that it is not rendered. Nothing is lost: every page prints the same ledger
  number in the eyebrow above its own `<h1>`, and on the homepage the readout is
  empty until a section is in view anyway.
- **The Index trigger loses its word below 480px** and becomes a 44×44 control
  carrying the two-bar glyph. Its accessible name is still "Site index" from
  `aria-label` and `aria-expanded` still announces its state, so nothing is lost
  to assistive technology — only a word beside a glyph that already means menu.
  That bought the 66px the pill needed at 390.

Every chip is still exactly 44×44. Lighthouse also caught a WCAG 2.5.3 failure
in the pill while this was being measured — `label-content-name-mismatch` on the
GitHub and Instagram chips, because "github" does not contain "gh" and
"instagram" does not contain "ig" as runs of characters. The accessible names
are now `"gh GitHub"` and `"ig Instagram"`; the audit scores 1 with zero items.

## 4. The intro never appeared — CAUSE

**React Strict Mode, which `next dev` enables by default, made the guard read a
cookie it had just written.**

The decision used to be taken inline in the mount effect: read the media query,
read the cookie, write the cookie, arrange to mount. Strict Mode deliberately
runs every effect twice on mount — body, cleanup, body again. The first body
wrote `zb_intro=1`. The second body read that cookie, concluded the session had
already seen the intro, and returned before arranging anything.

Measured on the same commit:

```
next dev     cookie-set:zb_intro=1@607ms   overlay never mounts
next start   cookie-set:zb_intro=1@207ms   overlay mounts@239ms, plays
```

So it worked in production the whole time and could never work in development —
exactly the shape of a bug a reviewer sees and a check does not, because
`check-preloader` runs against a production build.

Neither of the other two candidates was involved. The LCP gate fires normally in
dev (entry at 1036ms), and reduced motion was not matching.

**Fix.** The decision is a memoised value computed once for the life of the
module, so a second invocation gets the same answer as the first rather than
re-deriving it from a side effect it just caused. The cookie write moved to the
layout effect that mounts the overlay — which also closes a smaller latent bug:
a visit that ended in the 200ms before the paint was recorded used to spend its
one showing without showing anything.

**`?intro=replay`**, development only. `process.env.NODE_ENV` is inlined by the
bundler, so in a production build the function is a constant `false` and the
query string is never read — the switch does not exist in the shipped bundle
rather than existing and being declined. It does not override reduced motion,
which is checked first.

```
dev, first visit                          overlay PLAYS
dev, ?intro=replay with cookie set        overlay PLAYS
dev, ?intro=replay + reduced motion       no overlay
prod build, ?intro=replay with cookie     no overlay
```

To see it against a production build or a deployment, open a new private
window — that is a new browser session, which is the condition it keys on.

Every §3.3 constraint still holds: `check-preloader` passes unchanged, LCP
median 1700ms with the overlay on and 1700ms with it off, CLS 0.0000 both, and
the LCP is recorded 1047–1119ms before the overlay exists.

## 5. The route curtain

A single opaque panel in the page's ground colour with the brand gradient as a
one-pixel leading edge. It descends over the outgoing page, holds a beat, and
continues downward off the bottom to reveal the incoming one. **170ms down,
90ms hold, 200ms out — 460ms by design, measured at 451–462ms on every route.**

The design decisions, since the brief asked for them:

- **One panel, not staggered columns.** The index overlay already descends from
  the top edge; making the route change do the same gives the site one vertical
  vocabulary — chrome arrives from above — instead of two unrelated effects.
  Columns fragment the screen and read as decoration; a single sheet reads as a
  cut.
- **The brand gradient, as a 1px leading edge, not a fill.** The design note's
  gradient rule is "always a line, mask or single CTA; never a fill". A
  full-bleed gradient curtain would be the one thing the design system forbids.
  The hairline sweeps down the viewport on the way in and again on the way out,
  which is the same gradient-as-a-line language as the scroll-progress bar.
- **No logo.** At 460ms a centred mark is on screen for about a third of a
  second — long enough to register as a flicker, not long enough to read as
  branding. The gradient edge carries the identity.
- **Ground colour, not a tint**, so the moment of covering is invisible and what
  you see is the edge moving rather than a box appearing.

It is `pointer-events: none`, `aria-hidden`, and appended after hydration, so no
route's HTML contains it, it cannot eat a click, and it cannot delay a paint.
Under `prefers-reduced-motion` the element is never created at all.

### The two things that had to be measured

**The view transition was freezing it.** The first working version ran 665ms
with a 337ms plateau in the middle of the descent. A view transition replaces
every element with a static snapshot for its duration, and the curtain is an
element — so the panel was a frozen image for the length of the tier 1
crossfade. Isolated:

```
curtain + view transition    longest frame gap 161ms
view transition disabled     longest frame gap  26ms
curtain removed              longest frame gap  37ms
```

Neither alone is expensive; the combination is. So ordinary navigations no
longer run one. `app/template.js` is deleted, the two list-to-detail links carry
`transitionTypes={["morph"]}`, and every view-transition pseudo-element defaults
to zero duration with the morph rules reinstated under
`:active-view-transition-type(morph)`. Verified: `about → contact` and
`projects → about` start **zero** view transitions; `projects → case study`
starts one and still pairs `H1:project-title-opencinema` with
`FIGURE:project-cover-opencinema`. Tier 2 is unchanged.

**The hold was main-thread-bound.** Chained as three animations — descend,
`await`, `setTimeout`, exit — it measured 769ms with a 386ms gap. None of that
was animation: a client navigation commits a new page, and while React renders
it the main thread is unavailable, so every seam between the three steps waited
for the navigation it was supposed to be covering. Expressed as one animation
with four keyframes it is handed to the compositor once and runs to its stated
duration whatever the main thread is doing. It also means the curtain no longer
subscribes to anything.

## 6. Performance, measured properly

The full record is `docs/phase3/performance.txt`. The dev-server report is
discarded.

**Production is running Phase 1.** Fingerprinted from the served HTML: four
`<h1>` elements, no `site-band`, no `dot-grid`, no `outline-dashed`. Phase 2 and
Phase 3 are uncommitted. So the prod reading is a true re-baseline of what is
live, and it is not a measurement of this work — and 6b's "only against real
prod findings" cannot be satisfied for Phase 3 code until it is deployed.

**PageSpeed Insights returns 429** — "Quota exceeded for quota metric 'Queries'
and limit 'Queries per day'" on the shared anonymous project, and there is no
API key in the repository. These are Lighthouse 12.8.2, the same engine PSI
runs, with the same audits and the same mobile emulation, via the new
`npm run lighthouse`.

```
                          Perf  A11y  Best   SEO      FCP      LCP      TBT      CLS       SI
prod, phase 1   mobile      71    95   100   100    1.4 s    4.1 s   300 ms    0.178    2.9 s
                desktop     96    96   100   100    0.3 s    0.6 s     0 ms    0.125    0.9 s
local, phase 3  mobile      84   100    96   100    1.3 s    4.2 s   140 ms    0        1.6 s
                desktop     99   100    96   100    0.7 s    0.9 s    10 ms    0        0.9 s
```

**CLS 0.178 on production is reproducible, not an outlier.** PLAN §2 called it
"an unreproducible outlier" and recorded CLS as 0 across runs; against the
deployed site it is 0.178 on mobile and 0.125 on desktop, exactly the figure the
review quoted. The local Phase 3 build is 0.0000 on every route.

Best Practices 96 locally is one console error — a 404 on
`/_vercel/speed-insights/script.js`, a path that only exists on Vercel's edge.
It is the only error either run logged; production scored 100 there.

### Where the LCP time actually goes

```
                    TTFB    Load Delay   Load Time   Render Delay
prod (phase 1)     981ms      1195ms      1646ms        267ms
local (phase 3)    451ms         0ms         0ms       3680ms
```

Two different problems wearing the same number. On production it is image bytes
— a 7.3 MB PNG discovered late. Phase 2 fixed that: the local build fetches a
35 KB WebP with zero load delay. What is left is render delay, and render delay
is main-thread JavaScript.

### The four items in 6b

| | Verdict |
|---|---|
| `fetchpriority="high"` on the LCP preload | **Not applied.** Next emits the preload without it, but `prioritize-lcp-image` already scores 1 and Load Delay is 0ms / 0%. There is no delay left to remove, and adding it by hand means a second, duplicate preload. |
| Tighten `sizes` to ~330px on mobile | **Not applied — the premise does not survive measurement.** At 412×823 / DPR 1.75 the browser requests `w=640` and downloads 35,016 bytes of WebP, and `uses-responsive-images` scores 1. 80vw of 412 is 330 CSS px, which is 577 device px at 1.75×, so 640 is the first srcset entry that covers it. Forcing 330 upscales the site's one photograph 1.7× to save roughly 15 KB. |
| Update browserslist | **Tested, then reverted — it does not work.** `["chrome 120","edge 120","firefox 120","safari 17"]` moved byte totals by 0.1 KB and the polyfills were still present. The audit points at `next/dist/build/polyfills/polyfill-module.js`, which Next injects unconditionally; browserslist governs the `nomodule` split and CSS targets, not this. It is **1.3 KB raw, 0.5 KB brotli** — Lighthouse's "13 KiB" is its model of what those five features would cost from core-js, not what ships. |
| Forced reflow | **Present, and now quantified.** `Element.prototype.getBoundingClientRect` over five settled seconds at 412×823: `/` makes **1,221 calls — 244 per second, permanently**; `/about` makes **zero**. All of it is three call sites in the beams' collision detection: seven `setInterval(50ms)` timers each reading three rects, while framer-motion animates the same elements every frame, so the layout is dirty at every read. Style & Layout is 1.6s of the 5.8s main-thread total. Not fixed here — it is the same component that holds framer-motion, and the one change `visual-hero.mjs` cannot verify. |

### 6c — Lenis and tsParticles, re-measured

An A/B on a production build rather than an attribution: Lighthouse with and
without `--force-prefers-reduced-motion`, which stops Lenis being downloaded at
all (verified — the chunk is not requested). Three runs per arm, medians:

```
              Perf     FCP      LCP     TBT    CLS      SI   scriptEval  style+layout  mainThread
motion on       86    1203    3957     147  0.000    1563        2032          1602        5822
reduced         86    1203    3917     144  0.000    1566        2034          1590        5951
```

Identical. Same score, FCP to the millisecond, LCP 40ms apart, TBT 3ms, script
evaluation 2ms — and the main-thread total is *higher* without the motion layer,
which is the size of the noise.

**Lenis costs nothing measurable, and is staying.** The dev report was wrong
twice over: the dev bundle, and the attribution model. Lighthouse's `bootup-time`
audit charges rAF-scheduled rendering work to the script that scheduled it, so
any rAF loop running for the length of a trace accumulates the page's own
rendering time under its name — which is why the Lenis chunk showed "2029ms
total / 386ms scripting" while removing it changes nothing.

The main-thread cost is in both arms, and it is the hero: framer-motion,
tsParticles, and 244 forced layouts per second from the beams.

## What this cost, and the guards

Every route is back to the byte figure it had before this follow-up:

```
/         151.1 KB brotli   OVER — unchanged, the inherited hero problem
inner     118.3 KB          was 118.3
/contact  119.6 KB          was 119.6
```

The curtain, the overlay choreography and the always-on pill ship at **zero net
cost**, paid for by replacing `<SpeedInsights />` from
`@vercel/speed-insights/next` with the script it injects. That wrapper measured
1.0 KB brotli on every route, and `/contact` has 0.4 KB of headroom — it was the
difference between every route passing `check-js` and two of them failing it.
What the wrapper does that the script does not is group dynamic routes under
`/projects/[slug]`; this site has four dynamic URLs, where four rows is more
useful than one grouped row. Reverting is a reinstall, one import and one
component.

`app/template.js` is deleted and `@vercel/speed-insights` is uninstalled.

**Hero contract.** `docs/phase3/hero-contract.txt` carries both comparisons. The
follow-up changed the 72px band and nothing else:

```
                     band            everywhere else
  390x844     3.0231% differ      0.0000% / 0.0000% strong
  639x900     0.9023% differ      0.0000% / 0.0000% strong
  640x900     0.9314% differ      0.2568% / 0.0005% strong
  1440x900    0.4140% differ      0.0000% / 0.0000% strong
```

The 640 residual is a deterministic sub-threshold difference at the `sm:`
breakpoint that predates this follow-up — it is identical in the Phase 2
comparison and the follow-up comparison — and it is 0.0005% strong against a
0.05% limit.

**Every guard.** `check-content` 42/42, `check-meta` 292/292,
`check-commitments` clean, `check-nojs` 147/147, `check-classes` 564/564,
`check-contrast` 1,083 elements 0 below AA, `check-fonts` 32/32,
`check-preloader` OK, and `check-js`'s deferred-library guard still reporting
Lenis in no route's initial scripts, with one route over budget — the same `/`
that was over before. `npm run lint` zero errors, zero warnings.
