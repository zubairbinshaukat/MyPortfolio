import { Inter, Yatra_One } from "next/font/google";
import "./globals.css";
import SkipLink from "@/components/SkipLink";
import SiteFooter from "@/components/SiteFooter";
import { site, SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });
const yatraOne = Yatra_One({
  subsets: ["latin"],
  weight: ["400"], // Yatra One only has 400 weight
  variable: "--font-yatra",
});

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
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0616",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} ${yatraOne.variable}
        bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900
         font-sans`}
      >
        <SkipLink />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
