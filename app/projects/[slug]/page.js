import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import JsonLd from "@/components/JsonLd";
import Mdx from "@/components/Mdx";
import ProjectCover from "@/components/ProjectCover";
import ProjectGallery from "@/components/ProjectGallery";
import { getProject, getProjectSlugs } from "@/lib/projects";
import { projectGraph } from "@/lib/schema";
import { formatDate } from "@/lib/mdx";
import { navEntry, site } from "@/lib/site";
import { vtName } from "@/lib/view-transitions";

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

const entry = navEntry("/projects");

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
    ...(project.liveUrl ? [["Live", project.liveUrl]] : []),
  ].filter(([, value]) => Boolean(value));

  return (
    <PageShell
      trail={[
        { name: "Projects", href: "/projects", morph: true },
        { name: project.title, href: `/projects/${project.slug}` },
      ]}
      readout={`${entry.n} — Case study`}
    >
      <JsonLd graph={projectGraph(project)} />

      {/*
        The cover is this page's LCP element, and it is painted as a CSS
        background — see components/ProjectCover.js for why it is not
        next/image. A background image is discovered only once the stylesheet
        has parsed and the box has been laid out, which is late for the largest
        thing on the page. React 19 hoists this <link> into <head>, so the
        request starts with the document instead.
      */}
      {project.cover ? (
        <link
          rel="preload"
          as="image"
          href={project.cover}
          fetchPriority="high"
        />
      ) : null}

      <article>
          {/*
            Back to the list, and it morphs in reverse.

            `data-vt="morph"` keeps components/RouteCurtain.js out of the way,
            and `transitionTypes` asks for the same page treatment the forward
            navigation gets. The cover and the title are named on both pages, so
            React pairs them whichever direction you travel — without these two
            attributes this link took the curtain instead, and the reader
            watched a panel wipe over the element that was supposed to fly back
            into its row.
          */}
        <Link
          href="/projects"
          data-vt="morph"
          transitionTypes={["morph"]}
          className="inline-flex min-h-tap items-center gap-[9px] font-mono text-metadata uppercase text-meta no-underline transition-colors duration-300 ease-ease hover:text-heading"
        >
          <span aria-hidden="true">←</span> All projects
        </Link>

        {project.draft ? (
          <p className="mt-4 max-w-[70ch] rounded-panel border border-edge bg-surface px-4 py-3 text-copy text-body">
            Draft — this case study is still being written up, and is not
            indexed.
            {project.datesVerified
              ? null
              : " Its year and publication dates are unconfirmed placeholders, so they are withheld from the page and from its structured data."}
          </p>
        ) : null}

        <div className="mt-4">
          <PageHeader
            n={entry.n}
            eyebrow="Case study"
            title={project.title}
            lede={project.summary}
            titleTransition={vtName("project", "title", project.slug)}
          />
        </div>

        {/*
          Fig. 1 — the cover, at the case-study size, and the other half of
          PLAN §3.2's shared element. It carries the same name as the cover on
          the row this page was opened from, so the browser moves one cover
          from a 218px column into a full-width figure rather than fading a
          small one out and a large one in.

          The <figure> is named and not the <ProjectCover> inside it. The cover
          is `aspect-[16/10]` in a row and `aspect-[16/9]` here, and naming the
          box that actually changes shape is what lets the browser interpolate
          the shape rather than the contents of two differently-proportioned
          boxes. The figcaption is outside the pair and crossfades with the
          rest of the page, which is right — it exists only on this side.
        */}
        <ViewTransition
          name={vtName("project", "cover", project.slug)}
          share="morph"
          default="none"
        >
          <figure data-vt-cover={project.slug} className="mt-9">
            <ProjectCover
              slug={project.slug}
              kind={project.kind}
              title={project.title}
              cover={project.cover}
              coverWidth={project.coverWidth}
              coverHeight={project.coverHeight}
              coverAlt={project.coverAlt}
              size="detail"
            />
            {/*
              The caption describes whichever cover actually rendered. A project
              with a real screenshot gets its own words from `coverCaption`; one
              still on the drawn placeholder keeps the note saying so, because a
              caption that calls a bar field a screenshot is worse than no
              caption at all. It is written per image rather than generated,
              because only the person who took the screenshot knows what is in
              it — and Fig. 1 is a dashboard on this project and an inbox on the
              next one.
            */}
            <figcaption className="mt-3 font-mono text-metadata text-meta">
              {project.cover && project.coverHeight > 0
                ? `Fig. 1 — ${project.coverCaption || project.title}`
                : "Fig. 1 — an abstract stand-in. This case study has no photography yet; when it does, the real screenshot replaces this and carries its own dimensions."}
            </figcaption>
          </figure>
        </ViewTransition>

        <div className="mt-14 flex flex-wrap gap-x-14 gap-y-9 border-y border-hairline py-[30px]">
          <dl className="flex-[1_1_240px]">
            {meta.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-4 border-b border-hairline-soft py-[9px]"
              >
                <dt className="font-mono text-metadata uppercase text-meta">
                  {key}
                </dt>
                <dd className="min-w-0 break-words text-right text-[14px] text-strong">
                  {key === "Live" ? (
                    <a
                      href={value}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="text-heading underline decoration-accent-line underline-offset-4"
                    >
                      {value.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
            {project.datesVerified ? (
              <div className="flex justify-between gap-4 border-b border-hairline-soft py-[9px]">
                <dt className="font-mono text-metadata uppercase text-meta">
                  Published
                </dt>
                <dd className="text-right text-[14px] text-strong">
                  <time dateTime={project.publishedAt}>
                    {formatDate(project.publishedAt)}
                  </time>
                </dd>
              </div>
            ) : null}
          </dl>

          {project.stack?.length ? (
            <div className="flex-[1_1_240px]">
              <SectionHeading id="stack">Stack</SectionHeading>
              <ul className="mt-3 flex flex-wrap gap-[7px]">
                {project.stack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-white/[0.09] bg-surface px-[11px] py-[6px] font-mono text-tag text-body"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/*
          The case study's prose gets the same reading measure as a post. Left
          unset it inherits the page's 1240px column, and a 1240px line of 17px
          text is roughly 145 characters — twice what anyone reads comfortably.
        */}
        <div className="max-w-[70ch] text-longform">
          <Mdx source={project.body} />
        </div>

        {/*
          The supporting screenshots, after the prose rather than inside it:
          the case study argues in words first and shows its working second.
          Numbering continues from the cover, which is Fig. 1.
        */}
        <ProjectGallery items={project.gallery} startAt={2} />

      </article>

      <div className="mt-14 flex flex-wrap gap-4 border-t border-hairline pt-9">
        <Link
          href="/projects"
          data-vt="morph"
          transitionTypes={["morph"]}
          className="inline-flex min-h-control items-center gap-[9px] rounded-full border border-edge px-5 py-[13px] text-[14px] text-heading no-underline transition-colors duration-300 ease-ease hover:border-edge-strong"
        >
          <span aria-hidden="true">←</span> All projects
        </Link>
        <a
          href={`mailto:${site.email}`}
          className="inline-flex min-h-control items-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-[13px] text-[14px] text-heading no-underline transition-colors duration-300 ease-ease hover:bg-white/[0.09]"
        >
          Ask about a similar build
        </a>
      </div>
    </PageShell>
  );
}
