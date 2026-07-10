import { describe, it, expect } from 'vitest';
import { parseAppPath, buildAppPath, slugifyBrandId } from './appPaths';

describe('appPaths', () => {
  it('slugifies brand URLs', () => {
    expect(slugifyBrandId('https://acme.com/')).toBe('acme-com');
  });

  it('parses SEO deep link', () => {
    const p = parseAppPath('/app/brands/acme-com/seo');
    expect(p.view).toBe('seo-agent');
    expect(p.brandId).toBe('acme-com');
  });

  it('parses asset deep link', () => {
    const p = parseAppPath('/app/assets/blog_post');
    expect(p.view).toBe('workspace');
    expect(p.assetType).toBe('blog_post');
  });

  it('parses studio hub route', () => {
    expect(parseAppPath('/app/studio').view).toBe('studio');
    expect(buildAppPath('studio', 'x')).toBe('/app/studio');
  });

  it('builds shareable paths', () => {
    expect(buildAppPath('seo-agent', 'acme-com')).toBe('/app/brands/acme-com/seo');
    expect(buildAppPath('workspace', 'x', { assetType: 'blog_post' })).toBe('/app/assets/blog_post');
  });
});
