import { SITE_URL } from "@/lib/site";

/**
 * robots.txt, generated.
 *
 * The AI crawlers are named and allowed on purpose. Being ingested by GPTBot,
 * ClaudeBot, PerplexityBot and the rest is the point of the whole
 * AI-readability layer — blocking them would make the fact-dense /about and
 * the FAQ answers useless.
 *
 * `Google-Extended` and `Applebot-Extended` are opt-in controls for AI
 * training and grounding specifically; they do not affect Search ranking
 * either way, so allowing them costs nothing and gains citation eligibility.
 *
 * The static app/robots.txt this replaces has been deleted — two files
 * claiming the same route is ambiguity, and the old one pointed at the
 * vercel.app sitemap.
 */
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "OAI-SearchBot",
          "Applebot-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
