/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Response } from 'express';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { recordUsageEvent } from './usage';

export const GUEST_LIMIT_CODE = 'GUEST_LIMIT';
export const GUEST_UPGRADE_HINT = 'Create a free account to continue';

export interface GuestTrialRequest {
  userId?: string;
  isGuest?: boolean;
}

export function guestLimitResponse(res: Response, message: string) {
  return res.status(403).json({
    error: message,
    code: GUEST_LIMIT_CODE,
    upgradeHint: GUEST_UPGRADE_HINT,
  });
}

export async function resolveGuestStatus(userId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return false;
  return data.user.is_anonymous === true;
}

export async function countGuestAnalyzes(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { count } = await sb
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'guest_analyze');
  return count || 0;
}

export async function canGuestAnalyze(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const isGuest = await resolveGuestStatus(userId);
  if (!isGuest) return { allowed: true };
  const used = await countGuestAnalyzes(userId);
  if (used >= 1) {
    return {
      allowed: false,
      reason: 'Guest trial includes one brand analysis. Create a free account to analyze more sites.',
    };
  }
  return { allowed: true };
}

export async function recordGuestAnalyze(userId: string): Promise<void> {
  if (!(await resolveGuestStatus(userId))) return;
  await recordUsageEvent(userId, 'guest_analyze', {});
}
