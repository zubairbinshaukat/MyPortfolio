import Script from "next/script";
import "./globals.css";
import { fontVariables, inter } from "./fonts";
import SkipLink from "@/components/SkipLink";
import SmoothScroll from "@/components/SmoothScroll";
import RouteCurtain from "@/components/RouteCurtain";
import SiteFooter from "@/components/SiteFooter";
import { site, SITE_URL } from "@/lib/site";

/**
 * Root metadata.
 *
 * `keywords`, `authors` and `creator` sit at the top level here. They were
 * previously nested inside `openGraph`, where Next ignores them and they
 * emitted nothing at all.
 *
 * Every string is read from lib/site.js so the description in a search result,
 * the description in an OG card and the description in JSON-LD are the same
 * sentence rather than three that drifted apart.
 */
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — ${site.tagline}`,
    // Inner pages set a short title; this appends the brand.
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: SITE_URL }],
  creator: site.name,
  publisher: site.name,
  keywords: [
    "Zubair Bin Shaukat",
    "zubyr dev",
    "GoHighLevel developer",
    "GoHighLevel expert",
    "n8n automation developer",
    "workflow automation developer",
    "Next.js developer Lahore",
    "React Native developer Pakistan",
    "software engineer Lahore",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
    creator: site.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/**
 * Viewport is its own export, not a key inside `metadata`. Next has warned on
 * the nested form since 14 and ignores it.
 *
 * `themeColor` is now the design's ground rather than the old #0b0616, so the
 * browser chrome matches the page instead of the gradient that used to be
 * painted over the body.
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

/** Umami Cloud. PLAN §1 locks the site ID; §2.5 locks the loading strategy. */
const UMAMI_SITE_ID = "f5f90ae1-bb5f-4e48-a52c-d9dc17c0ab0d";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      {/*
        `inter.className` sets the family directly on <body>. The variable form
        alone was not enough before: Tailwind's `font-sans` utility was also on
        this element and won, so Inter was downloaded and preloaded on every
        page and then never rendered. tailwind.config.js now points `font-sans`
        at the same variable, so the two agree instead of racing.
      */}
      <body
        className={`${inter.className} ${fontVariables} dot-grid bg-ground font-sans text-body`}
      >
        <SkipLink />
        {children}
        <SiteFooter />

        {/*
          Lenis (PLAN §3.1). Renders no DOM and ships no library in the initial
          bundle — it imports Lenis after hydration, and only when the reader
          has not asked for reduced motion. See components/SmoothScroll.js for
          the measurement behind that.
        */}
        <SmoothScroll />

        {/*
          The route-change curtain (PLAN §3.2 tier 1, rebuilt). It appends its
          own element after hydration and renders nothing here, so no route's
          HTML carries it. See components/RouteCurtain.js.
        */}
        <RouteCurtain />

        {/*
          Analytics, both of them, and nothing else (PLAN §2.5).

          `afterInteractive` runs the tag after hydration, so it is outside the
          critical path and cannot touch LCP. Umami is cookieless and collects
          no personal data, which is why it needs no consent banner — the third
          script this site does not have.

          This is the one third-party origin on the site. PLAN §2.2's "zero
          third-party origins on /" closes a list about image hosts; §2.5 names
          Umami Cloud explicitly. See the Phase 2 report.
        */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={UMAMI_SITE_ID}
          strategy="afterInteractive"
        />

        {/*
          Vercel Speed Insights: the real-user Core Web Vitals stream. It
          beacons to /_vercel/insights on this origin, so it adds no
          third-party host.

          The script directly, rather than `<SpeedInsights />` from
          `@vercel/speed-insights/next`. PLAN §2.5 says "one component in the
          layout", and this is a deviation with a measurement behind it: the
          React wrapper costs 1.0 KB brotli on every route, and §2.3's budget
          leaves /contact 0.4 KB of headroom. It was the difference between
          every route passing check-js and two of them failing it.

          What the wrapper does that this does not is set `route` from
          `useParams`, so Vercel would group every case study under
          `/projects/[slug]` rather than listing each one. This site has two
          dynamic URLs in total — one case study and one post. Two separate
          rows in the dashboard is not worse than one grouped row at that size,
          it is more useful, and the wrapper's grouping exists for applications
          with thousands of them.

          Every other thing the wrapper does, the script does: it is the same
          script the wrapper injects, from the same path, and the data is the
          same data. Reverting is `npm i @vercel/speed-insights`, one
          import and one component, if the grouping is ever wanted more than
          the kilobyte.

          WHY IT IS GATED ON `VERCEL`

          `/_vercel/speed-insights/script.js` is served by Vercel's edge and by
          nothing else, so anywhere but a Vercel deployment the tag is a
          guaranteed 404 on every page load. Measured, that one request was the
          only thing costing this site a Best Practices point: Lighthouse's
          `errors-in-console` audit carries weight 1 and scored 0 against both
          `next start` and `next dev`, taking the category to 96. Nothing else
          logged an error in any run.

          `process.env.VERCEL` is set during a Vercel build and inlined into
          these prerendered pages, so the tag ships there and is absent
          everywhere else. The npm package does the same kind of branching for
          the same reason — it swaps to a different host in development rather
          than requesting a path that will not answer.
        */}
        {process.env.VERCEL ? (
          <Script
            src="/_vercel/speed-insights/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
