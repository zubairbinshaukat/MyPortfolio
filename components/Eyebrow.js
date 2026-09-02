/**
 * The numbered mono line above a heading.
 *
 * Two of the design system's rules meet here: mono carries every index, label
 * and number, and every section is numbered. The number is the spine of the
 * ledger — the same two digits appear in the site index, in the sticky band's
 * readout, and here above the page's own <h1>.
 *
 * Rendered as a <p> rather than a heading. It reads like a label, but it is
 * not a section title, and putting it in the heading outline would insert a
 * rung that says "03" between the page title and its content.
 */
export default function Eyebrow({ n, children, className = "" }) {
  return (
    <p className={`font-mono text-eyebrow uppercase text-accent ${className}`}>
      {n ? (
        <>
          <span>{n}</span>
          <span aria-hidden="true"> — </span>
        </>
      ) : null}
      {children}
    </p>
  );
}
