/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, PUBLIC_SITEMAP_PATHS } from './sitemap';

describe('sitemap', () => {
  const origin = 'https://cadence.example.com';

  it('lists all public marketing paths', () => {
    const xml = buildSitemapXml(origin);
    for (const entry of PUBLIC_SITEMAP_PATHS) {
      expect(xml).toContain(`${origin}${entry.path}`);
    }
    expect(xml).not.toContain('/app/');
  });

  it('robots allows public site and blocks app', () => {
    const txt = buildRobotsTxt(origin);
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Disallow: /app/');
    expect(txt).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });
});
