import { ViewTransition } from "react";
import Link from "next/link";
import ProjectCover from "./ProjectCover";
import { vtName } from "@/lib/view-transitions";

/**
 * One project in a ledger list — the design's row for view 04.
 *
 * Shared by the homepage's "Selected work" and by /projects, because they are
 * the same row with a different heading level above them. `as` is what lets
 * the homepage render `<h3>` under its section `<h2>` while /projects renders
 * `<h2>` under its page `<h1>`, with no skipped level on either.
 *
 * `data-vt-cover` and `data-vt-title` are the hooks PLAN §2.1 asked for:
 * "build the markup so [shared element transitions] can be added without
 * restructuring: stable elements, predictable class hooks on card images and
 * titles". They held: tier 2 of §3.2 is two <ViewTransition> wrappers around
 * the two nodes that already carried them, and no element moved to get them.
 *
 * The attributes stay. They are what a reader greps for to find both ends of a
 * pair, and scripts/check-classes.mjs and the hero contract both read the DOM
 * rather than the JSX.
 *
 * WHY EVERY ROW IS NAMED AND NOT JUST THE CLICKED ONE
 *
 * §3.2 says to "assign it dynamically to the clicked card, since one element
 * can hold a given name at a time". The constraint is real; the conclusion is
 * not needed here, because the name is derived from the slug. Three rows on
 * /projects hold three different names, so nothing collides and no click
 * handler is required — which matters more than it sounds, since assigning on
 * click would make every row a client component and put the whole list into
 * the JavaScript bundle to animate one of them.
 *
 * `share="morph"` with `default="none"`: without the first the pair silently
 * stops morphing, and without the second every named row on the page would
 * crossfade on navigations it has nothing to do with. The bundled guide
 * (01-app/02-guides/view-transitions.md) is explicit that the two go together.
 */
export default function ProjectRow({ project, as: Heading = "h3" }) {
  const href = `/projects/${project.slug}`;

  return (
    <li className="group relative border-b border-hairline">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-5 py-[26px] transition-[padding-left] duration-[400ms] ease-ease group-hover:pl-2">
        <span className="flex-none basis-11 pt-[5px] font-mono text-[11px] tracking-[0.14em] text-meta">
          {project.n}
        </span>

        <div className="min-w-0 flex-[1_1_320px]">
          <div className="mb-[9px] flex flex-wrap items-baseline gap-x-[14px] gap-y-[10px]">
            <ViewTransition
              name={vtName("project", "title", project.slug)}
              share="morph"
              default="none"
            >
              <Heading
                data-vt-title={project.slug}
                className="font-display text-item-h3 text-heading"
              >
                {/*
                  `data-vt="morph"` tells components/RouteCurtain.js to stay
                  out of the way. This navigation already has a transition —
                  the cover and the title move into the case study — and a
                  panel dropped over it would hide the one thing it exists to
                  show.
                */}
                <Link
                  href={href}
                  data-vt="morph"
                  transitionTypes={["morph"]}
                  className="no-underline after:absolute after:inset-0 after:content-['']"
                >
                  {project.title}
                </Link>
              </Heading>
            </ViewTransition>
            {project.featured ? (
              <span className="rounded-full border border-accent-line px-[9px] py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-soft">
                Featured
              </span>
            ) : null}
          </div>

          <p className="mb-3 max-w-[58ch] text-copy text-body">{project.summary}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-[6px] font-mono text-metadata uppercase text-meta">
            {/*
              The year is one of the unverified placeholders in the file's
              frontmatter, so it only appears once `datesVerified: true`. Type
              and client are accurate.
            */}
            {project.datesVerified && project.year ? <span>{project.year}</span> : null}
            {project.kind ? <span>{project.kind}</span> : null}
            {project.client ? <span>{project.client}</span> : null}
          </div>
        </div>

        <ViewTransition
          name={vtName("project", "cover", project.slug)}
          share="morph"
          default="none"
        >
          <div
            data-vt-cover={project.slug}
            className="w-full flex-none sm:w-[218px]"
          >
            <ProjectCover
              slug={project.slug}
              kind={project.kind}
              title={project.title}
              cover={project.cover}
              coverWidth={project.coverWidth}
              coverHeight={project.coverHeight}
              coverAlt={project.coverAlt}
            />
          </div>
        </ViewTransition>
      </div>
    </li>
  );
}
