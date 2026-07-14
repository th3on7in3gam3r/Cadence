/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseAdmin } from '../db/supabaseAdmin';
import type { PlanId, CrawlMode } from './plans';
import { limitsForPlan, maxPagesForCrawl } from './plans';
import { applyOwnerPlanGrantForUser } from './ownerGrant';

export async function getUserPlan(userId: string): Promise<PlanId> {
  try {
    await applyOwnerPlanGrantForUser(userId);
  } catch {
    /* billing tables may not be migrated yet */
  }

  const sb = getSupabaseAdmin();
  if (!sb) return 'free';
  try {
    const { data, error } = await sb
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data?.status === 'active' && data.plan) {
      return data.plan as PlanId;
    }
  } catch {
    return 'free';
  }
  return 'free';
}

export async function countSeoAuditsThisMonth(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count } = await sb
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'seo_audit')
    .gte('created_at', start.toISOString());
  return count || 0;
}

export async function recordUsageEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('usage_events').insert({
    user_id: userId,
    event_type: eventType,
    metadata: metadata || {},
  });
}

export async function canRunSeoAudit(userId: string | undefined): Promise<{
  allowed: boolean;
  reason?: string;
  plan: PlanId;
  used: number;
  limit: number;
}> {
  if (!userId) {
    return { allowed: true, plan: 'free', used: 0, limit: 3 };
  }
  const plan = await getUserPlan(userId);
  const limits = limitsForPlan(plan);
  const used = await countSeoAuditsThisMonth(userId);
  if (limits.seoAuditsPerMonth >= 999) {
    return { allowed: true, plan, used, limit: limits.seoAuditsPerMonth };
  }
  if (used >= limits.seoAuditsPerMonth) {
    return {
      allowed: false,
      reason: `Free plan allows ${limits.seoAuditsPerMonth} SEO audits per month. Upgrade to Pro for unlimited.`,
      plan,
      used,
      limit: limits.seoAuditsPerMonth,
    };
  }
  return { allowed: true, plan, used, limit: limits.seoAuditsPerMonth };
}

export async function countDeepCrawlPagesThisMonth(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { data } = await sb
    .from('usage_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'deep_crawl')
    .gte('created_at', start.toISOString());
  return (data || []).reduce((sum, row) => {
    const pages = (row.metadata as { pages?: number })?.pages || 0;
    return sum + pages;
  }, 0);
}

export async function canRunDeepCrawl(
  userId: string | undefined,
  mode: CrawlMode
): Promise<{
  allowed: boolean;
  reason?: string;
  plan: PlanId;
  maxPages: number;
  usedPages: number;
  pageLimit: number;
}> {
  const plan = userId ? await getUserPlan(userId) : 'free';
  const limits = limitsForPlan(plan);
  const maxPages = maxPagesForCrawl(plan, mode);

  if (mode === 'quick') {
    return { allowed: true, plan, maxPages, usedPages: 0, pageLimit: limits.deepCrawlPagesPerMonth };
  }

  if (!limits.deepCrawlEnabled) {
    return {
      allowed: false,
      reason: 'Deep crawl (page-by-page + link map) requires Pro or Team. Upgrade in Settings → Billing.',
      plan,
      maxPages: 0,
      usedPages: 0,
      pageLimit: 0,
    };
  }

  const usedPages = userId ? await countDeepCrawlPagesThisMonth(userId) : 0;
  if (limits.deepCrawlPagesPerMonth > 0 && usedPages >= limits.deepCrawlPagesPerMonth) {
    return {
      allowed: false,
      reason: `You've used ${usedPages} of ${limits.deepCrawlPagesPerMonth} deep-crawl page credits this month. Upgrade to Team for more.`,
      plan,
      maxPages,
      usedPages,
      pageLimit: limits.deepCrawlPagesPerMonth,
    };
  }

  return {
    allowed: true,
    plan,
    maxPages,
    usedPages,
    pageLimit: limits.deepCrawlPagesPerMonth,
  };
}

export async function recordDeepCrawl(
  userId: string,
  pagesCrawled: number,
  siteUrl: string
): Promise<void> {
  await recordUsageEvent(userId, 'deep_crawl', { pages: pagesCrawled, url: siteUrl });
}

export async function countBrandsForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const org = await getOrCreateOrg(userId);
  const { count } = await sb
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id);
  return count || 0;
}

export async function getOrCreateOrg(userId: string, email?: string) {
  const sb = getSupabaseAdmin()!;
  const { data: membership } = await sb
    .from('organization_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId)
    .not('joined_at', 'is', null)
    .limit(1)
    .maybeSingle();

  if (membership?.organizations) {
    const org = Array.isArray(membership.organizations)
      ? membership.organizations[0]
      : membership.organizations;
    if (org) return org;
  }

  const { data: owned } = await sb
    .from('organizations')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (owned) {
    await sb.from('organization_members').upsert({
      org_id: owned.id,
      user_id: userId,
      email: email || `${userId}@user.local`,
      role: 'admin',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'org_id,email' });
    return owned;
  }

  const { data: org, error } = await sb
    .from('organizations')
    .insert({ owner_id: userId, name: 'My workspace' })
    .select('*')
    .single();
  if (error) throw error;

  await sb.from('organization_members').insert({
    org_id: org.id,
    user_id: userId,
    email: email || `${userId}@user.local`,
    role: 'admin',
    joined_at: new Date().toISOString(),
  });

  return org;
}
