/**
 * Renders a JSON-LD graph as a <script> tag.
 *
 * The `<` → `<` replacement is the escaping the bundled Next 16 docs
 * prescribe (01-app/02-guides/json-ld.md): JSON.stringify does not sanitise
 * strings that could close the script tag early. Content here comes from our
 * own lib/, but the escape costs nothing and stops a future MDX-sourced value
 * becoming an XSS vector.
 *
 * Server component — no "use client". The graph must exist in the HTML before
 * any JavaScript runs, which is the whole point of it.
 */
export default function JsonLd({ graph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\u003c"),
      }}
    />
  );
}
