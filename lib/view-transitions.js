/**
 * The names that pair a list row with the page it opens (PLAN §3.2, tier 2).
 *
 * A shared-element transition is a string match and nothing else: React looks
 * for a `<ViewTransition>` with the same `name` in the outgoing tree and the
 * incoming one, and if the two strings differ by a character it does not fail,
 * it simply does not morph. That is the worst shape a bug can have — silent,
 * invisible in every automated check, and only findable by watching a
 * navigation at the right moment.
 *
 * So the strings are built here and imported by both ends. `components/
 * ProjectRow.js` and `app/projects/[slug]/page.js` cannot disagree about what
 * a cover is called, because neither of them writes the name down.
 *
 * The `kind` prefix keeps the two content types apart. Nothing renders a
 * project row and a post row in the same document today, but a "related
 * reading" block on a case study would, and a collision between two elements
 * claiming one name is a transition that breaks rather than degrades — the
 * browser drops the whole thing.
 *
 * The values are CSS `<custom-ident>`s. Every slug in content/ is kebab-case
 * and starts with a letter, and the prefix guarantees the leading character
 * regardless, so no slug can produce an identifier the parser rejects.
 *
 * @param {"project"|"post"} kind
 * @param {"cover"|"title"} part
 * @param {string} slug
 */
export function vtName(kind, part, slug) {
  return `${kind}-${part}-${slug}`;
}
