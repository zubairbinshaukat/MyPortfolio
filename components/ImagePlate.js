/**
 * One screenshot, in a box that knows its own shape before the file arrives.
 *
 * Every image on a case study goes through here — the cover and each gallery
 * plate — so the technique and the reasoning behind it live in one place
 * instead of being copied per call site.
 *
 * WHY A BACKGROUND IMAGE AND NOT next/image
 *
 * Measured, not preferred. Built both ways: `next/image` costs 4.6 KB brotli on
 * `/projects`, taking it from 118.3 KB to 122.9 against PLAN §2.3's 120 KB
 * budget. That route has 1.7 KB of headroom and the image runtime does not fit
 * in it. `/` already carries the runtime for the hero portrait, so the cost
 * lands squarely on `/projects` and `/projects/[slug]` — the two routes that
 * cannot absorb it.
 *
 * A plain `<img>` is the other zero-cost option and is not available either:
 * `@next/next/no-img-element` is enabled at warn, the standing bar is zero
 * warnings, and PLAN §0.3 rules out downgrading a rule to pass a gate.
 *
 * What a background image gives up is `srcset`. There is nothing to give up:
 * these are single 1200px WebPs of 24-35 KB, which is the width the detail page
 * displays them at and several times the width a row thumbnail needs. An
 * optimiser would be resizing files that are already the right size.
 *
 * WHAT IT KEEPS
 *
 *   The box. `aspect-ratio` comes from the real pixel dimensions in the
 *   frontmatter, so the space is reserved before the image loads and CLS stays
 *   at zero. That is the entire reason those fields exist.
 *
 *   An accessible name. `role="img"` with an `aria-label` gives the element an
 *   image role and a name without an `<img>`, so a screenshot is announced
 *   rather than skipped. `alt` is required, not optional — a plate with no
 *   name is a plate a screen reader cannot describe.
 */
export default function ImagePlate({
  src,
  width,
  height,
  alt,
  className = "",
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        aspectRatio: `${width} / ${height}`,
        backgroundImage: `url("${src}")`,
      }}
      className={`overflow-hidden rounded-cover border border-hairline bg-elevated bg-cover bg-center bg-no-repeat ${className}`}
    />
  );
}
