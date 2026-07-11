/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Grants a plan to trusted owner emails without Stripe.
 * Set CADENCE_OWNER_EMAILS on the server only (Render env) — never commit real emails.
 */

import { getSupabaseAdmin } from '../db/supabaseAdmin';
import type { PlanId } from './plans';
import { limitsForPlan } from './plans';

function ownerEmailSet(): Set<string> {
  const raw = process.env.CADENCE_OWNER_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function configuredOwnerPlan(): PlanId {
  const raw = (process.env.CADENCE_OWNER_PLAN || 'team').toLowerCase();
  if (raw === 'pro' || raw === 'team') return raw;
  return 'team';
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email || !process.env.CADENCE_OWNER_EMAILS) return false;
  return ownerEmailSet().has(email.trim().toLowerCase());
}

export async function applyOwnerPlanGrant(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!isOwnerEmail(email)) return false;

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const plan = configuredOwnerPlan();
  const seats = limitsForPlan(plan).seats;

  await sb.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      status: 'active',
      seats,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  await sb.from('organizations').update({ plan }).eq('owner_id', userId);

  return true;
}

/** Resolve email from Supabase Auth and apply grant when listed in CADENCE_OWNER_EMAILS. */
export async function applyOwnerPlanGrantForUser(userId: string): Promise<boolean> {
  if (!process.env.CADENCE_OWNER_EMAILS) return false;

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return false;

  return applyOwnerPlanGrant(userId, data.user.email);
}
