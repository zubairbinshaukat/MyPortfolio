import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/JsonLd";
import Mdx from "@/components/Mdx";
import { getPost, getPostSlugs } from "@/lib/blog";
import { articleGraph } from "@/lib/schema";
import { formatDate } from "@/lib/mdx";
import { site } from "@/lib/site";

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

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <PageShell
      trail={[
        { name: "Blog", href: "/blog" },
        { name: post.title, href: `/blog/${post.slug}` },
      ]}
    >
      <JsonLd graph={articleGraph(post)} />

      <article>
        {post.draft ? (
          <p className="mb-4 rounded-md border border-white/25 px-4 py-2 text-white/80">
            Draft — this post is not listed on the blog index and is not
            indexed.
          </p>
        ) : null}

        <h1 className="max-w-3xl text-4xl font-bold text-white">{post.title}</h1>
        <p className="mt-3 text-white/70">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : null}
          {post.topic ? ` · ${post.topic}` : null}
          {" · "}
          <span>{site.name}</span>
        </p>
        <p className="mt-4 max-w-3xl text-lg text-white/80">{post.summary}</p>

        <Mdx source={post.body} />
      </article>

      <p className="mt-16">
        <Link href="/blog" className="text-white underline underline-offset-4">
          All posts
        </Link>
      </p>
    </PageShell>
  );
}
