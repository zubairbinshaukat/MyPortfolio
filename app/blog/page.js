import { ViewTransition } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import { getPublishedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/mdx";
import { navEntry, site } from "@/lib/site";
import { vtName } from "@/lib/view-transitions";

export const metadata = {
  title: "Blog",
  description:
    "Engineering notes by Zubair Bin Shaukat on workflow automation, the GoHighLevel API, offline-first mobile apps and the failures worth designing for.",
  alternates: { canonical: "/blog" },
};

const entry = navEntry("/blog");

export default function BlogPage() {
  const posts = getPublishedPosts();

  if (posts.length === 0) {
    /*
      The designed empty state — the prototype draws this one too (view 07,
      "Nothing published yet"), because with every post drafted it is what
      /blog actually is. It has to read as a finished page rather than a list
      that failed to load: a plain statement that there is nothing here, and
      routes onward so the page is never a dead end. No "coming soon", no
      skeleton rows, no fake dates.

      The prototype's empty state lists three drafts with expected months. That
      is not built: a publication date is a commitment, and none of these has
      one that anybody has agreed to.
    */
    return (
      <PageShell
        trail={[{ name: "Blog", href: "/blog" }]}
        readout={`${entry.n} — ${entry.label}`}
      >
        {/*
          The <h1> is "Engineering Notes" in both states, because PLAN §1.2
          fixes it there. The prototype's empty state opens with "Nothing
          published yet." as its headline; here that line is the section
          heading under it, which says the same thing without the route's
          title changing depending on whether anything has been published.
        */}
        <PageHeader
          n={entry.n}
          eyebrow="Writing"
          title="Engineering Notes"
          lede="Notes from things that broke, and what the fix turned out to be."
        />

        <section aria-labelledby="no-posts" className="mt-14 max-w-prose">
          <h2
            id="no-posts"
            className="max-w-[18ch] font-display text-section-h2 text-heading"
          >
            No notes published yet.
          </h2>
          <p className="mt-[22px] text-lede text-strong">
            Posts go up here when something is worth writing down properly.
            There is nothing to read on this page today.
          </p>
          <p className="mt-[18px] text-copy text-body">
            The case studies cover the same ground in more depth, and the
            service pages describe how the work runs. If you want to talk about
            a project rather than read about one, the contact page has the
            fastest route.
          </p>

          <ul className="mt-8 border-t border-hairline">
            {[
              { href: "/projects", label: "Selected work", blurb: "Systems in production, written up" },
              { href: "/services/automation", label: "Automation", blurb: "n8n pipelines with runbooks" },
              { href: "/contact", label: "Start a project", blurb: "One message, one reply" },
            ].map((item, i) => (
              <li key={item.href} className="group relative border-b border-hairline">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-5 transition-[padding-left] duration-[400ms] ease-ease group-hover:pl-2">
                  <span className="w-[26px] flex-none font-mono text-[11px] text-meta">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="flex-1 font-display text-item-h3 text-heading">
                    <Link
                      href={item.href}
                      className="no-underline after:absolute after:inset-0 after:content-['']"
                    >
                      {item.label}
                    </Link>
                  </h3>
                  <span className="font-mono text-metadata uppercase text-meta">
                    {item.blurb}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8">
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Tell me when you publish")}`}
              className="inline-flex min-h-control items-center gap-[10px] rounded-full border border-edge px-5 py-[14px] text-[14.5px] text-heading no-underline transition-colors duration-300 ease-ease hover:border-accent-line"
            >
              {site.email}
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      trail={[{ name: "Blog", href: "/blog" }]}
      readout={`${entry.n} — ${entry.label}`}
    >
      <PageHeader
        n={entry.n}
        eyebrow="Writing"
        title="Engineering Notes"
        lede="Write-ups of specific problems, with the code that fixed them. No round-ups, no tool lists."
      />

      <ol className="mt-12 border-t border-hairline">
        {posts.map((post, i) => (
          <li key={post.slug} className="group relative border-b border-hairline">
            <div className="flex flex-wrap items-start gap-x-7 gap-y-[18px] py-6 transition-[padding-left] duration-[400ms] ease-ease group-hover:pl-2">
              {/*
                The post's index, drawn at the cover size the design uses for a
                writing row, and the list half of PLAN §3.2's shared element:
                the same square, with the same number in it, grows from 66px to
                76px on the way into the post. The number is the row's position
                in the published list, and app/blog/[slug]/page.js recomputes it
                from the same list so the two never disagree mid-morph.
              */}
              <ViewTransition
                name={vtName("post", "cover", post.slug)}
                share="morph"
                default="none"
              >
                <span
                  data-vt-cover={post.slug}
                  aria-hidden="true"
                  className="flex h-[66px] w-[66px] flex-none items-center justify-center rounded-cover border border-white/[0.08] bg-elevated font-display text-[26px] text-meta"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </ViewTransition>

              <div className="min-w-0 flex-[1_1_320px]">
                <ViewTransition
                  name={vtName("post", "title", post.slug)}
                  share="morph"
                  default="none"
                >
                  <h2
                    data-vt-title={post.slug}
                    className="max-w-[44ch] text-[19px] font-semibold leading-[1.35] text-heading"
                  >
                    {/* See components/ProjectRow.js — this row morphs too. */}
                    <Link
                      href={`/blog/${post.slug}`}
                      data-vt="morph"
                      transitionTypes={["morph"]}
                      className="no-underline after:absolute after:inset-0 after:content-['']"
                    >
                      {post.title}
                    </Link>
                  </h2>
                </ViewTransition>
                <p className="mt-2 max-w-[60ch] text-[14.5px] leading-[1.7] text-body">
                  {post.summary}
                </p>
                <div className="mt-[10px] flex flex-wrap gap-x-4 gap-y-[6px] font-mono text-metadata uppercase text-meta">
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                  {post.readingMinutes ? <span>{post.readingMinutes} min</span> : null}
                  {post.topic ? <span>{post.topic}</span> : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
