import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import Eyebrow from "@/components/Eyebrow";
import JsonLd from "@/components/JsonLd";
import Mdx from "@/components/Mdx";
import { getPost, getPostSlugs, getPublishedPosts } from "@/lib/blog";
import { articleGraph } from "@/lib/schema";
import { formatDate } from "@/lib/mdx";
import { navEntry, site } from "@/lib/site";
import { vtName } from "@/lib/view-transitions";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    ...(post.draft ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [site.name],
    },
  };
}

const entry = navEntry("/blog");

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // The index the row on /blog draws in its cover square, so the two agree.
  const published = getPublishedPosts();
  const index = published.findIndex((p) => p.slug === post.slug);
  const n = String((index < 0 ? 0 : index) + 1).padStart(2, "0");

  return (
    <PageShell
      trail={[
        { name: "Blog", href: "/blog", morph: true },
        { name: post.title, href: `/blog/${post.slug}` },
      ]}
      readout={`${entry.n} — Writing`}
    >
      <JsonLd graph={articleGraph(post)} />

      <article>
        {/* Same reverse morph as the case study. See app/projects/[slug]/page.js. */}
        <Link
          href="/blog"
          data-vt="morph"
          transitionTypes={["morph"]}
          className="inline-flex min-h-tap items-center gap-[9px] font-mono text-metadata uppercase text-meta no-underline transition-colors duration-300 ease-ease hover:text-heading"
        >
          <span aria-hidden="true">←</span> All writing
        </Link>

        {post.draft ? (
          <p className="mt-4 max-w-[70ch] rounded-panel border border-edge bg-surface px-4 py-3 text-copy text-body">
            Draft — this post is not listed on the blog index and is not
            indexed.
          </p>
        ) : null}

        <header className="mt-5 flex flex-wrap items-start gap-x-7 gap-y-5">
          <ViewTransition
            name={vtName("post", "cover", post.slug)}
            share="morph"
            default="none"
          >
            <span
              data-vt-cover={post.slug}
              aria-hidden="true"
              className="flex h-[76px] w-[76px] flex-none items-center justify-center rounded-panel border border-white/[0.08] bg-elevated font-display text-[30px] text-meta"
            >
              {n}
            </span>
          </ViewTransition>

          <div className="min-w-0 flex-[1_1_380px]">
            <Eyebrow n={entry.n}>Writing</Eyebrow>

            {/*
              The one place the design demotes the serif. The design note's
              second defended decision keeps the Didone on every heading level
              except this: "the long-form post title, where 26 characters per
              line at 700 weight is more legible". So this <h1> is Inter bold,
              tight, at the post-title step.
            */}
            <ViewTransition
              name={vtName("post", "title", post.slug)}
              share="morph"
              default="none"
            >
              <h1
                data-vt-title={post.slug}
                className="mt-[14px] max-w-[26ch] text-post-title font-bold text-heading"
              >
                {post.title}
              </h1>
            </ViewTransition>

            {/*
              Byline and dateline on one mono row. The author is named on the
              page and not only in the Article JSON-LD: an unattributed
              technical post is the kind of thing Google's guidance on
              experience and expertise asks about, and the name is the entity
              the whole SEO layer is built around.
            */}
            <p className="mt-[14px] flex flex-wrap gap-x-4 gap-y-1 font-mono text-metadata uppercase text-meta">
              <span>{site.name}</span>
              {post.topic ? <span>{post.topic}</span> : null}
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              {post.readingMinutes ? <span>{post.readingMinutes} min</span> : null}
            </p>
          </div>
        </header>

        {/*
          The long-form column. `max-w-[70ch]` is the design note's measure for
          a post body, and it sits on an element carrying the long-form size so
          `ch` resolves against 17px rather than the 16px root.
        */}
        <div className="max-w-[70ch] text-longform">
          <p className="mt-9 border-b border-hairline pb-[30px] text-[18px] leading-[1.7] text-strong">
            {post.summary}
          </p>

          <Mdx source={post.body} />
        </div>
      </article>

      <div className="mt-14 flex max-w-prose flex-wrap gap-4 border-t border-hairline pt-8">
        <Link
          href="/blog"
          data-vt="morph"
          transitionTypes={["morph"]}
          className="inline-flex min-h-control items-center gap-[9px] rounded-full border border-edge px-5 py-[13px] text-[14px] text-heading no-underline transition-colors duration-300 ease-ease hover:border-edge-strong"
        >
          <span aria-hidden="true">←</span> All writing
        </Link>
        <a
          href={`mailto:${site.email}`}
          className="inline-flex min-h-control items-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-[13px] text-[14px] text-heading no-underline transition-colors duration-300 ease-ease hover:bg-white/[0.09]"
        >
          Disagree? Tell me
        </a>
      </div>
    </PageShell>
  );
}
