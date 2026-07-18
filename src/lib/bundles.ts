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
  separateListPrice?: number;
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

/** Display order for Studio Bundle product names in marketing copy. */
export const STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER: StudioProductId[] = [
  'aegis',
  'citepilot',
  'ai_cmo',
  'kerygma',
];

export const MARKETING_BUNDLES: MarketingBundle[] = [
  {
    id: 'studio',
    name: 'Studio Bundle',
    tagline: 'All four products, one subscription — best for agencies',
    monthlyListPrice: 199,
    separateListPrice: 350,
    products: ['ai_cmo', 'citepilot', 'kerygma', 'aegis'],
    badge: 'Best value',
    featured: true,
    features: [
      'One monthly bill for all four apps below — not priced per product',
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

export const STUDIO_BUNDLE = MARKETING_BUNDLES.find((b) => b.id === 'studio')!;

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
    features: [
      'Unlimited brand workspaces',
      'Unlimited SEO audits',
      'Deep crawl 100 pages/job',
      'GSC, GA4 & WordPress integrations',
      'White-label PDF reports',
    ],
  },
  {
    id: 'team' as const,
    name: 'Team',
    price: 149,
    features: [
      'Everything in Pro',
      'Up to 10 seats with roles & invites',
      'Approval workflow on blog drafts',
      'Deep crawl 500 pages/job',
      '2,000 deep-crawl page credits/month',
      'Unlimited client brand workspaces',
    ],
  },
];

export function bundleCheckoutHref(
  bundleId: BundleId,
  interval: 'monthly' | 'annual' = 'monthly',
): string {
  if (bundleId === 'ai_cmo_pro') return aiCmoBillingPath({ plan: 'pro', interval });
  if (bundleId === 'ai_cmo_team') return aiCmoBillingPath({ plan: 'team', interval });
  return aiCmoBillingPath({ bundle: bundleId as StudioBundleId });
}

export function productPills(products: StudioProductId[]): string {
  return products.map((p) => PRODUCT_LABELS[p]).join(' · ');
}

export function bundleProductNamesLine(
  products: StudioProductId[],
  displayOrder?: StudioProductId[],
): string {
  const order = displayOrder ?? products;
  const sorted = [...products].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  return sorted.map((p) => PRODUCT_LABELS[p]).join(' + ');
}

export function bundleSavings(
  bundle: MarketingBundle,
): { amount: number; percent: number } | null {
  if (!bundle.separateListPrice || bundle.separateListPrice <= bundle.monthlyListPrice) {
    return null;
  }
  const amount = bundle.separateListPrice - bundle.monthlyListPrice;
  const percent = Math.round((amount / bundle.separateListPrice) * 100);
  return { amount, percent };
}

/** Avoid "$199/mo" reading as per-product when a bundle includes multiple apps. */
export function bundlePricingCaption(productCount: number): { priceSuffix: string } {
  if (productCount > 1) {
    return { priceSuffix: '/mo total' };
  }
  return { priceSuffix: '/mo' };
}
