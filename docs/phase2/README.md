# Phase 2 evidence

Read `PHASE2.md` at the repository root first; this is the material behind it.

## The captures

`scripts/visual-hero.mjs` wrote four sets, at 390×844, 639×900, 640×900 and
1440×900. Each holds `frozen-*.png` (every animation pinned to its end state,
the two irreducibly random layers hidden), `geometry-*.txt` (position, size,
font, weight and colour of every element painting in the first viewport) and
`console.json`.

| Directory | State |
|---|---|
| `before/` | Phase 1 as it stood, before any Phase 2 edit |
| `after-assets/` | After the fonts, the portrait and logo swaps, and the motion work — the first intended hero change |
| `after-design/` | After the design port. The gate: the whole design landed without moving the hero |
| `after/` | Phase 2 complete, with the band moved into the hero. **This is the reference `npm run check:hero` compares against.** |

Only `after/` carries the unfrozen `live-*.png`; comparison never reads them,
and `docs/phase1/` already holds them for the earlier state.

**Element counts are not comparable across the last step.** The probe was
corrected there to drop boxes with zero area and the content of a closed
`<details>` — the closed site index alone was contributing 53 elements of
markup the browser lays out and never paints. The pixel figures are unaffected
and are the ones to read across all three steps.

## The reports

- `hero-contract.txt` — both comparisons, run in order
- `measurements.txt` — JavaScript budget, Core Web Vitals, text contrast, font
  metrics, all from one session against a local production build
- `design/` — full-page screenshots of every view the design covers, desktop
  and phone, plus the site index open at both widths

## Reproducing any of it

```
npm run build
npm run serve          # in another terminal — frees :3000 first
npm run check:hero
npm run check:contrast
npm run check:vitals
```

Numbers from a different machine will differ; the comparisons will not.
