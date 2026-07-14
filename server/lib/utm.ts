/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UtmSource = 'cadence' | 'kerygma' | 'citepilot' | 'email' | 'ads' | string;
export type UtmMedium = 'email' | 'social' | 'cpc' | 'referral' | string;

export interface UtmParams {
  source: UtmSource;
  campaign: string;
  medium?: UtmMedium;
  content?: string;
}

export const PULSE_TRACKED_LANDING_HOSTS = [
  'kerygmasocial.com',
  'biblefunlandstudios.com',
  'growth.biblefunland.com',
  'cadence.biblefunland.com',
] as const;

export function slugifyUtmCampaign(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'campaign'
  );
}

function normalizeHttpUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('#')) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function withUtm(url: string, utm: UtmParams): string {
  const raw = url?.trim();
  if (!raw || raw === '#subscribe' || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    return url;
  }

  try {
    const parsed = new URL(normalizeHttpUrl(raw));
    parsed.searchParams.set('utm_source', utm.source.toLowerCase());
    parsed.searchParams.set('utm_campaign', slugifyUtmCampaign(utm.campaign));
    if (utm.medium) parsed.searchParams.set('utm_medium', utm.medium);
    if (utm.content) parsed.searchParams.set('utm_content', slugifyUtmCampaign(utm.content));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function growthStackOutboundUrl(
  url: string,
  campaign: string,
  medium: UtmMedium = 'referral',
): string {
  return withUtm(url, { source: 'cadence', campaign, medium });
}

function isPulseTrackedLandingHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return PULSE_TRACKED_LANDING_HOSTS.some((tracked) => host === tracked || host.endsWith(`.${tracked}`));
}

export function campaignLandingUrl(
  url: string,
  opts: {
    campaign: string;
    source?: UtmSource;
    medium?: UtmMedium;
    content?: string;
    force?: boolean;
  },
): string {
  const raw = url?.trim();
  if (!raw || raw === '#subscribe') return url;

  try {
    const parsed = new URL(normalizeHttpUrl(raw));
    const shouldTag = opts.force !== false || isPulseTrackedLandingHost(parsed.hostname);
    if (!shouldTag) return raw;
    return withUtm(parsed.toString(), {
      source: opts.source ?? 'cadence',
      campaign: opts.campaign,
      medium: opts.medium,
      content: opts.content,
    });
  } catch {
    return url;
  }
}

export function campaignSlugForAssetType(assetType: string): string {
  const map: Record<string, string> = {
    blog_post: 'blog-post',
    social_posts: 'social-bundle',
    email_sequence: 'email-sequence',
    seo_keywords: 'seo-keywords',
    lead_magnet: 'lead-magnet',
  };
  return map[assetType] || slugifyUtmCampaign(assetType);
}
