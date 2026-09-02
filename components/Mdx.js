import { MDXRemote } from "next-mdx-remote-client/rsc";
import Link from "next/link";
import { mdxOptions } from "@/lib/mdx";

/**
 * Element overrides for MDX bodies.
 *
 * Two things matter here beyond styling. Headings start at h2 because the page
 * already owns the h1 — an MDX file that opens with `#` would otherwise put a
 * second h1 on the page. And internal links become next/link so they prefetch
 * and stay client-side, while external ones keep rel="noopener".
 *
 * The type here is the design's long-form column: 17px on 1.8 for body,
 * headings in the display serif at the post-h2 step, mono for the code, and a
 * 66ch measure inherited from the page rather than set per element. A rule
 * runs above every h2 — on a ledger, a new section starts with a line.
 */
const components = {
  h2: (props) => (
    <h2
      className="mt-14 border-t border-hairline pt-8 font-display text-post-h2 text-heading"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-10 text-[17px] font-semibold text-heading" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-8 text-[15px] font-semibold text-heading" {...props} />
  ),
  p: (props) => <p className="mt-[22px] text-longform text-strong" {...props} />,
  ul: (props) => (
    <ul className="mt-[22px] flex flex-col gap-[14px] text-longform text-body" {...props} />
  ),
  ol: (props) => (
    <ol
      className="mt-[22px] flex list-decimal flex-col gap-[14px] pl-6 text-longform text-body"
      {...props}
    />
  ),
  li: (props) => <li className="marker:text-meta" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-[34px] border-l border-accent-line py-[26px] pl-7 font-display text-quote text-heading [&>p]:mt-0 [&>p]:font-display [&>p]:text-quote [&>p]:text-heading"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="mt-6 overflow-x-auto rounded-cover border border-hairline bg-elevated p-5 font-mono text-[12.5px] leading-[1.75] text-strong"
      {...props}
    />
  ),
  code: (props) => <code className="font-mono" {...props} />,
  hr: (props) => <hr className="mt-12 border-hairline" {...props} />,
  figure: (props) => <figure className="mt-7" {...props} />,
  figcaption: (props) => (
    <figcaption className="mt-3 font-mono text-metadata text-meta" {...props} />
  ),
  table: (props) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-copy text-body" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-edge py-2 pr-6 font-mono text-metadata uppercase text-meta"
      {...props}
    />
  ),
  td: (props) => <td className="border-b border-hairline-soft py-2 pr-6" {...props} />,
  strong: (props) => <strong className="font-semibold text-heading" {...props} />,
  a: ({ href = "", ...props }) => {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    return isInternal ? (
      <Link
        href={href}
        className="text-accent-soft underline decoration-accent-line underline-offset-[3px] transition-colors duration-300 ease-ease hover:text-heading"
        {...props}
      />
    ) : (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="text-accent-soft underline decoration-accent-line underline-offset-[3px] transition-colors duration-300 ease-ease hover:text-heading"
        {...props}
      />
    );
  },
};

/** Renders an MDX body as a server component. */
export default function Mdx({ source }) {
  return <MDXRemote source={source} options={mdxOptions} components={components} />;
}
