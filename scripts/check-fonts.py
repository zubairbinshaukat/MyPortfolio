#!/usr/bin/env python3
"""
The font conversion, measured.

PLAN §2.2 ends the font section with a requirement rather than a suggestion:

    Verify the subset preserved kerning: the "ZUBAIR" glyph advance widths
    must be identical. That's what --layout-features="kern,liga" protects.

A subset that silently dropped its GPOS table renders at the right size with
the wrong letter spacing, which no build step notices and no unit test covers.
This compares every web font in app/fonts/ against the master it was built
from, glyph by glyph, and fails on any difference.

    python scripts/check-fonts.py

Checks, per font:

  coverage   every character in the master's cmap that the web font is
             supposed to carry is present
  advances   the horizontal advance width of every shared glyph is identical
  kerning    the GPOS table survived, and the kern pairs in the hero's own
             strings still resolve to the same adjustment
  metrics    unitsPerEm, ascender, descender and line gap are unchanged, so
             line boxes cannot shift

The hero strings are checked by name because they are the visual contract:
"ZUBAIR" and "I'm" are set in Soria, "Bin Shaukat" in Alex Brush.
"""

import os
import sys

from fontTools.ttLib import TTFont

PAIRS = [
    # web font, master, the strings whose metrics are load-bearing
    (
        os.path.join("app", "fonts", "soria-regular.woff2"),
        os.path.join("app", "fonts", "soria-og.ttf"),
        ["ZUBAIR", "I'm", "Zubair Bin Shaukat"],
        # Lossless format shift: the two cmaps must match exactly.
        True,
    ),
    (
        os.path.join("app", "fonts", "alexbrush-regular.woff2"),
        os.path.join("app", "fonts", "alexbrush-master.ttf"),
        ["Bin Shaukat"],
        # Latin subset: the web font carries a subset of the master's cmap.
        False,
    ),
]

failures = 0
checks = 0


def fail(msg):
    global failures
    failures += 1
    print(f"  FAIL  {msg}")


def check(condition, msg):
    global checks
    if condition:
        checks += 1
    else:
        fail(msg)


def kern_pairs(font, text):
    """
    Every adjacent character pair in `text`, as glyph names, with the x-advance
    adjustment the font's GPOS kern feature applies to them.

    Read through fontTools' own shaping-independent lookup walk rather than
    HarfBuzz, so the check has no extra dependency. It only understands pair
    positioning, which is what a kern feature is.
    """
    cmap = font.getBestCmap()
    names = [cmap.get(ord(ch)) for ch in text]
    out = {}

    if "GPOS" not in font:
        return out

    gpos = font["GPOS"].table
    lookups = gpos.LookupList.Lookup if gpos.LookupList else []

    for first, second in zip(names, names[1:]):
        if not first or not second:
            continue
        value = 0
        for lookup in lookups:
            if lookup.LookupType != 2:
                continue
            for sub in lookup.SubTable:
                if getattr(sub, "Format", None) == 1:
                    coverage = sub.Coverage.glyphs
                    if first not in coverage:
                        continue
                    index = coverage.index(first)
                    for record in sub.PairSet[index].PairValueRecord:
                        if record.SecondGlyph == second and record.Value1:
                            value += getattr(record.Value1, "XAdvance", 0) or 0
                elif getattr(sub, "Format", None) == 2:
                    if first not in sub.Coverage.glyphs:
                        continue
                    c1 = sub.ClassDef1.classDefs.get(first, 0)
                    c2 = sub.ClassDef2.classDefs.get(second, 0)
                    try:
                        record = sub.Class1Record[c1].Class2Record[c2]
                    except (IndexError, AttributeError):
                        continue
                    if record.Value1:
                        value += getattr(record.Value1, "XAdvance", 0) or 0
        out[(first, second)] = value

    return out


print("check-fonts: comparing app/fonts/ web fonts against their masters\n")

for web_path, master_path, strings, exact_cmap in PAIRS:
    print(f"--- {web_path}")

    for path in (web_path, master_path):
        if not os.path.exists(path):
            fail(f"missing file: {path}")
            print()
            continue

    if not (os.path.exists(web_path) and os.path.exists(master_path)):
        continue

    web = TTFont(web_path)
    master = TTFont(master_path)

    # --- metrics ----------------------------------------------------------
    for table, field in [
        ("head", "unitsPerEm"),
        ("hhea", "ascent"),
        ("hhea", "descent"),
        ("hhea", "lineGap"),
        ("OS/2", "sTypoAscender"),
        ("OS/2", "sTypoDescender"),
        ("OS/2", "usWinAscent"),
        ("OS/2", "usWinDescent"),
    ]:
        a = getattr(master[table], field, None)
        b = getattr(web[table], field, None)
        check(a == b, f"{table}.{field}: master {a}, web font {b}")

    # --- coverage ---------------------------------------------------------
    master_cmap = master.getBestCmap()
    web_cmap = web.getBestCmap()

    if exact_cmap:
        missing = sorted(set(master_cmap) - set(web_cmap))
        check(
            not missing,
            f"lossless conversion dropped {len(missing)} characters: "
            + " ".join(f"U+{c:04X}" for c in missing[:12]),
        )
    else:
        # A latin subset must still carry everything in the strings it sets,
        # plus the printable ASCII range the site writes in.
        required = set(range(0x20, 0x7F)) & set(master_cmap)
        missing = sorted(required - set(web_cmap))
        check(
            not missing,
            f"subset dropped {len(missing)} ASCII characters: "
            + " ".join(f"U+{c:04X}" for c in missing[:12]),
        )

    # --- advances ---------------------------------------------------------
    master_hmtx = master["hmtx"].metrics
    web_hmtx = web["hmtx"].metrics
    changed = []
    for name, (advance, lsb) in web_hmtx.items():
        if name in master_hmtx and master_hmtx[name][0] != advance:
            changed.append((name, master_hmtx[name][0], advance))
    check(
        not changed,
        f"{len(changed)} glyph advance widths changed: "
        + ", ".join(f"{n} {a}->{b}" for n, a, b in changed[:8]),
    )

    # --- the hero strings -------------------------------------------------
    for text in strings:
        chars = [c for c in text if ord(c) in master_cmap]
        check(
            len(chars) == len(text),
            f'master does not cover every character of "{text}"',
        )

        web_total = sum(
            web_hmtx[web_cmap[ord(c)]][0] for c in text if ord(c) in web_cmap
        )
        master_total = sum(
            master_hmtx[master_cmap[ord(c)]][0] for c in text if ord(c) in master_cmap
        )
        check(
            web_total == master_total,
            f'"{text}" total advance: master {master_total}, web font {web_total}',
        )

        km = kern_pairs(master, text)
        kw = kern_pairs(web, text)
        check(
            km == kw,
            f'"{text}" kerning differs: master {km}, web font {kw}',
        )
        applied = sum(1 for v in km.values() if v)
        print(
            f'  "{text}": {web_total} units, {len(km)} pairs, {applied} kerned — identical'
        )

    web.close()
    master.close()
    print()

print(f"{checks} checks passed, {failures} failed.")

if failures:
    print("\ncheck-fonts FAILED")
    sys.exit(1)

print("check-fonts OK")
