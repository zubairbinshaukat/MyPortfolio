import Link from "next/link";
import PageShell from "@/components/PageShell";
import { getAllProjects } from "@/lib/projects";

export const metadata = {
  title: "Projects",
  description:
    "Selected work by Zubair Bin Shaukat: automation pipelines, GoHighLevel dashboards and marketplace apps, web applications and cross-platform mobile apps.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <PageShell trail={[{ name: "Projects", href: "/projects" }]}>
      <h1 className="text-4xl font-bold text-white">Selected Work</h1>
      <p className="mt-4 max-w-3xl text-lg text-white/80">
        Systems in production, written up as case studies: what the problem
        was, what got built, and what changed afterwards.
      </p>

      {projects.length === 0 ? (
        <p className="mt-12 text-white/80">No case studies published yet.</p>
      ) : (
        <ul className="mt-12 space-y-10">
          {projects.map((project) => (
            <li key={project.slug} className="border-t border-white/15 pt-6">
              <h2 className="text-2xl font-semibold text-white">
                <Link
                  href={`/projects/${project.slug}`}
                  className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                >
                  {project.title}
                </Link>
              </h2>
              <p className="mt-1 text-white/70">
                {project.kind} · {project.client} · {project.year}
              </p>
              <p className="mt-3 max-w-3xl text-white/80">{project.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack?.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-white/25 px-3 py-1 text-white/80"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
