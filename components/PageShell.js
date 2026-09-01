import SiteNav from "./SiteNav";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Layout for every route except the homepage: navigation, breadcrumb trail,
 * the single <main> landmark. The footer comes from the root layout.
 *
 * The homepage does not use this — nothing may render above its hero without
 * shifting it, so it composes the same pieces in a different order.
 *
 * `id="main"` is the skip link's target and must appear exactly once per page.
 */
export default function PageShell({ trail, children }) {
  return (
    <>
      <SiteNav />
      {trail?.length ? <Breadcrumbs trail={trail} /> : null}
      <main id="main" className="mx-auto max-w-5xl px-6 py-12">
        {children}
      </main>
    </>
  );
}
