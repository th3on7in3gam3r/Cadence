/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';
import type { GrowthStackSettings } from '../utils/growthStackSettings';

export interface CloudGrowthStackKeys extends GrowthStackSettings {
  updatedAt: string | null;
}

export async function fetchCloudGrowthStackKeys(): Promise<CloudGrowthStackKeys | null> {
  const res = await apiFetch('/api/growth-stack/keys');
  if (res.status === 401 || res.status === 503) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load growth stack keys');
  }
  return res.json() as Promise<CloudGrowthStackKeys>;
}

export async function saveCloudGrowthStackKeys(
  keys: GrowthStackSettings,
): Promise<CloudGrowthStackKeys> {
  const res = await apiFetch('/api/growth-stack/keys', {
    method: 'PUT',
    body: JSON.stringify(keys),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Failed to save growth stack keys');
  }
  return data as CloudGrowthStackKeys;
}
