/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { PRODUCT_NAME, serverPublicOrigin } from './brand';
import { emitStudioOpsEvent } from './studioOps';
import { growthStackOutboundUrl } from './utm';

export type StudioProductId = 'ai_cmo' | 'kerygma' | 'citepilot' | 'aegis';

export const STUDIO_PRODUCTS: {
  id: StudioProductId;
  name: string;
  tagline: string;
  url: string;
  authNote: string;
}[] = [
  {
    id: 'ai_cmo',
    name: PRODUCT_NAME,
    tagline: 'Strategy, SEO audits, campaign workspace',
    url: serverPublicOrigin(),
    authNote: 'Signed in with Supabase',
  },
  {
    id: 'kerygma',
    name: 'Kerygma Social',
    tagline: 'Social posts on autopilot from your URL',
    url: 'https://kerygmasocial.com',
    authNote: 'Clerk account (link by email for now)',
  },
  {
    id: 'citepilot',
    name: 'CitePilot',
    tagline: 'Track AI citations on buyer prompts',
    url: 'https://getcitepilot.com',
    authNote: 'Neon Auth account (link by email for now)',
  },
  {
    id: 'aegis',
    name: 'Aegis Loop',
    tagline: 'Find vulnerabilities before you ship',
    url: process.env.AEGIS_API_URL?.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') || 'https://aegis-loop.com',
    authNote: 'GitHub OAuth (connect separately)',
  },
];

export interface StudioAccountRow {
  user_id: string;
  email: string;
  clerk_id: string | null;
  citepilot_user_id: string | null;
  kerygma_user_id: string | null;
  aegis_github_id: string | null;
  aegis_github_login: string | null;
  linked_products: Record<string, boolean>;
  updated_at: string;
}

const DEFAULT_LINKED: Record<StudioProductId, boolean> = {
  ai_cmo: true,
  kerygma: false,
  citepilot: false,
  aegis: false,
};

function normalizeLinked(raw: unknown): Record<StudioProductId, boolean> {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, boolean>;
  return {
    ai_cmo: obj.ai_cmo !== false,
    kerygma: !!obj.kerygma,
    citepilot: !!obj.citepilot,
    aegis: !!obj.aegis,
  };
}

export async function getOrCreateStudioAccount(userId: string, email: string): Promise<StudioAccountRow> {
  const sb = getSupabaseAdmin()!;
  const { data: existing } = await sb
    .from('studio_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return {
      ...existing,
      linked_products: normalizeLinked(existing.linked_products),
    } as StudioAccountRow;
  }

  const row = {
    user_id: userId,
    email,
    linked_products: DEFAULT_LINKED,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('studio_accounts')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) throw error;
  emitStudioOpsEvent({
    product: 'cadence',
    event: 'user.signup',
    email,
    externalUserId: userId,
    metadata: { source: 'studio_accounts' },
  });
  return {
    ...data,
    linked_products: normalizeLinked(data.linked_products),
  } as StudioAccountRow;
}

export function productPayload(account: StudioAccountRow) {
  const linked = normalizeLinked(account.linked_products);
  return STUDIO_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    url:
      p.id === 'kerygma'
        ? growthStackOutboundUrl(p.url, 'studio-identity')
        : p.id === 'ai_cmo'
          ? `${p.url}/app`
          : p.url,
    authNote: p.authNote,
    linked: linked[p.id],
    externalId:
      p.id === 'kerygma'
        ? account.kerygma_user_id || account.clerk_id
        : p.id === 'citepilot'
          ? account.citepilot_user_id
          : p.id === 'aegis'
            ? account.aegis_github_login || account.aegis_github_id
            : account.user_id,
  }));
}
