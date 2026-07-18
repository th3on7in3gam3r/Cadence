/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlanId } from './plans';
import { PRODUCT_NAME } from './brand';

export type BundleId =
  | 'growth'
  | 'social'
  | 'devsec'
  | 'studio'
  | 'ai_cmo_pro'
  | 'ai_cmo_team';

export type StudioProductId = 'ai_cmo' | 'citepilot' | 'kerygma' | 'aegis';

export interface BundleEntitlements {
  ai_cmo?: { plan: PlanId };
  citepilot?: { plan: 'pilot' | 'fleet' };
  kerygma?: { tier: 'pro' | 'max' };
  aegis?: { plan: 'team' };
}

export interface StudioBundle {
  id: BundleId;
  name: string;
  tagline: string;
  monthlyListPrice: number;
  products: StudioProductId[];
  entitlements: BundleEntitlements;
  envKey: string;
  annualEnvKey?: string;
  featured?: boolean;
}

export const STUDIO_BUNDLES: Record<BundleId, StudioBundle> = {
  growth: {
    id: 'growth',
    name: 'Growth Stack',
    tagline: `${PRODUCT_NAME} Pro + CitePilot Pilot`,
    monthlyListPrice: 89,
    products: ['ai_cmo', 'citepilot'],
    entitlements: {
      ai_cmo: { plan: 'pro' },
      citepilot: { plan: 'pilot' },
    },
    envKey: 'STRIPE_PRICE_BUNDLE_GROWTH_MONTHLY',
    featured: true,
  },
  social: {
    id: 'social',
    name: 'Social Stack',
    tagline: 'Kerygma Social Pro — autopilot posts',
    monthlyListPrice: 29,
    products: ['kerygma'],
    entitlements: {
      kerygma: { tier: 'pro' },
    },
    envKey: 'STRIPE_PRICE_BUNDLE_SOCIAL_MONTHLY',
  },
  devsec: {
    id: 'devsec',
    name: 'DevSec Stack',
    tagline: 'Aegis Loop Team — security before you ship',
    monthlyListPrice: 49,
    products: ['aegis'],
    entitlements: {
      aegis: { plan: 'team' },
    },
    envKey: 'STRIPE_PRICE_BUNDLE_DEVSEC_MONTHLY',
  },
  studio: {
    id: 'studio',
    name: 'Studio Bundle',
    tagline: 'All four products, one subscription — best value for agencies',
    monthlyListPrice: 199,
    products: ['ai_cmo', 'citepilot', 'kerygma', 'aegis'],
    entitlements: {
      ai_cmo: { plan: 'team' },
      citepilot: { plan: 'fleet' },
      kerygma: { tier: 'pro' },
      aegis: { plan: 'team' },
    },
    envKey: 'STRIPE_PRICE_BUNDLE_STUDIO_MONTHLY',
    featured: true,
  },
  ai_cmo_pro: {
    id: 'ai_cmo_pro',
    name: `${PRODUCT_NAME} Pro`,
    tagline: 'Unlimited SEO audits & deep crawl',
    monthlyListPrice: 49,
    products: ['ai_cmo'],
    entitlements: { ai_cmo: { plan: 'pro' } },
    envKey: 'STRIPE_PRICE_PRO_MONTHLY',
    annualEnvKey: 'STRIPE_PRICE_PRO_ANNUAL',
  },
  ai_cmo_team: {
    id: 'ai_cmo_team',
    name: `${PRODUCT_NAME} Team`,
    tagline: 'Agency seats, approvals & white-label',
    monthlyListPrice: 149,
    products: ['ai_cmo'],
    entitlements: { ai_cmo: { plan: 'team' } },
    envKey: 'STRIPE_PRICE_TEAM_MONTHLY',
    annualEnvKey: 'STRIPE_PRICE_TEAM_ANNUAL',
  },
};

export const BUNDLE_CATALOG_ORDER: BundleId[] = [
  'studio',
  'growth',
  'social',
  'devsec',
];

export const AI_CMO_ONLY_BUNDLES: BundleId[] = ['ai_cmo_pro', 'ai_cmo_team'];

export function bundlePriceId(
  bundleId: BundleId,
  interval: 'monthly' | 'annual' = 'monthly',
): string | null {
  const bundle = STUDIO_BUNDLES[bundleId];
  if (!bundle) return null;
  if (interval === 'annual' && bundle.annualEnvKey) {
    const annual = process.env[bundle.annualEnvKey]?.trim();
    if (annual) return annual;
  }
  return process.env[bundle.envKey]?.trim() || null;
}

export function bundleIdFromPriceId(priceId: string): BundleId | null {
  for (const bundle of Object.values(STUDIO_BUNDLES)) {
    const monthly = process.env[bundle.envKey]?.trim();
    const annual = bundle.annualEnvKey ? process.env[bundle.annualEnvKey]?.trim() : null;
    if ((monthly && monthly === priceId) || (annual && annual === priceId)) return bundle.id;
  }
  return null;
}

export function isBundleConfigured(bundleId: BundleId): boolean {
  return !!bundlePriceId(bundleId);
}

export function aiCmoPlanForBundle(bundleId: BundleId): PlanId {
  const ent = STUDIO_BUNDLES[bundleId]?.entitlements.ai_cmo?.plan;
  return ent || 'free';
}

export function bundleCatalogForApi() {
  return BUNDLE_CATALOG_ORDER.map((id) => {
    const bundle = STUDIO_BUNDLES[id];
    return {
      id: bundle.id,
      name: bundle.name,
      tagline: bundle.tagline,
      monthlyListPrice: bundle.monthlyListPrice,
      products: bundle.products,
      entitlements: bundle.entitlements,
      configured: isBundleConfigured(id),
      featured: !!bundle.featured,
    };
  });
}

export function aiCmoOnlyCatalogForApi() {
  return AI_CMO_ONLY_BUNDLES.map((id) => {
    const bundle = STUDIO_BUNDLES[id];
    return {
      id: bundle.id,
      name: bundle.name,
      tagline: bundle.tagline,
      monthlyListPrice: bundle.monthlyListPrice,
      products: bundle.products,
      configured: isBundleConfigured(id),
    };
  });
}
