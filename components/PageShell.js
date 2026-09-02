import SiteNav from "./SiteNav";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Layout for every route except the homepage: the sticky band, the breadcrumb
 * trail, the single <main> landmark. The footer comes from the root layout.
 *
 * The homepage does not use this — nothing may render above its hero without
 * shifting it (PLAN §0.2) — so it composes the same pieces in a different
 * order.
 *
 * `id="main"` is the skip link's target and must appear exactly once per page.
 *
 * `relative z-[1]` puts the content above the fixed dot-grid layer that
 * `.dot-grid` paints on the body. Without it the grid would sit on top of the
 * page rather than behind it.
 */
export default function PageShell({ trail, readout, children }) {
  return (
    <>
      <SiteNav readout={readout} />
      {trail?.length ? <Breadcrumbs trail={trail} /> : null}
      <main
        id="main"
        className="relative z-[1] mx-auto max-w-measure px-gutter pb-[90px] pt-pad-top"
      >
        {children}
      </main>
    </>
  );
}
