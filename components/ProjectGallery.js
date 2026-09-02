import ImagePlate from "./ImagePlate";
import SectionHeading from "./SectionHeading";

/**
 * The rest of the screenshots on a case study, behind a disclosure.
 *
 * A case study leads with one frame — the cover — and that is the one that has
 * to carry the page. Everything else is supporting evidence a reader asks for
 * rather than gets handed, so it sits in a native `<details>` the reader opens.
 *
 * WHY <details> AND NOT A LIST
 *
 *   It is the "option to show" rather than a wall of screenshots between the
 *   prose and the end of the page.
 *
 *   It costs nothing until it is used. Chrome renders closed `<details>`
 *   content with `content-visibility: hidden`, and a skipped subtree does not
 *   fetch its background images — so an unopened gallery downloads no bytes at
 *   all. That is lazy loading by construction rather than by attribute, which
 *   matters because `loading="lazy"` only exists on `<img>` and ImagePlate
 *   explains why these are not `<img>`.
 *
 *   The markup is still in the HTML. A closed `<details>` is hidden from the
 *   viewport, not from the document, so every caption is crawlable and
 *   `check-nojs` can assert it. And it opens with JavaScript disabled, which is
 *   the same reason the site index is a `<details>` — see components/SiteNav.js.
 *
 * The figures continue the cover's numbering: the cover is Fig. 1, so `startAt`
 * is 2. One sequence across the page, because "Fig. 2" in a gallery that
 * restarts at 1 is a reference to two different pictures.
 *
 * Every entry needs `src`, `width`, `height` and `alt`. The dimensions are not
 * decoration — ImagePlate turns them into the reserved box that keeps CLS at
 * zero — so an entry missing either is dropped rather than rendered as a
 * collapsing frame.
 */
export default function ProjectGallery({ items, startAt = 2 }) {
  const usable = (items || []).filter(
    (item) => item?.src && item.width > 0 && item.height > 0
  );

  if (!usable.length) return null;

  const last = startAt + usable.length - 1;
  const range = usable.length === 1 ? `Fig. ${startAt}` : `Figs. ${startAt}–${last}`;

  return (
    <section aria-labelledby="more-images" className="mt-14">
      <SectionHeading id="more-images">More from the build</SectionHeading>

      <details className="group mt-4">
        <summary className="flex min-h-tap cursor-pointer list-none items-center gap-[10px] font-mono text-metadata uppercase text-meta transition-colors duration-300 ease-ease hover:text-heading [&::-webkit-details-marker]:hidden">
          <span>
            {range} — {usable.length} more {usable.length === 1 ? "screen" : "screens"}
          </span>
          <span aria-hidden="true" className="text-accent group-open:hidden">
            Show
          </span>
          <span aria-hidden="true" className="hidden text-accent group-open:inline">
            Hide
          </span>
        </summary>

        <ol className="mt-8 flex flex-col gap-12">
          {usable.map((item, i) => (
            <li key={item.src}>
              <figure>
                <ImagePlate
                  src={item.src}
                  width={item.width}
                  height={item.height}
                  alt={item.alt}
                />
                {item.caption ? (
                  <figcaption className="mt-3 font-mono text-metadata text-meta">
                    Fig. {startAt + i} — {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
