/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';
import { isCloudEnabled } from './cloudConfig';
import type { PlanId, CrawlMode } from './plans';
import { limitsForPlan, PLAN_PRICES, maxPagesForCrawl } from './plans';
import type { BundleCatalogItem, BundleId } from './bundles';

export type { PlanId, CrawlMode };
export { PLAN_PRICES, limitsForPlan, maxPagesForCrawl };

const LOCAL_PLAN_KEY = 'ai_cmo_plan';
const LOCAL_AUDITS_KEY = 'ai_cmo_audit_usage_month';
const LOCAL_DEEP_PAGES_KEY = 'ai_cmo_deep_crawl_pages_month';

export interface StudioSubscriptionRow {
  bundle_id: BundleId;
  status: string;
  products: string[];
  entitlements: Record<string, unknown>;
  current_period_end?: string | null;
  stripe_subscription_id: string;
}

export interface StripeSubscriptionSummary {
  id: string;
  status: string;
  priceId: string | null;
  bundleId: BundleId | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingStatus {
  plan: PlanId;
  limits: ReturnType<typeof limitsForPlan>;
  usage: { seoAuditsThisMonth: number; deepCrawlPagesThisMonth?: number };
  stripeConfigured: boolean;
  subscription?: {
    status?: string;
    current_period_end?: string;
    stripe_customer_id?: string;
    plan?: string;
  };
  activeBundles?: StudioSubscriptionRow[];
  studioSubscriptions?: StudioSubscriptionRow[];
  stripeSubscriptions?: StripeSubscriptionSummary[];
}

export interface BundleCatalogResponse {
  bundles: BundleCatalogItem[];
  aiCmoPlans: BundleCatalogItem[];
  stripeConfigured: boolean;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function localAuditCount(): number {
  try {
    const raw = localStorage.getItem(LOCAL_AUDITS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { month: string; count: number };
    return parsed.month === currentMonthKey() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

export function recordLocalAuditUsage(): void {
  const count = localAuditCount() + 1;
  localStorage.setItem(LOCAL_AUDITS_KEY, JSON.stringify({ month: currentMonthKey(), count }));
}

function localDeepPageCount(): number {
  try {
    const raw = localStorage.getItem(LOCAL_DEEP_PAGES_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { month: string; pages: number };
    return parsed.month === currentMonthKey() ? parsed.pages : 0;
  } catch {
    return 0;
  }
}

export function recordLocalDeepCrawlPages(pages: number): void {
  const total = localDeepPageCount() + pages;
  localStorage.setItem(LOCAL_DEEP_PAGES_KEY, JSON.stringify({ month: currentMonthKey(), pages: total }));
}

export function getLocalPlan(): PlanId {
  const p = localStorage.getItem(LOCAL_PLAN_KEY);
  if (p === 'pro' || p === 'team') return p;
  return 'free';
}

export function setLocalPlan(plan: PlanId): void {
  localStorage.setItem(LOCAL_PLAN_KEY, plan);
}

export async function fetchBundleCatalog(): Promise<BundleCatalogResponse> {
  const res = await apiFetch('/api/billing/bundles');
  if (!res.ok) {
    return { bundles: [], aiCmoPlans: [], stripeConfigured: false };
  }
  return res.json();
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  if (isCloudEnabled()) {
    const res = await apiFetch('/api/billing/status');
    if (res.ok) return res.json();
  }
  const plan = getLocalPlan();
  return {
    plan,
    limits: limitsForPlan(plan),
    usage: {
      seoAuditsThisMonth: localAuditCount(),
      deepCrawlPagesThisMonth: localDeepPageCount(),
    },
    stripeConfigured: false,
  };
}

export async function startCheckout(input: {
  plan?: 'pro' | 'team';
  bundle?: BundleId;
}): Promise<string | null> {
  const res = await apiFetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Checkout failed');
  }
  const data = await res.json();
  return data.url as string;
}

export async function openBillingPortal(): Promise<string | null> {
  const res = await apiFetch('/api/billing/portal', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Portal failed');
  }
  const data = await res.json();
  return data.url as string;
}

export function canRunLocalAudit(status: BillingStatus): { allowed: boolean; reason?: string } {
  const { limits, usage } = status;
  if (limits.seoAuditsPerMonth >= 999) return { allowed: true };
  if (usage.seoAuditsThisMonth >= limits.seoAuditsPerMonth) {
    return {
      allowed: false,
      reason: `Free plan allows ${limits.seoAuditsPerMonth} SEO audits per month. Upgrade to Pro for unlimited.`,
    };
  }
  return { allowed: true };
}

export function canRunDeepCrawlLocal(
  status: BillingStatus,
  mode: CrawlMode,
): { allowed: boolean; reason?: string; maxPages: number } {
  const { limits, usage } = status;
  const maxPages = maxPagesForCrawl(status.plan, mode);
  if (mode === 'quick') return { allowed: true, maxPages };
  if (!limits.deepCrawlEnabled) {
    return {
      allowed: false,
      maxPages: 0,
      reason: 'Deep crawl requires Pro or Team. Upgrade in Settings → Billing.',
    };
  }
  const used = usage.deepCrawlPagesThisMonth ?? 0;
  if (limits.deepCrawlPagesPerMonth > 0 && used >= limits.deepCrawlPagesPerMonth) {
    return {
      allowed: false,
      maxPages,
      reason: `You've used ${used} of ${limits.deepCrawlPagesPerMonth} deep-crawl page credits this month.`,
    };
  }
  return { allowed: true, maxPages };
}
