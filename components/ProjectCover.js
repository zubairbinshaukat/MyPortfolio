import ImagePlate from "./ImagePlate";

/**
 * The abstract cover that stands beside every project row and case study.
 *
 * It is drawn, not photographed: a window chrome, the project's kind in mono,
 * and a field of bars. That is what the prototype specifies, and it is also
 * the honest option here. The three case studies in content/projects/ carry
 * `coverWidth: 0` and `coverHeight: 0` — nobody has measured the screenshots —
 * and an image whose dimensions are unknown is a layout shift waiting to
 * happen. This has an `aspect-ratio`, so its box is known before anything
 * loads, costs no request, and cannot shift.
 *
 * `aria-hidden` on the drawn field because it is decoration. The prototype
 * gives each cover a descriptive `aria-label`, which would be right for a real
 * screenshot; for a generated bar field it would describe a chart that does not
 * represent anything. The row's heading and summary carry the meaning.
 *
 * The bars are derived from the slug rather than random, so a given project
 * looks the same on every render, in every build, and in a screenshot diff.
 *
 * A REAL COVER ARRIVED
 *
 * When a project carries a `cover` with real `coverWidth` and `coverHeight`,
 * that image renders through components/ImagePlate.js and the bar field becomes
 * the fallback for projects that have none. ImagePlate carries the measured
 * reasoning for why it is a background image rather than `next/image`.
 *
 * The one thing decided here rather than there: both sizes use the image's own
 * ratio instead of the hardcoded 16/10 and 16/9, so nothing is cropped and the
 * shared-element morph between a row and the case study is a pure scale.
 */

/** A small deterministic hash, so the same slug always draws the same field. */
function seedFrom(slug = "") {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function barsFor(slug, count) {
  let seed = seedFrom(slug) || 1;
  const bars = [];
  for (let i = 0; i < count; i++) {
    // xorshift32 — deterministic, uniform enough for decoration.
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    bars.push(24 + (seed % 62));
  }
  return bars;
}

export default function ProjectCover({
  slug,
  kind,
  title,
  cover,
  coverWidth,
  coverHeight,
  coverAlt,
  size = "row",
  className = "",
}) {
  const isRow = size === "row";

  if (cover && coverWidth > 0 && coverHeight > 0) {
    return (
      <ImagePlate
        src={cover}
        width={coverWidth}
        height={coverHeight}
        alt={coverAlt || `${title || slug} — ${kind}`}
        className={`transition-colors duration-[400ms] ease-ease group-hover:border-edge-strong ${className}`}
      />
    );
  }

  const bars = barsFor(slug, isRow ? 7 : 14);

  // The design's gradient rule: one accented element, never a fill. Exactly
  // one bar in a row cover carries the gradient; the rest are white at 10%.
  const accentAt = isRow ? bars.length - 2 : bars.length - 4;

  return (
    <div
      aria-hidden="true"
      className={`flex flex-col overflow-hidden rounded-cover border border-hairline bg-elevated transition-colors duration-[400ms] ease-ease group-hover:border-edge-strong ${
        isRow ? "aspect-[16/10]" : "aspect-[16/9]"
      } ${className}`}
    >
      <div
        className={`flex flex-none items-center gap-[5px] border-b border-hairline-soft px-[10px] ${
          isRow ? "h-6" : "h-[34px]"
        }`}
      >
        <span className="h-[5px] w-[5px] rounded-full bg-white/[0.16]" />
        <span className="h-[5px] w-[5px] rounded-full bg-white/[0.16]" />
        {!isRow && <span className="h-[5px] w-[5px] rounded-full bg-white/[0.16]" />}
        <span className="ml-[6px] truncate font-mono text-[8.5px] uppercase tracking-[0.16em] text-meta">
          {kind}
        </span>
      </div>

      <div className="flex flex-1 items-end gap-[5px] p-3">
        {bars.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height}%` }}
            className={`flex-1 rounded-t-[3px] ${
              i === accentAt ? "bg-gradient" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
