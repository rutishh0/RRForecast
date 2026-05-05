// V5/src/components/foresight/markdown-components.tsx
//
// Component map passed to <ReactMarkdown components={...}>. Provides RR-themed
// styling (gold accents, navy backgrounds) plus internal-link routing through
// react-router-dom so a `[ESN 12345](/engine-map?esn=12345)` link from Gemini
// becomes a client-side navigation rather than a full page load.

import { Link } from "react-router-dom";
import type { Components } from "react-markdown";

export const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,

  ul: ({ children }) => (
    <ul className="space-y-1.5 pl-0 mb-3 last:mb-0 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 pl-0 mb-3 last:mb-0 list-none counter-reset-foresight">
      {children}
    </ol>
  ),
  li: ({ children, ...rest }) => {
    // react-markdown 10 doesn't pass `ordered` directly; we infer it from the
    // node's parent tagName via the standard `node` prop instead.
    const node = (rest as { node?: { type?: string; tagName?: string } }).node;
    const ordered = node?.tagName === "ol" || node?.type === "ordered";
    return (
      <li
        className={`relative pl-5 ${
          ordered ? "foresight-li-ordered" : "foresight-li-bullet"
        }`}
      >
        {children}
      </li>
    );
  },

  strong: ({ children }) => (
    <strong className="font-semibold text-rr-gold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-rr-text-dim">{children}</em>,

  code: ({ className, children, ...rest }) => {
    // react-markdown 10 no longer passes `inline`. We treat any <code> with no
    // language class and no newline as inline; everything else renders as a
    // fenced code block.
    const text = String(children ?? "");
    const inline = !className && !text.includes("\n");
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-rr-navy-50 text-rr-text font-mono text-[0.85em]"
          {...rest}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="my-3 p-3 rounded border border-rr-border bg-rr-navy-50 overflow-x-auto">
        <code className={`font-mono text-sm ${className ?? ""}`} {...rest}>
          {children}
        </code>
      </pre>
    );
  },

  h1: ({ children }) => (
    <h1 className="mt-4 mb-3 pb-2 border-b border-rr-border text-lg font-bold text-rr-text">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-base font-bold text-rr-text">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-xs uppercase tracking-wider font-semibold text-rr-gold">
      {children}
    </h3>
  ),

  a: ({ href, children, ...rest }) => {
    const isInternal = typeof href === "string" && href.startsWith("/");
    if (isInternal && typeof href === "string") {
      return (
        <Link
          to={href}
          className="text-rr-gold underline underline-offset-2 hover:text-rr-gold-bright"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-rr-gold underline underline-offset-2 hover:text-rr-gold-bright"
        {...rest}
      >
        {children}
      </a>
    );
  },

  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3 border-l-2 border-rr-gold/60 text-rr-text-dim">
      {children}
    </blockquote>
  ),

  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="border-collapse border border-rr-border w-full text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-rr-border px-2 py-1 bg-rr-navy-50 text-left text-rr-text">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-rr-border px-2 py-1 text-rr-text-dim">{children}</td>
  ),
};
