/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkspacePayload } from '../lib/workspaceApi';
import { normalizeBrandUrl } from './websiteUrl';

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

function slugFromUrl(brandUrl: string): string {
  return brandUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 48) || 'workspace';
}

/** Create or update a brand record keyed by site URL so the switcher stays in sync with audits. */
export function upsertBrandForWorkspace(name: string, brandUrl: string, payload?: WorkspacePayload): LocalBrand {
  const normalized = normalizeBrandUrl(brandUrl);
  const brands = listLocalBrands();
  const matchIdx = brands.findIndex(
    (b) => b.brandUrl && normalizeBrandUrl(b.brandUrl) === normalized,
  );

  if (matchIdx >= 0) {
    const updated = { ...brands[matchIdx], name, brandUrl: normalized, payload };
    brands[matchIdx] = updated;
    saveLocalBrands(brands);
    setActiveBrandId(updated.id);
    return updated;
  }

  const activeId = getActiveBrandId();
  const activeIdx = activeId ? brands.findIndex((b) => b.id === activeId) : -1;
  if (activeIdx >= 0 && !brands[activeIdx].brandUrl) {
    const updated = { ...brands[activeIdx], name, brandUrl: normalized, payload };
    brands[activeIdx] = updated;
    saveLocalBrands(brands);
    return updated;
  }

  if (brands.length === 0) {
    const brand: LocalBrand = {
      id: crypto.randomUUID(),
      slug: slugFromUrl(normalized),
      name,
      brandUrl: normalized,
      payload,
    };
    saveLocalBrands([brand]);
    setActiveBrandId(brand.id);
    return brand;
  }

  const brand: LocalBrand = {
    id: crypto.randomUUID(),
    slug: slugFromUrl(normalized),
    name,
    brandUrl: normalized,
    payload,
  };
  brands.push(brand);
  saveLocalBrands(brands);
  setActiveBrandId(brand.id);
  return brand;
}

export function ensureDefaultBrand(name: string, brandUrl: string, payload?: WorkspacePayload): LocalBrand {
  return upsertBrandForWorkspace(name, brandUrl, payload);
}
