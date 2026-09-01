import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/JsonLd";
import Mdx from "@/components/Mdx";
import { getProject, getProjectSlugs } from "@/lib/projects";
import { projectGraph } from "@/lib/schema";
import { formatDate } from "@/lib/mdx";

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: `${project.title} — Case Study`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    // A skeleton with the outcome section unwritten does not go in the index.
    ...(project.draft ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "article",
      title: `${project.title} — Case Study`,
      description: project.summary,
      publishedTime: project.publishedAt,
      modifiedTime: project.updatedAt || project.publishedAt,
    },
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  // `year` is one of the unverified placeholders, so it is withheld until the
  // file sets datesVerified: true. Client, type and stack are accurate.
  const meta = [
    ["Client", project.client],
    ...(project.datesVerified ? [["Year", project.year]] : []),
    ["Type", project.kind],
    ["Stack", project.stack?.join(", ")],
  ].filter(([, value]) => Boolean(value));

  return (
    <PageShell
      trail={[
        { name: "Projects", href: "/projects" },
        { name: project.title, href: `/projects/${project.slug}` },
      ]}
    >
      <JsonLd graph={projectGraph(project)} />

      <article>
        {project.draft ? (
          <p className="mb-4 rounded-md border border-white/25 px-4 py-2 text-white/80">
            Draft — this case study is still being written up, and is not
            indexed.
            {project.datesVerified
              ? null
              : " Its year and publication dates are unconfirmed placeholders, so they are withheld from the page and from its structured data."}
          </p>
        ) : null}

        <h1 className="text-4xl font-bold text-white">{project.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/80">{project.summary}</p>

        <dl className="mt-8 divide-y divide-white/15 border-y border-white/15">
          {meta.map(([key, value]) => (
            <div key={key} className="flex flex-wrap gap-x-6 py-3">
              <dt className="w-32 shrink-0 text-white/70">{key}</dt>
              <dd className="text-white">{value}</dd>
            </div>
          ))}
          {project.datesVerified ? (
            <div className="flex flex-wrap gap-x-6 py-3">
              <dt className="w-32 shrink-0 text-white/70">Published</dt>
              <dd className="text-white">
                <time dateTime={project.publishedAt}>
                  {formatDate(project.publishedAt)}
                </time>
              </dd>
            </div>
          ) : null}
        </dl>

        <Mdx source={project.body} />
      </article>

      <p className="mt-16">
        <Link href="/projects" className="text-white underline underline-offset-4">
          All projects
        </Link>
      </p>
    </PageShell>
  );
}
