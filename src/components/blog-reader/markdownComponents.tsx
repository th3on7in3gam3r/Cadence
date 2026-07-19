/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Components } from 'react-markdown';

export interface MarkdownHighlightOptions {
  highlightKeywords?: boolean;
  activeKeywords?: string[];
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/** Highlight target keywords in plain text. */
export function highlightText(
  text: string,
  options: MarkdownHighlightOptions,
): React.ReactNode {
  const { highlightKeywords, activeKeywords = [] } = options;
  if (!highlightKeywords || activeKeywords.length === 0 || !text) return text;

  const escaped = activeKeywords
    .filter((k) => k.trim().length > 1)
    .map(escapeRegex);
  if (escaped.length === 0) return text;

  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = activeKeywords.some((k) => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark
            key={i}
            className="bg-amber-500/25 text-amber-300 font-bold px-1 rounded border border-amber-600/35"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

function processChildren(
  children: React.ReactNode,
  options: MarkdownHighlightOptions,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') return highlightText(child, options);
    return child;
  });
}

let h2Index = 0;

export function createMarkdownComponents(
  options: MarkdownHighlightOptions,
): Components {
  h2Index = 0;

  return {
    h1: ({ children }) => (
      <h1 className="text-[32px] font-extrabold text-white tracking-tight font-display mt-0 mb-6">
        {processChildren(children, options)}
      </h1>
    ),
    h2: ({ children, node }) => {
      const isFirst = h2Index === 0;
      h2Index += 1;
      const id = (node?.properties?.id as string) || undefined;
      return (
        <h2
          id={id}
          className={`text-2xl font-bold text-white font-display scroll-mt-24 border-l-2 border-emerald-500 pl-4 ${
            isFirst ? 'mt-0 pt-0' : 'mt-12 lg:mt-16 pt-12 border-t border-white/[0.06]'
          } mb-4`}
        >
          {processChildren(children, options)}
        </h2>
      );
    },
    h3: ({ children, node }) => {
      const id = (node?.properties?.id as string) || undefined;
      return (
        <h3
          id={id}
          className="text-lg font-semibold text-slate-300 font-display mt-8 mb-3 scroll-mt-24"
        >
          {processChildren(children, options)}
        </h3>
      );
    },
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-slate-300 mt-6 mb-2">
        {processChildren(children, options)}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-base md:text-[16px] text-[#CBD5E1] leading-[1.75] mb-5">
        {processChildren(children, options)}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{processChildren(children, options)}</strong>
    ),
    em: ({ children }) => (
      <em className="text-slate-300 italic">{processChildren(children, options)}</em>
    ),
    a: ({ href, children }) => {
      const isAnchor = href?.startsWith('#');
      return (
        <a
          href={href}
          className={`text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 ${
            isAnchor ? 'scroll-mt-24' : ''
          }`}
          {...(!isAnchor ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {processChildren(children, options)}
        </a>
      );
    },
    hr: () => <hr className="border-0 border-t border-white/10 opacity-60 my-12" />,
    ul: ({ children }) => (
      <ul className="list-none space-y-3 my-5 pl-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-none space-y-4 my-6 blog-ol-steps [counter-reset:blog-step]">{children}</ol>
    ),
    li: ({ children, node }) => {
      const parentTag = (node as { parent?: { tagName?: string } } | undefined)?.parent?.tagName;
      const ordered = parentTag === 'ol';
      if (ordered) {
        return (
          <li className="flex gap-3 border border-slate-800 bg-slate-950/50 rounded-xl p-4 blog-ol-step">
            <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center blog-ol-step-badge" />
            <span className="text-[#CBD5E1] leading-[1.75] flex-1 min-w-0">{processChildren(children, options)}</span>
          </li>
        );
      }
      return (
        <li className="flex gap-3 items-start text-[#CBD5E1] leading-[1.75] before:content-[''] before:shrink-0 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400 before:mt-[0.65rem]">
          <span className="flex-1 min-w-0">{processChildren(children, options)}</span>
        </li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-slate-700 pl-4 my-6 text-slate-400 italic">
        {children}
      </blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <code className="block bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm font-mono text-slate-300 overflow-x-auto my-4">
            {children}
          </code>
        );
      }
      return (
        <code className="bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-4 overflow-x-auto">{children}</pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border border-slate-800 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-slate-900 text-left text-white font-semibold px-4 py-2 border-b border-slate-800">
        {processChildren(children, options)}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border-b border-slate-850 text-[#CBD5E1]">
        {processChildren(children, options)}
      </td>
    ),
  };
}
