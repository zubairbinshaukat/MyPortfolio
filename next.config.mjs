/**
 * PLAN §1 is explicit that host redirects do not belong here — Vercel 307s the
 * apex and the vercel.app host to www at the edge, before app code runs.
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
const nextConfig = {};

export default nextConfig;
