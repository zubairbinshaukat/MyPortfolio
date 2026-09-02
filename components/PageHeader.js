import { ViewTransition } from "react";
import Eyebrow from "./Eyebrow";

/**
 * The opening of every inner page: numbered eyebrow, display heading, lede.
 *
 * One component rather than the same three elements repeated on nine routes,
 * so the type scale and the rhythm between them are decided once. The heading
 * is the page's only <h1>; nothing here can produce a second one, which is
 * what keeps the Phase 1 heading gate passing as the design lands on top of it.
 *
 * `max-w-[20ch]` on the heading is the prototype's own measure. A Didone at
 * 76px wants a short line — the design's headlines are all two or three words
 * per line — and letting it run the full 1240px column would undo the reason
 * for choosing the typeface.
 *
 * `titleTransition` is the case study's half of PLAN §3.2's shared element: the
 * row's title on /projects and this <h1> carry the same name, so the browser
 * moves one heading between the two pages instead of fading one out and
 * another in. It is optional and unset on every other page, because a page
 * with no row to arrive from has nothing to pair with — and a name with no
 * partner is not free, it makes the element its own transition group and pulls
 * it out of the page crossfade.
 *
 * The `animate-rise` entrance is dropped when the heading is a morph target.
 * The two are the same 500ms of the same property: a heading that is being
 * moved into place by the browser and simultaneously fading itself in from
 * opacity 0 arrives twice, and looks it.
 */
export default function PageHeader({
  n,
  eyebrow,
  title,
  lede,
  titleTransition,
  children,
}) {
  const heading = (
    <h1
      className={`mt-[18px] max-w-[20ch] font-display text-display text-heading${
        titleTransition ? "" : " animate-rise"
      }`}
    >
      {title}
    </h1>
  );

  return (
    <header>
      {eyebrow ? <Eyebrow n={n}>{eyebrow}</Eyebrow> : null}
      {titleTransition ? (
        <ViewTransition name={titleTransition} share="morph" default="none">
          {heading}
        </ViewTransition>
      ) : (
        heading
      )}
      {lede ? (
        <p className="mt-[22px] max-w-lede text-lede text-body">{lede}</p>
      ) : null}
      {children}
    </header>
  );
}
