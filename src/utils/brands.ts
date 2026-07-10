/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkspacePayload } from '../lib/workspaceApi';

export interface LocalBrand {
  id: string;
  slug: string;
  name: string;
  brandUrl: string;
  payload?: WorkspacePayload;
}

const BRANDS_KEY = 'ai_cmo_brands';
const ACTIVE_BRAND_KEY = 'ai_cmo_active_brand_id';

export function listLocalBrands(): LocalBrand[] {
  try {
    const raw = localStorage.getItem(BRANDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalBrands(brands: LocalBrand[]): void {
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
}

export function getActiveBrandId(): string | null {
  return localStorage.getItem(ACTIVE_BRAND_KEY);
}

export function setActiveBrandId(id: string): void {
  localStorage.setItem(ACTIVE_BRAND_KEY, id);
}

export function ensureDefaultBrand(name: string, brandUrl: string, payload?: WorkspacePayload): LocalBrand {
  const brands = listLocalBrands();
  if (brands.length === 0) {
    const brand: LocalBrand = {
      id: crypto.randomUUID(),
      slug: brandUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 48) || 'workspace',
      name,
      brandUrl,
      payload,
    };
    saveLocalBrands([brand]);
    setActiveBrandId(brand.id);
    return brand;
  }
  const activeId = getActiveBrandId();
  if (!activeId) setActiveBrandId(brands[0].id);
  return brands.find((b) => b.id === activeId) || brands[0];
}
