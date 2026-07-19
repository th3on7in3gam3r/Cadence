/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  extractHeadings,
  preprocessBlogMarkdown,
  slugifyHeading,
  stripInlineTableOfContents,
  stripDuplicateTitleH1,
  estimateReadMinutes,
} from './markdownToc';

describe('markdownToc', () => {
  it('extracts H2 headings with slug IDs', () => {
    const md = `## First Section\n\nBody\n\n## Second Section`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(2);
    expect(headings[0]).toMatchObject({ title: 'First Section', level: 2 });
    expect(headings[0].id).toBe('first-section');
    expect(headings[1].id).toBe('second-section');
  });

  it('skips Table of Contents heading in extraction', () => {
    const md = `## Table of Contents\n\n## Real Section`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(1);
    expect(headings[0].title).toBe('Real Section');
  });

  it('strips inline Table of Contents block', () => {
    const md = `# Title

## Table of Contents
- [Intro](#intro)
- [Body](#body)

## Intro
Hello`;
    const stripped = stripInlineTableOfContents(md);
    expect(stripped).not.toContain('Table of Contents');
    expect(stripped).not.toContain('[Intro](#intro)');
    expect(stripped).toContain('## Intro');
  });

  it('strips duplicate H1 matching asset title', () => {
    const md = `# My Post Title\n\nParagraph`;
    expect(stripDuplicateTitleH1(md, 'My Post Title')).toBe('Paragraph');
  });

  it('preprocessBlogMarkdown combines strip steps', () => {
    const md = `# Brand Post

### Table of Contents
- [One](#one)

## One
Content`;
    const out = preprocessBlogMarkdown(md, 'Brand Post');
    expect(out).not.toContain('Table of Contents');
    expect(out).toContain('## One');
  });

  it('slugifyHeading matches github-slugger', () => {
    expect(slugifyHeading('Hello World!')).toBe('hello-world');
  });

  it('estimateReadMinutes uses 200 wpm', () => {
    expect(estimateReadMinutes(400)).toBe(2);
    expect(estimateReadMinutes(50)).toBe(1);
  });
});
