/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlanId = 'free' | 'pro' | 'team';
export type CrawlMode = 'quick' | 'deep';

export interface PlanLimits {
  brands: number;
  seoAuditsPerMonth: number;
  integrations: boolean;
  approvalWorkflow: boolean;
  seats: number;
  whiteLabelReports: boolean;
  quickCrawlMaxPages: number;
  deepCrawlEnabled: boolean;
  deepCrawlMaxPagesPerJob: number;
  deepCrawlPagesPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    brands: 1,
    seoAuditsPerMonth: 3,
    integrations: false,
    approvalWorkflow: false,
    seats: 1,
    whiteLabelReports: false,
    quickCrawlMaxPages: 8,
    deepCrawlEnabled: false,
    deepCrawlMaxPagesPerJob: 0,
    deepCrawlPagesPerMonth: 0,
  },
  pro: {
    brands: 999,
    seoAuditsPerMonth: 9999,
    integrations: true,
    approvalWorkflow: false,
    seats: 1,
    whiteLabelReports: true,
    quickCrawlMaxPages: 20,
    deepCrawlEnabled: true,
    deepCrawlMaxPagesPerJob: 100,
    deepCrawlPagesPerMonth: 500,
  },
  team: {
    brands: 999,
    seoAuditsPerMonth: 9999,
    integrations: true,
    approvalWorkflow: true,
    seats: 10,
    whiteLabelReports: true,
    quickCrawlMaxPages: 20,
    deepCrawlEnabled: true,
    deepCrawlMaxPagesPerJob: 500,
    deepCrawlPagesPerMonth: 2000,
  },
};

export const PLAN_PRICES = {
  pro: { monthly: 49, label: 'Pro' },
  team: { monthly: 149, label: 'Team' },
} as const;

export function limitsForPlan(plan: PlanId): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function maxPagesForCrawl(plan: PlanId, mode: CrawlMode): number {
  const limits = limitsForPlan(plan);
  return mode === 'deep' ? limits.deepCrawlMaxPagesPerJob : limits.quickCrawlMaxPages;
}
