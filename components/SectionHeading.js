/**
 * The two kinds of section heading the design uses, as one component.
 *
 * `variant="label"` is the mono rule that opens a subsection — 10.5px,
 * 0.22em, uppercase, over a hairline. It is the design's most common heading
 * and it is deliberately quiet: on a ledger, the label is not the content.
 *
 * `variant="display"` is the Didone at the h2 step, used where a section is
 * meant to land rather than to file — "Asked before every project.", "Three
 * decisions I would defend."
 *
 * Both render a real <h2> (or whatever `as` is given), so the visual weight of
 * a heading is a styling decision and the document outline stays correct. That
 * separation is the whole reason this is a component: the design wants a
 * section title that looks like a caption, and the outline still needs it to
 * be a heading.
 */
export default function SectionHeading({
  as: Tag = "h2",
  id,
  variant = "label",
  className = "",
  children,
}) {
  if (variant === "display") {
    return (
      <Tag
        id={id}
        className={`font-display text-section-h2 text-heading ${className}`}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      id={id}
      className={`border-b border-hairline pb-3 font-mono text-label font-normal uppercase text-meta ${className}`}
    >
      {children}
    </Tag>
  );
}
