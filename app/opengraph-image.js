import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * The Open Graph image, generated at build time.
 *
 * Generated rather than hand-made on purpose: the file it replaces was a
 * 2.8 MB PNG at 3448×2178 whose declared dimensions in the metadata (1700×1030)
 * matched neither the file nor the 1200×630 that every platform expects. A
 * generated image cannot drift out of sync with the brand or the declared size.
 *
 * This is also what renders beside AI chat citations, not just social cards.
 */
export const alt = site.ogImage.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Soria, the display face from the hero, so the card and the site are visibly
 * the same brand. Read from disk rather than fetched — ImageResponse has a
 * 500 KB bundle budget and this file is ~75 KB.
 *
 * Phase 2 renames these files and moves them to app/fonts/; this path changes
 * with them.
 */
const soria = fs.readFileSync(
  path.join(process.cwd(), "public", "fonts", "font-2.ttf")
);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0616",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {site.url.replace("https://", "")}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Soria",
              fontSize: 128,
              lineHeight: 1,
              color: "#ffffff",
            }}
          >
            ZUBAIR
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Soria",
              fontSize: 128,
              lineHeight: 1.05,
              color: "#c084fc",
            }}
          >
            BIN SHAUKAT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* The single gradient rule of the design system: a line, never a fill. */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 3,
              background: "linear-gradient(to right, #a855f7, #ec4899)",
            }}
          />
          <div style={{ display: "flex", fontSize: 34, color: "rgba(255,255,255,0.82)" }}>
            {site.tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Soria", data: soria, weight: 400, style: "normal" }],
    }
  );
}
