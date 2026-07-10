/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';

export type StudioProductId = 'ai_cmo' | 'kerygma' | 'citepilot' | 'aegis';

export interface StudioProductStatus {
  id: StudioProductId;
  name: string;
  tagline: string;
  url: string;
  authNote: string;
  linked: boolean;
  externalId: string | null;
}

export interface StudioIdentityResponse {
  email: string;
  products: StudioProductStatus[];
  updatedAt: string;
}

export async function fetchStudioIdentity(): Promise<StudioIdentityResponse | null> {
  const res = await apiFetch('/api/studio/identity');
  if (res.status === 503) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load connected products');
  }
  return res.json();
}

export async function updateStudioProductLink(input: {
  product: StudioProductId;
  linked?: boolean;
  externalId?: string;
  githubLogin?: string;
}): Promise<StudioIdentityResponse> {
  const res = await apiFetch('/api/studio/identity', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update product link');
  }
  return res.json();
}
