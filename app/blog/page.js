import Link from "next/link";
import PageShell from "@/components/PageShell";
import { getPublishedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/mdx";
import { site } from "@/lib/site";

export const metadata = {
  title: "Blog",
  description:
    "Engineering notes by Zubair Bin Shaukat on workflow automation, the GoHighLevel API, offline-first mobile apps and the failures worth designing for.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getPublishedPosts();

  return (
    <PageShell trail={[{ name: "Blog", href: "/blog" }]}>
      <h1 className="text-4xl font-bold text-white">Engineering Notes</h1>
      <p className="mt-4 max-w-3xl text-lg text-white/80">
        Notes from things that broke, and what the fix turned out to be.
      </p>

      {posts.length === 0 ? (
        /*
          The designed empty state.

          With every post drafted this is what /blog is, so it has to read as a
          finished page rather than a list that failed to load: a bordered panel
          that says plainly there is nothing here yet, and three routes onward
          so the page is never a dead end. No "coming soon", no skeleton rows,
          no fake dates.
        */
        <section
          aria-labelledby="no-posts"
          className="mt-12 max-w-3xl rounded-lg border border-white/15 bg-black/20 p-8"
        >
          <h2 id="no-posts" className="text-2xl font-semibold text-white">
            No notes published yet
          </h2>
          <p className="mt-3 text-white/80">
            Posts go up here when something is worth writing down properly.
            There is nothing to read on this page today.
          </p>
          <p className="mt-3 text-white/80">
            The case studies cover the same ground in more depth, and the
            service pages describe how the work runs. If you want to talk about
            a project rather than read about one, the contact page has the
            fastest route.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link
                href="/projects"
                className="text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                Selected work
              </Link>
            </li>
            <li>
              <Link
                href="/services/automation"
                className="text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                Automation
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
              >
                Start a project
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="text-white/90 underline underline-offset-4 hover:text-white"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </section>
      ) : (
        <ul className="mt-12 space-y-10">
          {posts.map((post) => (
            <li key={post.slug} className="border-t border-white/15 pt-6">
              <h2 className="text-2xl font-semibold text-white">
                <Link
                  href={`/blog/${post.slug}`}
                  className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-1 text-white/70">
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
                {post.readingMinutes ? ` · ${post.readingMinutes} min read` : null}
                {post.topic ? ` · ${post.topic}` : null}
              </p>
              <p className="mt-3 max-w-3xl text-white/80">{post.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
