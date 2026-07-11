import { describe, it, expect } from 'vitest';
import { toWordPressBlocks, inlineMarkdownToHtml } from './wordpressBlocks';

describe('wordpressBlocks', () => {
  it('converts headings', () => {
    const out = toWordPressBlocks('### Table of Contents');
    expect(out).toContain('<!-- wp:heading {"level":3} -->');
    expect(out).toContain('<h3 class="wp-block-heading">Table of Contents</h3>');
  });

  it('converts unordered lists with links', () => {
    const out = toWordPressBlocks(
      '- [Intro](#intro)\n- [Second section](#second)',
    );
    expect(out).toContain('<!-- wp:list -->');
    expect(out).toContain('<ul class="wp-block-list">');
    expect(out).toContain('<a href="#intro">Intro</a>');
    expect(out).toContain('<!-- wp:list-item -->');
  });

  it('converts paragraphs and bold', () => {
    const out = toWordPressBlocks('Hello **world**.\n\nSecond paragraph.');
    expect(out).toContain('<!-- wp:paragraph -->');
    expect(out).toContain('<strong>world</strong>');
    expect(out.match(/<!-- wp:paragraph -->/g)?.length).toBe(2);
  });

  it('escapes raw HTML in source text', () => {
    expect(inlineMarkdownToHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('appends SEO section and top comment when metadata provided', () => {
    const out = toWordPressBlocks('## Intro\n\nHello world.', {
      title: 'My Post Title',
      summary: 'A compelling meta description for search.',
      taglineOrCTA: 'Start your free trial',
      seoInstructions: '- focus keyword one\n- focus keyword two',
    });
    expect(out).toContain('CADENCE SEO METADATA');
    expect(out).toContain('Meta description: A compelling meta description');
    expect(out).toContain('SEO Optimization Notes');
    expect(out).toContain('Suggested meta description');
    expect(out).toContain('focus keyword one');
    expect(out).toContain('<!-- wp:heading {"level":3} -->');
    expect(out).toContain('Hello world.');
  });

  it('embeds featured image as wp:image block at top of body', () => {
    const out = toWordPressBlocks('## Intro\n\nHello world.', {
      title: 'My Post',
      featuredImageUrl: 'https://example.com/hero.jpg',
      featuredImageAlt: 'Hero banner',
    });
    expect(out).toContain('<!-- wp:image');
    expect(out).toContain('src="https://example.com/hero.jpg"');
    expect(out).toContain('alt="Hero banner"');
    expect(out.indexOf('<!-- wp:image')).toBeLessThan(out.indexOf('<!-- wp:heading'));
  });

  it('adds subscribe CTA block for blog exports', () => {
    const out = toWordPressBlocks('## Intro\n\nHello world.', {
      title: 'Faith at Home',
      brandName: 'Bible Funland',
      subscribeUrl: 'https://biblefunland.com/#subscribe',
      taglineOrCTA: 'Subscribe',
      includeSubscribe: true,
    });
    expect(out).toContain('<!-- wp:buttons');
    expect(out).toContain('href="https://biblefunland.com/#subscribe"');
    expect(out).toContain('Subscribe');
    expect(out).toContain('Stay connected with Bible Funland');
  });
});
