/**
 * PLAN §1 is explicit that host redirects do not belong here — Vercel 307s the
 * apex and the vercel.app host to www at the edge, before app code runs. That
 * has not changed: nothing in `redirects()` below touches a host.
 *
 * What is here is route-level, and it is a different problem. Four draft URLs
 * — three case studies and one post — were published with `noindex`, crawled
 * anyway, and then deleted in 6d34286. Google Search Console still lists
 * `/projects/biz-xpert-mobile` under "Excluded by noindex", and every one of
 * the four now answers 404 to a crawler that already has the URL on file. A
 * 404 asks the crawler to keep retrying a dead address for months; a 308 tells
 * it once, permanently, where the surviving content is. The case studies go to
 * the listing page they were part of, the post goes to the blog index.
 *
 * These are permanent on purpose. The drafts are not coming back under these
 * slugs — if one ever does, the redirect is deleted in the same commit that
 * adds the file back.
 *
 * `images.remotePatterns` is gone with the origins it allowed. `ik.imagekit.io`
 * and `api.dicebear.com` were the last two third-party image hosts: the
 * dicebear avatars were generated cartoons of people who do not look like
 * that, replaced in Phase 1 by monograms, and nothing has referenced imagekit
 * since. An empty allowlist is stronger than a tidy one — with no patterns
 * configured, next/image refuses a remote URL outright, so a third-party
 * origin cannot be reintroduced by accident.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async redirects() {
    return [
      { source: "/projects/biz-xpert-mobile", destination: "/projects", permanent: true },
      { source: "/projects/biz-xpert-web", destination: "/projects", permanent: true },
      { source: "/projects/opencinema", destination: "/projects", permanent: true },
      { source: "/blog/idempotency-keys", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
