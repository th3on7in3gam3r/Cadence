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
  moneyGapApiKey: string;
  updatedAt: string | null;
}

const EMPTY: GrowthStackApiKeys = {
  citePilotApiKey: '',
  kerygmaApiKey: '',
  aegisApiKey: '',
  postwickApiKey: '',
  moneyGapApiKey: '',
  updatedAt: null,
};

const SELECT_COLS =
  'citepilot_api_key, kerygma_api_key, aegis_api_key, postwick_api_key, moneygap_api_key, updated_at';

export async function getGrowthStackKeysForUser(userId: string): Promise<GrowthStackApiKeys> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ...EMPTY };

  const { data, error } = await sb
    .from('growth_stack_api_keys')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // Older DBs without moneygap_api_key — fall back so Integrations still loads.
    if (error.message?.includes('moneygap_api_key')) {
      const legacy = await sb
        .from('growth_stack_api_keys')
        .select('citepilot_api_key, kerygma_api_key, aegis_api_key, postwick_api_key, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (legacy.error) {
        console.warn('growth_stack_api_keys lookup failed:', legacy.error.message);
        return { ...EMPTY };
      }
      if (!legacy.data) return { ...EMPTY };
      return {
        citePilotApiKey: legacy.data.citepilot_api_key?.trim() || '',
        kerygmaApiKey: legacy.data.kerygma_api_key?.trim() || '',
        aegisApiKey: legacy.data.aegis_api_key?.trim() || '',
        postwickApiKey: legacy.data.postwick_api_key?.trim() || '',
        moneyGapApiKey: '',
        updatedAt: legacy.data.updated_at ?? null,
      };
    }
    console.warn('growth_stack_api_keys lookup failed:', error.message);
    return { ...EMPTY };
  }
  if (!data) return { ...EMPTY };

  return {
    citePilotApiKey: data.citepilot_api_key?.trim() || '',
    kerygmaApiKey: data.kerygma_api_key?.trim() || '',
    aegisApiKey: data.aegis_api_key?.trim() || '',
    postwickApiKey: data.postwick_api_key?.trim() || '',
    moneyGapApiKey: data.moneygap_api_key?.trim() || '',
    updatedAt: data.updated_at ?? null,
  };
}

export async function saveGrowthStackKeysForUser(
  userId: string,
  keys: Pick<
    GrowthStackApiKeys,
    'citePilotApiKey' | 'kerygmaApiKey' | 'aegisApiKey' | 'postwickApiKey' | 'moneyGapApiKey'
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
    moneygap_api_key: keys.moneyGapApiKey.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('growth_stack_api_keys')
    .upsert(row, { onConflict: 'user_id' })
    .select(SELECT_COLS)
    .single();

  if (error) {
    if (error.message?.includes('moneygap_api_key')) {
      throw new Error(
        'MoneyGap key column missing. Run supabase/schema-v9-moneygap-api-key.sql in Supabase SQL Editor.',
      );
    }
    throw error;
  }

  return {
    citePilotApiKey: data.citepilot_api_key?.trim() || '',
    kerygmaApiKey: data.kerygma_api_key?.trim() || '',
    aegisApiKey: data.aegis_api_key?.trim() || '',
    postwickApiKey: data.postwick_api_key?.trim() || '',
    moneyGapApiKey: data.moneygap_api_key?.trim() || '',
    updatedAt: data.updated_at ?? null,
  };
}
