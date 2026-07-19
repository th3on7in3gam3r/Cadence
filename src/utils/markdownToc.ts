/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Heading extraction and inline ToC stripping for blog reader preview.
 */

import GithubSlugger from 'github-slugger';

export interface MarkdownHeading {
  id: string;
  title: string;
  level: number;
}

/** Slugify heading text (matches rehype-slug / github-slugger behavior). */
export function slugifyHeading(text: string, slugger?: GithubSlugger): string {
  const s = slugger ?? new GithubSlugger();
  return s.slug(text);
}

/** Strip inline markdown formatting for heading title display. */
export function plainHeadingTitle(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

/** Extract H2 headings with stable slug IDs. */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger();
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const title = plainHeadingTitle(h2[1]);
      if (!title) continue;
      const lower = title.toLowerCase();
      if (lower === 'table of contents') continue;
      headings.push({
        id: slugger.slug(title),
        title,
        level: 2,
      });
    }
  }

  return headings;
}

const TOC_HEADING_RE = /^#{2,3}\s+table of contents\s*$/i;

function isTocListLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^[-*+]\s+/.test(t)) return true;
  if (/^\d+\.\s+/.test(t)) return true;
  return false;
}

/** Remove inline Table of Contents block from markdown (sidebar ToC replaces it). */
export function stripInlineTableOfContents(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (TOC_HEADING_RE.test(line.trim())) {
      i += 1;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (next === '') {
          i += 1;
          continue;
        }
        if (isTocListLine(lines[i])) {
          i += 1;
          continue;
        }
        if (/^#{1,6}\s/.test(next)) break;
        i += 1;
      }
      continue;
    }
    out.push(line);
    i += 1;
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Remove leading H1 when it duplicates the asset title. */
export function stripDuplicateTitleH1(markdown: string, assetTitle: string): string {
  const title = assetTitle?.trim();
  if (!title) return markdown;

  const lines = markdown.split('\n');
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') start += 1;
  if (start >= lines.length) return markdown;

  const h1 = lines[start].match(/^#\s+(.+)$/);
  if (!h1) return markdown;

  const h1Text = plainHeadingTitle(h1[1]);
  if (h1Text.toLowerCase() !== title.toLowerCase()) return markdown;

  const rest = lines.slice(start + 1);
  while (rest.length > 0 && rest[0].trim() === '') rest.shift();
  return rest.join('\n');
}

/** Full preprocess pipeline for blog article body. */
export function preprocessBlogMarkdown(markdown: string, assetTitle?: string): string {
  let body = stripInlineTableOfContents(markdown);
  if (assetTitle) body = stripDuplicateTitleH1(body, assetTitle);
  return body;
}

export function estimateReadMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
