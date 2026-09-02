"use client";

import { useEffect, useState } from "react";

/**
 * The homepage's readout in the sticky band: which section you are currently
 * looking at, numbered, in mono. The design's condensed band shows
 * "03 — Services" where the resting band shows the social pill.
 *
 * It starts empty and stays empty until a section is actually in view. The
 * design is explicit that the readout "replaces the pill on scroll" — at the
 * top of the homepage you are looking at the hero, and a band announcing
 * "01 — What I do" over it is simply wrong. With JavaScript off it stays
 * empty, which is honest: without scroll tracking there is nothing to say.
 *
 * Nothing shifts when it fills. The slot is a `flex-1` box in the band whose
 * height comes from the controls either side of it, so text arriving inside it
 * changes no geometry.
 *
 * IntersectionObserver rather than a scroll handler — the browser does the
 * geometry off the main thread, and the rootMargin below asks it a precise
 * question: which section crosses the line a third of the way down the
 * viewport. That is the section a reader is actually reading.
 *
 * @param {{sections: {id: string, n: string, label: string}[]}} props
 */
export default function SectionReadout({ sections }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const nodes = sections
      .map((section, index) => ({ index, el: document.getElementById(section.id) }))
      .filter((entry) => entry.el);

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = nodes.find((node) => node.el === entry.target);
          if (match) setActive(match.index);
        }
      },
      { rootMargin: "-33% 0px -60% 0px", threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node.el));
    return () => observer.disconnect();
  }, [sections]);

  const current = active === null ? null : sections[active];
  if (!current) return null;

  return (
    <>
      {current.n}
      <span aria-hidden="true"> — </span>
      {current.label}
    </>
  );
}
