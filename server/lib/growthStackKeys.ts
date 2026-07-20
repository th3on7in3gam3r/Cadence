/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseAdmin } from '../db/supabaseAdmin';

export interface GrowthStackApiKeys {
  citePilotApiKey: string;
  kerygmaApiKey: string;
  aegisApiKey: string;
  postwickApiKey: string;
  updatedAt: string | null;
}

const EMPTY: GrowthStackApiKeys = {
  citePilotApiKey: '',
  kerygmaApiKey: '',
  aegisApiKey: '',
  postwickApiKey: '',
  updatedAt: null,
};

export async function getGrowthStackKeysForUser(userId: string): Promise<GrowthStackApiKeys> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ...EMPTY };

  const { data, error } = await sb
    .from('growth_stack_api_keys')
    .select('citepilot_api_key, kerygma_api_key, aegis_api_key, postwick_api_key, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('growth_stack_api_keys lookup failed:', error.message);
    return { ...EMPTY };
  }
  if (!data) return { ...EMPTY };

  return {
    citePilotApiKey: data.citepilot_api_key?.trim() || '',
    kerygmaApiKey: data.kerygma_api_key?.trim() || '',
    aegisApiKey: data.aegis_api_key?.trim() || '',
    postwickApiKey: data.postwick_api_key?.trim() || '',
    updatedAt: data.updated_at ?? null,
  };
}

export async function saveGrowthStackKeysForUser(
  userId: string,
  keys: Pick<
    GrowthStackApiKeys,
    'citePilotApiKey' | 'kerygmaApiKey' | 'aegisApiKey' | 'postwickApiKey'
  >,
): Promise<GrowthStackApiKeys> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Cloud database is not configured.');

  const row = {
    user_id: userId,
    citepilot_api_key: keys.citePilotApiKey.trim(),
    kerygma_api_key: keys.kerygmaApiKey.trim(),
    aegis_api_key: keys.aegisApiKey.trim(),
    postwick_api_key: keys.postwickApiKey.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('growth_stack_api_keys')
    .upsert(row, { onConflict: 'user_id' })
    .select('citepilot_api_key, kerygma_api_key, aegis_api_key, postwick_api_key, updated_at')
    .single();

  if (error) throw error;

  return {
    citePilotApiKey: data.citepilot_api_key?.trim() || '',
    kerygmaApiKey: data.kerygma_api_key?.trim() || '',
    aegisApiKey: data.aegis_api_key?.trim() || '',
    postwickApiKey: data.postwick_api_key?.trim() || '',
    updatedAt: data.updated_at ?? null,
  };
}
