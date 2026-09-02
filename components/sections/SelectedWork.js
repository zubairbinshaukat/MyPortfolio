import Link from "next/link";
import { getFeaturedProjects } from "@/lib/projects";
import Eyebrow from "../Eyebrow";
import ProjectRow from "../ProjectRow";

/**
 * "Selected work" — the featured case studies, read from
 * content/projects/*.mdx frontmatter.
 *
 * Renders nothing at all when no project is marked `featured: true`, rather
 * than an empty heading with a gap under it.
 *
 * The row numbers are positional, so the ledger reads 01, 02, 03 in the order
 * the frontmatter sorts — newest first.
 */
export default function SelectedWork({ id = "work", n = "02" }) {
  const projects = getFeaturedProjects(4);
  if (!projects.length) return null;

  return (
    <section
      id={id}
      data-snap
      aria-labelledby="selected-work"
      className="mx-auto max-w-measure px-gutter pt-20"
    >
      <Eyebrow n={n}>Selected work</Eyebrow>

      <h2
        id="selected-work"
        className="mt-[18px] max-w-[20ch] font-display text-section-h2 text-heading"
      >
        Systems in production, and what each one replaced.
      </h2>

      <p className="mt-[22px] max-w-lede text-lede text-body">
        Every row is a real engagement, ordered newest first. Open any of them
        for the full narrative.
      </p>

      <ol className="mt-12 border-t border-hairline">
        {projects.map((project, i) => (
          <ProjectRow
            key={project.slug}
            project={{ ...project, n: String(i + 1).padStart(2, "0") }}
          />
        ))}
      </ol>

      <p className="mt-8">
        <Link
          href="/projects"
          className="inline-flex min-h-control items-center gap-[9px] rounded-full border border-edge px-5 py-[13px] text-[14px] text-heading no-underline transition-colors duration-300 ease-ease hover:border-edge-strong"
        >
          All projects
          <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </section>
  );
}
