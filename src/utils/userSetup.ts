/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

export interface UserSetupData {
  fullName: string;
  role: string;
  heardFrom: string;
  heardFromDetail?: string;
}

export const HEARD_FROM_OPTIONS = [
  'Google search',
  'Social media (X, LinkedIn, etc.)',
  'Friend or colleague',
  'Newsletter or blog',
  'Product Hunt',
  'Agency / consultant',
  'Conference or event',
  'Other',
] as const;

const SETUP_KEY = 'ai_cmo_user_setup';
const SETUP_COMPLETE_KEY = 'ai_cmo_user_setup_complete';

export function loadUserSetup(): UserSetupData | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isUserSetupComplete(user?: User | null): boolean {
  if (user?.user_metadata?.onboarding_complete) return true;
  return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
}

/** Restore welcome-step completion from Supabase after sign-in on a new device. */
export function syncUserSetupFromMetadata(user?: User | null): void {
  if (!user?.user_metadata?.onboarding_complete) return;
  localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
  const meta = user.user_metadata;
  if (meta.full_name || meta.role || meta.heard_from) {
    localStorage.setItem(
      SETUP_KEY,
      JSON.stringify({
        fullName: meta.full_name || '',
        role: meta.role || '',
        heardFrom: meta.heard_from || '',
        heardFromDetail: meta.heard_from_detail || '',
      })
    );
  }
}

/** Skip onboarding when the user already has a saved brand (local or cloud). */
export function shouldShowOnboarding(
  user: User | null | undefined,
  hasBrand: boolean
): boolean {
  if (hasBrand) return false;
  return !isUserSetupComplete(user);
}

export async function saveUserSetup(data: UserSetupData, user?: User | null): Promise<void> {
  localStorage.setItem(SETUP_KEY, JSON.stringify(data));
  localStorage.setItem(SETUP_COMPLETE_KEY, 'true');

  const existingRaw = localStorage.getItem('ai_cmo_user_profile');
  let profile: Record<string, string> = {};
  if (existingRaw) {
    try {
      profile = JSON.parse(existingRaw);
    } catch {
      profile = {};
    }
  }
  localStorage.setItem(
    'ai_cmo_user_profile',
    JSON.stringify({
      ...profile,
      fullName: data.fullName || profile.fullName,
      role: data.role || profile.role,
      heardFrom: data.heardFrom,
      heardFromDetail: data.heardFromDetail,
    })
  );
  window.dispatchEvent(new Event('user_profile_updated'));

  const sb = getSupabase();
  if (sb && user) {
    await sb.auth.updateUser({
      data: {
        onboarding_complete: true,
        heard_from: data.heardFrom,
        heard_from_detail: data.heardFromDetail || null,
        full_name: data.fullName || null,
        role: data.role || null,
      },
    });
  }
}
