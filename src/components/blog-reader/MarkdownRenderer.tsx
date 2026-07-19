/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { createMarkdownComponents } from './markdownComponents';

export interface MarkdownRendererProps {
  content: string;
  highlightKeywords?: boolean;
  activeKeywords?: string[];
  className?: string;
}

export default function MarkdownRenderer({
  content,
  highlightKeywords = false,
  activeKeywords = [],
  className = '',
}: MarkdownRendererProps) {
  const components = useMemo(
    () => createMarkdownComponents({ highlightKeywords, activeKeywords }),
    [highlightKeywords, activeKeywords],
  );

  if (!content.trim()) {
    return (
      <p className="text-slate-500 text-sm font-mono">No article content yet.</p>
    );
  }

  return (
    <div className={`blog-article-prose min-w-0 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
