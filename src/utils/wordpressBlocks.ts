/**
 * Convert markdown-style blog copy into WordPress Gutenberg block markup
 * for pasting into the post Code editor.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline markdown: bold, italic, code, links */
export function inlineMarkdownToHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

function isUnorderedListLine(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedListLine(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line);
}

function headingBlock(level: number, text: string): string {
  const tag = `h${Math.min(6, Math.max(1, level))}`;
  const html = inlineMarkdownToHtml(text);
  return `<!-- wp:heading {"level":${level}} -->
<${tag} class="wp-block-heading">${html}</${tag}>
<!-- /wp:heading -->`;
}

function paragraphBlock(text: string): string {
  const html = inlineMarkdownToHtml(text);
  return `<!-- wp:paragraph -->
<p>${html}</p>
<!-- /wp:paragraph -->`;
}

function unorderedListBlock(items: string[]): string {
  const itemsHtml = items
    .map((item) => {
      const html = inlineMarkdownToHtml(item);
      return `<!-- wp:list-item -->
<li>${html}</li>
<!-- /wp:list-item -->`;
    })
    .join('\n');
  return `<!-- wp:list -->
<ul class="wp-block-list">
${itemsHtml}
</ul>
<!-- /wp:list -->`;
}

function orderedListBlock(items: string[]): string {
  const itemsHtml = items
    .map((item) => {
      const html = inlineMarkdownToHtml(item);
      return `<!-- wp:list-item -->
<li>${html}</li>
<!-- /wp:list-item -->`;
    })
    .join('\n');
  return `<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
${itemsHtml}
</ol>
<!-- /wp:list -->`;
}

function quoteBlock(text: string): string {
  const html = inlineMarkdownToHtml(text);
  return `<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>${html}</p></blockquote>
<!-- /wp:quote -->`;
}

function separatorBlock(): string {
  return `<!-- wp:separator -->
<hr class="wp-block-separator has-alpha-channel-opacity"/>
<!-- /wp:separator -->`;
}

function imageBlock(url: string, alt: string): string {
  const safeUrl = escapeHtml(url);
  const safeAlt = escapeHtml(alt);
  return `<!-- wp:image {"align":"wide","sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image alignwide size-large"><img src="${safeUrl}" alt="${safeAlt}"/></figure>
<!-- /wp:image -->`;
}

function subscribeCtaBlock(meta: WordPressSeoMeta): string {
  const brand = meta.brandName?.trim() || 'our blog';
  const headline = `Stay connected with ${brand}`;
  const body =
    meta.summary?.trim() ||
    'Get new articles, encouragement, and practical tips delivered to your inbox.';
  const url = meta.subscribeUrl?.trim() || '#subscribe';
  const buttonLabel = meta.taglineOrCTA?.trim() || 'Subscribe';

  return `<!-- wp:group {"style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem","left":"1.5rem","right":"1.5rem"}},"border":{"radius":"12px"}},"backgroundColor":"base-2","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-base-2-background-color has-background" style="border-radius:12px;padding-top:2rem;padding-right:1.5rem;padding-bottom:2rem;padding-left:1.5rem"><!-- wp:heading {"textAlign":"center","level":3} -->
<h3 class="wp-block-heading has-text-align-center">${escapeHtml(headline)}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">${escapeHtml(body)}</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${escapeHtml(url)}">${escapeHtml(buttonLabel)}</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->`;
}

export interface WordPressSeoMeta {
  title?: string;
  summary?: string;
  taglineOrCTA?: string;
  seoInstructions?: string;
  /** Campaign Studio preview image — embedded as wp:image at top of post body */
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  /** Newsletter / email signup CTA for blog posts */
  brandName?: string;
  subscribeUrl?: string;
  includeSubscribe?: boolean;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSeoCommentBlock(seo: WordPressSeoMeta): string {
  const lines = [
    'CADENCE SEO METADATA',
    'Copy these into WordPress post settings, excerpt, or your SEO plugin (Yoast, Rank Math, etc.)',
    '',
    seo.title ? `Post title: ${seo.title}` : '',
    seo.summary ? `Meta description: ${seo.summary}` : '',
    seo.taglineOrCTA ? `Primary CTA: ${seo.taglineOrCTA}` : '',
    seo.title ? `Suggested slug: ${slugify(seo.title)}` : '',
    seo.featuredImageUrl ? `Featured image URL: ${seo.featuredImageUrl}` : '',
    seo.featuredImageAlt ? `Featured image alt text: ${seo.featuredImageAlt}` : '',
    seo.includeSubscribe && seo.subscribeUrl ? `Subscribe button URL: ${seo.subscribeUrl}` : '',
    seo.seoInstructions ? `SEO strategy:\n${seo.seoInstructions}` : '',
  ].filter((line) => line !== '');

  return `<!--\n${lines.join('\n')}\n-->`;
}

function hasSeoContent(seo: WordPressSeoMeta): boolean {
  return !!(seo.summary || seo.seoInstructions || seo.taglineOrCTA || seo.title);
}

function seoInstructionsToBlocks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const listLines = lines.filter((l) => /^[-*•]\s+/.test(l));
  if (listLines.length >= 2 && listLines.length === lines.length) {
    return [unorderedListBlock(listLines.map((l) => l.replace(/^[-*•]\s+/, '')))];
  }

  return trimmed
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => paragraphBlock(chunk.replace(/\n/g, ' ')));
}

function buildSeoReferenceSection(seo: WordPressSeoMeta): string {
  const blocks: string[] = [
    separatorBlock(),
    headingBlock(3, 'SEO Optimization Notes'),
    paragraphBlock(
      'Generated by Cadence. Set your meta description and slug in WordPress post settings, then delete this section before publishing if you prefer.',
    ),
  ];

  if (seo.summary) {
    blocks.push(paragraphBlock(`**Suggested meta description:** ${seo.summary}`));
  }
  if (seo.title) {
    blocks.push(paragraphBlock(`**Focus title:** ${seo.title}`));
    blocks.push(paragraphBlock(`**Suggested URL slug:** ${slugify(seo.title)}`));
  }
  if (seo.taglineOrCTA) {
    blocks.push(paragraphBlock(`**Primary CTA:** ${seo.taglineOrCTA}`));
  }
  if (seo.seoInstructions?.trim()) {
    blocks.push(headingBlock(4, 'Keywords & search strategy'));
    blocks.push(...seoInstructionsToBlocks(seo.seoInstructions));
  }

  return blocks.join('\n\n');
}

/**
 * Turn Cadence blog markdown into Gutenberg block HTML.
 */
export function toWordPressBlocks(markdown: string, seo?: WordPressSeoMeta): string {
  const normalized = (markdown || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && !lines[i].trim()) i += 1;
    if (i >= lines.length) break;

    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push(headingBlock(headingMatch[1].length, headingMatch[2]));
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(separatorBlock());
      i += 1;
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim() && isUnorderedListLine(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i += 1;
      }
      blocks.push(unorderedListBlock(items));
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim() && isOrderedListLine(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(orderedListBlock(items));
      continue;
    }

    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim() && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(quoteBlock(quoteLines.join(' ')));
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const peek = lines[i];
      if (/^(#{1,6})\s+/.test(peek)) break;
      if (isUnorderedListLine(peek) || isOrderedListLine(peek)) break;
      if (peek.trim().startsWith('>')) break;
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(peek.trim())) break;
      paraLines.push(peek);
      i += 1;
    }
    const text = paraLines.join(' ').trim();
    if (text) blocks.push(paragraphBlock(text));
  }

  const body = blocks.join('\n\n');
  const parts: string[] = [];

  if (seo && hasSeoContent(seo)) {
    parts.push(buildSeoCommentBlock(seo));
  }

  const bodyParts: string[] = [];
  if (seo?.featuredImageUrl?.trim()) {
    bodyParts.push(
      imageBlock(seo.featuredImageUrl.trim(), seo.featuredImageAlt?.trim() || seo.title || 'Featured image'),
    );
  }
  if (body) bodyParts.push(body);
  if (bodyParts.length) parts.push(bodyParts.join('\n\n'));

  if (seo?.includeSubscribe && (seo.brandName || seo.subscribeUrl)) {
    parts.push(subscribeCtaBlock(seo));
  }

  if (seo && hasSeoContent(seo)) {
    parts.push(buildSeoReferenceSection(seo));
  }

  return parts.join('\n\n');
}
