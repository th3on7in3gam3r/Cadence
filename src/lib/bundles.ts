/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { aiCmoAppUrl, aiCmoBillingPath, aiCmoStudioBillingUrl, type StudioBundleId } from './growthStack';
import { PRODUCT_NAME } from './brand';

export type BundleId =
  | 'growth'
  | 'social'
  | 'devsec'
  | 'studio'
  | 'ai_cmo_pro'
  | 'ai_cmo_team';

export type StudioProductId = 'ai_cmo' | 'citepilot' | 'kerygma' | 'aegis';

export interface BundleCatalogItem {
  id: BundleId;
  name: string;
  tagline: string;
  monthlyListPrice: number;
  products: StudioProductId[];
  configured?: boolean;
  featured?: boolean;
}

export interface MarketingBundle {
  id: BundleId;
  name: string;
  tagline: string;
  monthlyListPrice: number;
  products: StudioProductId[];
  features: string[];
  featured?: boolean;
  badge?: string;
}

export const PRODUCT_LABELS: Record<StudioProductId, string> = {
  ai_cmo: PRODUCT_NAME,
  citepilot: 'CitePilot',
  kerygma: 'Kerygma Social',
  aegis: 'Aegis Loop',
};

export const BUNDLE_CATALOG_ORDER: BundleId[] = ['studio', 'growth', 'social', 'devsec'];

export const MARKETING_BUNDLES: MarketingBundle[] = [
  {
    id: 'studio',
    name: 'Studio Bundle',
    tagline: 'All four growth products — best for agencies',
    monthlyListPrice: 199,
    products: ['ai_cmo', 'citepilot', 'kerygma', 'aegis'],
    badge: 'Best value',
    featured: true,
    features: [
      `${PRODUCT_NAME} Team — seats, approvals, white-label PDFs`,
      'CitePilot Fleet — multi-brand citation tracking',
      'Kerygma Social Pro — autopilot posts',
      'Aegis Loop Team — security scans & headers',
      'One Stripe bill · one customer portal',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Stack',
    tagline: 'Strategy + AI citation visibility',
    monthlyListPrice: 89,
    products: ['ai_cmo', 'citepilot'],
    featured: true,
    features: [
      `${PRODUCT_NAME} Pro — unlimited SEO audits & deep crawl`,
      'CitePilot Pilot — track AI buyer citations',
      'Shared brand URL across both workspaces',
      'Ideal for content-led founders & SEO leads',
    ],
  },
  {
    id: 'social',
    name: 'Social Stack',
    tagline: 'Kerygma Social on autopilot',
    monthlyListPrice: 29,
    products: ['kerygma'],
    features: [
      'Kerygma Social Pro posting batch',
      'Meta, LinkedIn, Pinterest & more',
      `Pair with ${PRODUCT_NAME} free tier for strategy`,
      'Great for churches & local businesses',
    ],
  },
  {
    id: 'devsec',
    name: 'DevSec Stack',
    tagline: 'Ship securely before marketing scales',
    monthlyListPrice: 49,
    products: ['aegis'],
    features: [
      'Aegis Loop Team plan',
      'PR security scans + header checks',
      'GitHub-connected dashboard',
      'Pair with CitePilot for SaaS visibility',
    ],
  },
];

export const AI_CMO_SOLO_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    features: ['1 brand workspace', '3 SEO audits / month', 'Quick crawl (8 pages)', 'Dashboard & content studio'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 49,
    features: ['Unlimited SEO audits', 'Deep crawl 100 pages/job', 'GSC & GA4 integrations', 'White-label PDF reports'],
  },
  {
    id: 'team' as const,
    name: 'Team',
    price: 149,
    features: ['Everything in Pro', '10 seats & approval workflow', 'Deep crawl 500 pages/job', 'Agency client brands'],
  },
];

export function bundleCheckoutHref(bundleId: BundleId): string {
  if (bundleId === 'ai_cmo_pro') return aiCmoBillingPath({ plan: 'pro' });
  if (bundleId === 'ai_cmo_team') return aiCmoBillingPath({ plan: 'team' });
  return aiCmoBillingPath({ bundle: bundleId as StudioBundleId });
}

export function productPills(products: StudioProductId[]): string {
  return products.map((p) => PRODUCT_LABELS[p]).join(' · ');
}
