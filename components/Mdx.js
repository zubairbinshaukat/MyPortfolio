import { MDXRemote } from "next-mdx-remote-client/rsc";
import Link from "next/link";
import { mdxOptions } from "@/lib/mdx";

/**
 * Element overrides for MDX bodies.
 *
 * Two things matter here beyond styling. Headings start at h2 because the
 * page already owns the h1 — an MDX file that opens with `#` would otherwise
 * put a second h1 on the page. And internal links become next/link so they
 * prefetch and stay client-side, while external ones keep rel="noopener".
 */
const components = {
  h2: (props) => (
    <h2 className="mt-12 text-2xl font-bold text-white" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-8 text-xl font-semibold text-white" {...props} />
  ),
  p: (props) => <p className="mt-4 max-w-3xl text-white/80" {...props} />,
  ul: (props) => (
    <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-6 text-white/80" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-6 text-white/80" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="mt-6 max-w-3xl border-l-2 border-purple-400 pl-4 text-white/80"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="mt-6 overflow-x-auto rounded-lg border border-white/15 bg-black/50 p-4 text-white/90"
      {...props}
    />
  ),
  code: (props) => <code className="text-white/90" {...props} />,
  hr: (props) => <hr className="mt-12 border-white/15" {...props} />,
  table: (props) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-white/80" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-white/25 py-2 pr-6 font-semibold text-white" {...props} />
  ),
  td: (props) => <td className="border-b border-white/10 py-2 pr-6" {...props} />,
  a: ({ href = "", ...props }) => {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    return isInternal ? (
      <Link href={href} className="text-white underline underline-offset-4" {...props} />
    ) : (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="text-white underline underline-offset-4"
        {...props}
      />
    );
  },
};

/** Renders an MDX body as a server component. */
export default function Mdx({ source }) {
  return <MDXRemote source={source} options={mdxOptions} components={components} />;
}
