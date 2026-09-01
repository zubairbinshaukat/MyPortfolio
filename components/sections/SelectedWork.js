import Link from "next/link";
import { getFeaturedProjects } from "@/lib/projects";

/**
 * "Selected work" — the featured case studies, read from
 * content/projects/*.mdx frontmatter.
 *
 * Renders nothing at all when no project is marked `featured: true`, rather
 * than an empty heading with a gap under it.
 */
export default function SelectedWork() {
  const projects = getFeaturedProjects(4);
  if (!projects.length) return null;

  return (
    <section aria-labelledby="selected-work" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="selected-work" className="text-3xl font-bold text-white">
        Selected work
      </h2>

      <ul className="mt-8 space-y-8">
        {projects.map((project) => (
          <li key={project.slug} className="border-t border-white/15 pt-6">
            <h3 className="text-xl font-semibold text-white">
              <Link
                href={`/projects/${project.slug}`}
                className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                {project.title}
              </Link>
            </h3>
            <p className="mt-1 text-white/70">
              {project.kind} · {project.year}
            </p>
            <p className="mt-2 max-w-2xl text-white/80">{project.summary}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link
          href="/projects"
          className="text-white underline underline-offset-4 hover:text-white"
        >
          All projects
        </Link>
      </p>
    </section>
  );
}
