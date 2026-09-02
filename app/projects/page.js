import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import ProjectRow from "@/components/ProjectRow";
import { getAllProjects } from "@/lib/projects";
import { navEntry } from "@/lib/site";

export const metadata = {
  title: "Projects",
  description:
    "Selected work by Zubair Bin Shaukat: automation pipelines, GoHighLevel dashboards and marketplace apps, web applications and cross-platform mobile apps.",
  alternates: { canonical: "/projects" },
};

const entry = navEntry("/projects");

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <PageShell
      trail={[{ name: "Projects", href: "/projects" }]}
      readout={`${entry.n} — ${entry.label}`}
    >
      <PageHeader
        n={entry.n}
        eyebrow={entry.label}
        title="Selected Work"
        lede="Systems in production, written up as case studies: what the problem was, what got built, and what changed afterwards. Ordered newest first."
      />

      {projects.length === 0 ? (
        <p className="mt-12 text-copy text-body">No case studies published yet.</p>
      ) : (
        <ol className="mt-12 border-t border-hairline">
          {projects.map((project, i) => (
            <ProjectRow
              key={project.slug}
              as="h2"
              project={{ ...project, n: String(i + 1).padStart(2, "0") }}
            />
          ))}
        </ol>
      )}
    </PageShell>
  );
}
