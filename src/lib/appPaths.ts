/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView =
  | 'onboarding'
  | 'dashboard'
  | 'workspace'
  | 'profile'
  | 'settings'
  | 'studio'
  | 'history-scans'
  | 'campaign-history'
  | 'seo-agent'
  | 'calendar';

export function slugifyBrandId(brandUrl: string): string {
  if (!brandUrl) return 'workspace';
  return brandUrl
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase() || 'workspace';
}

export function parseAppPath(pathname: string): {
  view: AppView;
  brandId?: string;
  assetType?: string;
} {
  const p = pathname.replace(/\/$/, '') || '/app';

  const assetMatch = p.match(/\/app\/assets\/([^/]+)/);
  if (assetMatch) {
    return { view: 'workspace', assetType: decodeURIComponent(assetMatch[1]) };
  }

  const brandSeo = p.match(/\/app\/brands\/([^/]+)\/seo/);
  if (brandSeo) return { view: 'seo-agent', brandId: brandSeo[1] };

  const brandCal = p.match(/\/app\/brands\/([^/]+)\/calendar/);
  if (brandCal) return { view: 'calendar', brandId: brandCal[1] };

  const brandDash = p.match(/\/app\/brands\/([^/]+)$/);
  if (brandDash) return { view: 'dashboard', brandId: brandDash[1] };

  if (p === '/app/onboarding' || p === '/app') return { view: 'onboarding' };
  if (p === '/app/studio') return { view: 'studio' };
  if (p === '/app/settings') return { view: 'settings' };
  if (p === '/app/profile') return { view: 'profile' };
  if (p === '/app/campaign-history') return { view: 'campaign-history' };
  if (p === '/app/history-scans') return { view: 'history-scans' };

  return { view: 'dashboard' };
}

export function buildAppPath(
  view: AppView,
  brandId: string,
  opts?: { assetType?: string }
): string {
  const bid = brandId || 'workspace';
  switch (view) {
    case 'onboarding':
      return '/app/onboarding';
    case 'dashboard':
      return `/app/brands/${bid}`;
    case 'seo-agent':
      return `/app/brands/${bid}/seo`;
    case 'calendar':
      return `/app/brands/${bid}/calendar`;
    case 'workspace':
      return `/app/assets/${encodeURIComponent(opts?.assetType || 'blog_post')}`;
    case 'settings':
      return '/app/settings';
    case 'studio':
      return '/app/studio';
    case 'profile':
      return '/app/profile';
    case 'campaign-history':
      return '/app/campaign-history';
    case 'history-scans':
      return '/app/history-scans';
    default:
      return `/app/brands/${bid}`;
  }
}
