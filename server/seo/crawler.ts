/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface TechnicalSeoIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  fix: string;
}

export interface CrawledPage {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1: string[];
  h2Count: number;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  hasViewport: boolean;
  hasLang: boolean;
  depth?: number;
  modules?: PageModule[];
  loadError?: string;
  issues: TechnicalSeoIssue[];
}

export interface PageModule {
  id: string;
  label: string;
  wordCount: number;
  linkCount: number;
  hasHeading: boolean;
}

export interface LinkGraphNode {
  url: string;
  depth: number;
  internalLinks: number;
}

export interface LinkGraphEdge {
  from: string;
  to: string;
}

export interface SiteCrawlResult {
  baseUrl: string;
  crawledAt: string;
  crawlMode: 'quick' | 'deep';
  pagesCrawled: number;
  pagesDiscovered: number;
  pages: CrawledPage[];
  siteWideIssues: TechnicalSeoIssue[];
  linkGraph?: {
    nodes: LinkGraphNode[];
    edges: LinkGraphEdge[];
    orphanPages: string[];
  };
}

const DEFAULT_QUICK_PAGES = 20;
const FETCH_TIMEOUT_MS = 8000;

function normalizeUrl(base: URL, href: string): string | null {
  try {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return null;
    }
    const resolved = new URL(href, base);
    if (resolved.origin !== base.origin) return null;
    resolved.hash = '';
    return resolved.href.replace(/\/$/, '') || resolved.href;
  } catch {
    return null;
  }
}

function extractMeta(html: string, name: string, attr: 'name' | 'property' = 'name'): string {
  const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${name}["']`, 'i');
  return (html.match(re)?.[1] || html.match(re2)?.[1] || '').trim();
}

function extractTag(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
  return out;
}

function extractLinkHrefs(html: string): string[] {
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractModules(html: string): PageModule[] {
  const modules: PageModule[] = [];
  const sections: { id: string; label: string }[] = [
    { id: 'nav', label: 'Navigation' },
    { id: 'header', label: 'Header' },
    { id: 'main', label: 'Main content' },
    { id: 'article', label: 'Article' },
    { id: 'section', label: 'Section' },
    { id: 'aside', label: 'Sidebar' },
    { id: 'footer', label: 'Footer' },
  ];
  for (const { id, label } of sections) {
    const re = new RegExp(`<${id}[^>]*>([\\s\\S]*?)<\\/${id}>`, 'i');
    const m = html.match(re);
    if (!m) continue;
    const chunk = m[1];
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    modules.push({
      id,
      label,
      wordCount: countWords(text),
      linkCount: extractLinkHrefs(chunk).length,
      hasHeading: /<h[1-6]/i.test(chunk),
    });
  }
  return modules;
}

function analyzePage(
  url: string,
  statusCode: number,
  html: string,
  base: URL,
  depth: number,
  includeModules: boolean
): CrawledPage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] || '').replace(/\s+/g, ' ').trim();
  const metaDescription = extractMeta(html, 'description');
  const h1 = extractTag(html, 'h1');
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const canonical = canonicalMatch?.[1] || '';
  const robots = extractMeta(html, 'robots');
  const ogTitle = extractMeta(html, 'og:title', 'property');
  const ogDescription = extractMeta(html, 'og:description', 'property');
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasLang = /<html[^>]+lang=["']/i.test(html);

  const bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = countWords(bodyText);

  const hrefs = extractLinkHrefs(html);
  let internalLinks = 0;
  let externalLinks = 0;
  for (const href of hrefs) {
    try {
      const u = new URL(href, base);
      if (u.origin === base.origin) internalLinks++;
      else externalLinks++;
    } catch {
      /* skip */
    }
  }

  const issues: TechnicalSeoIssue[] = [];

  if (!title) {
    issues.push({ severity: 'critical', code: 'MISSING_TITLE', message: 'Page has no <title> tag.', fix: 'Add a unique, keyword-rich title (30–60 characters).' });
  } else if (title.length < 30) {
    issues.push({ severity: 'warning', code: 'TITLE_SHORT', message: `Title is only ${title.length} characters.`, fix: 'Expand title to 30–60 characters with primary keyword.' });
  } else if (title.length > 65) {
    issues.push({ severity: 'warning', code: 'TITLE_LONG', message: `Title is ${title.length} characters and may truncate in SERPs.`, fix: 'Shorten title to under 60 characters.' });
  }

  if (!metaDescription) {
    issues.push({ severity: 'critical', code: 'MISSING_META_DESC', message: 'Missing meta description.', fix: 'Add a compelling meta description (110–170 characters).' });
  } else if (metaDescription.length < 70) {
    issues.push({ severity: 'warning', code: 'META_DESC_SHORT', message: 'Meta description is too short.', fix: 'Expand to 110–170 characters with CTA and keywords.' });
  } else if (metaDescription.length > 170) {
    issues.push({ severity: 'warning', code: 'META_DESC_LONG', message: 'Meta description may truncate in search snippets.', fix: 'Trim to 110–170 characters.' });
  }

  if (h1.length === 0) {
    issues.push({ severity: 'critical', code: 'MISSING_H1', message: 'No H1 heading found.', fix: 'Add one clear H1 with primary topic keyword.' });
  } else if (h1.length > 1) {
    issues.push({ severity: 'warning', code: 'MULTIPLE_H1', message: `${h1.length} H1 tags detected.`, fix: 'Use a single H1 per page; demote extras to H2.' });
  }

  if (!hasViewport) {
    issues.push({ severity: 'warning', code: 'NO_VIEWPORT', message: 'Missing viewport meta tag.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });
  }
  if (!hasLang) {
    issues.push({ severity: 'info', code: 'NO_HTML_LANG', message: 'HTML lang attribute missing.', fix: 'Set lang on <html> (e.g. lang="en").' });
  }
  if (wordCount < 300) {
    issues.push({ severity: 'warning', code: 'THIN_CONTENT', message: `Only ~${wordCount} words of body content.`, fix: 'Add substantive copy (300+ words) for competitive rankings.' });
  }
  if (h2Count === 0 && wordCount > 200) {
    issues.push({ severity: 'info', code: 'NO_H2_STRUCTURE', message: 'No H2 subheadings for content structure.', fix: 'Break content into scannable H2/H3 sections.' });
  }
  if (robots.toLowerCase().includes('noindex')) {
    issues.push({ severity: 'critical', code: 'NOINDEX', message: 'Page is set to noindex.', fix: 'Remove noindex if this page should rank in search.' });
  }

  return {
    url,
    statusCode,
    title,
    metaDescription,
    h1,
    h2Count,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    wordCount,
    internalLinks,
    externalLinks,
    hasViewport,
    hasLang,
    depth,
    ...(includeModules ? { modules: extractModules(html) } : {}),
    issues,
  };
}

async function fetchPage(url: string): Promise<{ statusCode: number; html: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Cadence-SEO-Crawler/1.0' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    const html = await res.text();
    return { statusCode: res.status, html };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fetch failed';
    return { statusCode: 0, html: '', error: msg };
  }
}

function detectSiteWideIssues(pages: CrawledPage[]): TechnicalSeoIssue[] {
  const siteWide: TechnicalSeoIssue[] = [];
  const titles = pages.map((p) => p.title).filter(Boolean);
  const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupTitles.length > 0) {
    siteWide.push({
      severity: 'critical',
      code: 'DUPLICATE_TITLES',
      message: `${new Set(dupTitles).size} duplicate title tag(s) across pages.`,
      fix: 'Assign unique titles per URL.',
    });
  }
  const missingMeta = pages.filter((p) => !p.metaDescription).length;
  if (missingMeta > 0) {
    siteWide.push({
      severity: 'warning',
      code: 'SITE_META_GAPS',
      message: `${missingMeta} page(s) missing meta descriptions.`,
      fix: 'Complete meta descriptions sitewide.',
    });
  }
  const criticalCount = pages.reduce((n, p) => n + p.issues.filter((i) => i.severity === 'critical').length, 0);
  if (criticalCount > 5) {
    siteWide.push({
      severity: 'critical',
      code: 'HIGH_CRITICAL_COUNT',
      message: `${criticalCount} critical page-level issues found.`,
      fix: 'Prioritize critical fixes before content expansion.',
    });
  }
  return siteWide;
}

function buildLinkGraph(
  pages: CrawledPage[],
  edges: LinkGraphEdge[],
  homeUrl: string
): SiteCrawlResult['linkGraph'] {
  const linkedTo = new Set(edges.map((e) => e.to.replace(/\/$/, '') || e.to));
  const orphanPages = pages
    .filter((p) => {
      const norm = p.url.replace(/\/$/, '') || p.url;
      const homeNorm = homeUrl.replace(/\/$/, '') || homeUrl;
      return norm !== homeNorm && !linkedTo.has(norm);
    })
    .map((p) => p.url);

  return {
    nodes: pages.map((p) => ({
      url: p.url,
      depth: p.depth ?? 0,
      internalLinks: p.internalLinks,
    })),
    edges,
    orphanPages,
  };
}

export async function crawlWebsite(
  siteUrl: string,
  maxPages = DEFAULT_QUICK_PAGES,
  options: { mode?: 'quick' | 'deep' } = {}
): Promise<SiteCrawlResult> {
  const mode = options.mode || 'quick';
  const includeModules = mode === 'deep';
  const trimmed = siteUrl.trim();
  const formatted = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  const base = new URL(formatted);
  const homeNorm = base.href.replace(/\/$/, '') || base.href;
  const queue: { url: string; depth: number }[] = [{ url: homeNorm, depth: 0 }];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const edges: LinkGraphEdge[] = [];
  let discovered = 0;

  while (queue.length > 0 && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    const norm = url.replace(/\/$/, '') || url;
    if (visited.has(norm)) continue;
    visited.add(norm);

    const { statusCode, html, error } = await fetchPage(norm);
    if (error || !html) {
      pages.push({
        url: norm,
        statusCode,
        title: '',
        metaDescription: '',
        h1: [],
        h2Count: 0,
        canonical: '',
        robots: '',
        ogTitle: '',
        ogDescription: '',
        wordCount: 0,
        internalLinks: 0,
        externalLinks: 0,
        hasViewport: false,
        hasLang: false,
        depth,
        loadError: error,
        issues: [{ severity: 'critical', code: 'FETCH_FAILED', message: error || 'Could not load page.', fix: 'Fix server availability or URL.' }],
      });
      continue;
    }

    const page = analyzePage(norm, statusCode, html, base, depth, includeModules);
    pages.push(page);

    for (const href of extractLinkHrefs(html)) {
      const internal = normalizeUrl(base, href);
      if (!internal) continue;
      const targetNorm = internal.replace(/\/$/, '') || internal;
      edges.push({ from: norm, to: targetNorm });
      if (!visited.has(targetNorm)) {
        discovered++;
        queue.push({ url: targetNorm, depth: depth + 1 });
      }
    }
  }

  const pagesDiscovered = visited.size + queue.length;

  return {
    baseUrl: base.href,
    crawledAt: new Date().toISOString(),
    crawlMode: mode,
    pagesCrawled: pages.length,
    pagesDiscovered,
    pages,
    siteWideIssues: detectSiteWideIssues(pages),
    ...(mode === 'deep'
      ? { linkGraph: buildLinkGraph(pages, edges, homeNorm) }
      : {}),
  };
}
