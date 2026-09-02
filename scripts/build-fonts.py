#!/usr/bin/env python3
"""
Build the local web fonts in app/fonts/ from their masters.

PLAN §2.2 asks for the fonts to be subset to Latin and converted to woff2,
naming Font Squirrel and Transfonter as the tools. Both are browser uploads,
which makes the result unreproducible: nobody can tell later which options were
used, and the next person has to redo it by hand and hope. This is the same
operation with the settings written down, so the exact bytes in app/fonts/ can
be regenerated and diffed.

    pip install fonttools brotli
    python scripts/build-fonts.py

WHAT IT WRITES

    app/fonts/soria-regular.woff2       26 KB   browser
    app/fonts/alexbrush-regular.woff2   17 KB   browser

from the two masters that sit beside them:

    app/fonts/soria-og.ttf              77 KB   build-time only (Open Graph card)
    app/fonts/alexbrush-master.ttf      49 KB   build-time only (rebuild source)

WHY THE TWO FONTS ARE TREATED DIFFERENTLY

    Alex Brush is SIL OFL 1.1, which permits both modification and
    redistribution, so it is subset to the Google Fonts "latin" range — the
    same range next/font/google uses for Inter, so the two behave alike. Its
    master stays in the tree as app/fonts/alexbrush-master.ttf: 49 KB buys a
    rebuild that needs no git archaeology, and like every .ttf here it lives
    under app/ rather than public/, so nothing can request it.

    Soria is NOT OFL, despite the SIL licence text that used to sit beside it
    in public/fonts/. Its own name table declares Creative Commons BY-ND 4.0:
    attribution required, derivatives forbidden. Removing glyphs is a
    modification and ND does not permit it. Changing the container format is
    not — Creative Commons state that technical format-shifting does not
    produce an adaptation — so Soria is converted losslessly, every glyph kept.
    The cost of that compliance is 6 KB: 26.2 KB lossless against 20.3 KB for a
    Latin subset.

    Soria's master stays in the tree as app/fonts/soria-og.ttf, an unmodified
    copy of the original file. It is there for two reasons. Satori, which
    next/og renders through, reads TTF/OTF/WOFF and not woff2, so the Open
    Graph card in app/opengraph-image.js cannot use the browser font. And an
    unmodified copy is the one form of Soria this licence lets the repository
    carry. It is read from disk at build time and never served: it lives under
    app/ rather than public/, so no request for a .ttf can reach it.

WHAT --layout-features PROTECTS

    Kerning and ligature tables are dropped by default when subsetting. Losing
    them would change the advance widths in the hero's "Bin Shaukat" lockup and
    break the visual contract, so kern/liga/clig/calt are kept explicitly.
    scripts/check-fonts.py measures that they survived.

Hinting is left in place. Removing it saves a few hundred bytes and changes
rasterisation at small sizes, which is not a trade worth making in a phase
whose gate is pixel identity.
"""

import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

# The Google Fonts "latin" unicode range, so a subset font covers the same
# characters as the Inter subset next/font/google serves alongside it.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,"
    "U+2212,U+2215,U+FEFF,U+FFFD"
)

FEATURES = "kern,liga,clig,calt"

OUT_DIR = os.path.join("app", "fonts")

SORIA_MASTER = os.path.join(OUT_DIR, "soria-og.ttf")
ALEX_MASTER = os.path.join(OUT_DIR, "alexbrush-master.ttf")


def convert(src, dest):
    """Format-shift only. Every glyph and every table kept."""
    font = TTFont(src)
    font.flavor = "woff2"
    font.save(dest)
    font.close()
    print(f"  {src} -> {dest}  {os.path.getsize(dest):,} bytes (lossless format shift)")


def subset_latin(src, dest):
    """Latin subset, kerning and ligatures preserved."""
    subset.main(
        [
            src,
            f"--output-file={dest}",
            f"--unicodes={LATIN}",
            f"--layout-features={FEATURES}",
            "--flavor=woff2",
        ]
    )
    print(f"  {src} -> {dest}  {os.path.getsize(dest):,} bytes (latin subset)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("build-fonts: writing to app/fonts/\n")

    for master in (SORIA_MASTER, ALEX_MASTER):
        if not os.path.exists(master):
            print(f"missing master font: {master}")
            sys.exit(1)

    convert(SORIA_MASTER, os.path.join(OUT_DIR, "soria-regular.woff2"))
    subset_latin(ALEX_MASTER, os.path.join(OUT_DIR, "alexbrush-regular.woff2"))

    print("\ndone. Run `python scripts/check-fonts.py` to verify the metrics.")


if __name__ == "__main__":
    main()
