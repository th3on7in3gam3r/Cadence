/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serverPublicOrigin } from './brand';

/** Marketing & legal pages — not authenticated app routes. */
export const PUBLIC_SITEMAP_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { path: '/features', changefreq: 'monthly', priority: '0.8' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
  { path: '/compare', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.8' },
  { path: '/growth-stack', changefreq: 'monthly', priority: '0.8' },
  { path: '/studio', changefreq: 'monthly', priority: '0.8' },
  { path: '/help', changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/security', changefreq: 'yearly', priority: '0.3' },
  { path: '/data-retention', changefreq: 'yearly', priority: '0.3' },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(origin = serverPublicOrigin()): string {
  const base = origin.replace(/\/+$/, '');
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_SITEMAP_PATHS.map(
    (entry) => `  <url>
    <loc>${xmlEscape(`${base}${entry.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobotsTxt(origin = serverPublicOrigin()): string {
  const base = origin.replace(/\/+$/, '');
  return `User-agent: *
Allow: /
Disallow: /app/

Sitemap: ${base}/sitemap.xml
`;
}
