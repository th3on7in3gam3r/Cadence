/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlogArticleHero from './BlogArticleHero';
import BlogArticleCta from './BlogArticleCta';
import BlogReadingProgress from './BlogReadingProgress';
import BlogTableOfContents from './BlogTableOfContents';
import MarkdownRenderer from './MarkdownRenderer';
import {
  countWords,
  estimateReadMinutes,
  extractHeadings,
  preprocessBlogMarkdown,
} from '../../utils/markdownToc';

export interface BlogArticleReaderProps {
  content: string;
  title: string;
  summary?: string;
  cta?: string;
  ctaUrl?: string;
  brandName: string;
  highlightKeywords?: boolean;
  activeKeywords?: string[];
}

export default function BlogArticleReader({
  content,
  title,
  summary,
  cta,
  ctaUrl,
  brandName,
  highlightKeywords = false,
  activeKeywords = [],
}: BlogArticleReaderProps) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const processedContent = useMemo(
    () => preprocessBlogMarkdown(content, title),
    [content, title],
  );

  const headings = useMemo(() => extractHeadings(processedContent), [processedContent]);
  const wordCount = useMemo(() => countWords(processedContent), [processedContent]);
  const readMinutes = estimateReadMinutes(wordCount);

  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    const nodes = articleRef.current?.querySelectorAll('h2[id]') ?? [];
    nodes.forEach((node) => observer.observe(node));

    if (headings.length > 0 && !activeId) {
      setActiveId(headings[0].id);
    }

    return () => observer.disconnect();
  }, [headings, processedContent]);

  return (
    <>
      <BlogReadingProgress />

      <div className="px-6 md:px-12 -mx-2 md:-mx-0">
        <BlogArticleHero
          title={title}
          brandName={brandName}
          readMinutes={readMinutes}
          summary={summary}
        />

        <BlogTableOfContents
          headings={headings}
          activeId={activeId}
          onNavigate={handleNavigate}
          collapsible
        />

        <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 xl:gap-12 items-start">
          <div ref={articleRef} className="min-w-0 max-w-[680px] w-full text-[15px] md:text-base">
            <MarkdownRenderer
              content={processedContent}
              highlightKeywords={highlightKeywords}
              activeKeywords={activeKeywords}
            />
            <BlogArticleCta cta={cta || ''} ctaUrl={ctaUrl} />
          </div>

          <BlogTableOfContents
            headings={headings}
            activeId={activeId}
            onNavigate={handleNavigate}
            collapsible={false}
          />
        </div>
      </div>
    </>
  );
}
