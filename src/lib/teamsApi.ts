/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';
import { isCloudEnabled } from './cloudConfig';
import {
  buildPayloadFromLocal,
  hydrateLocalFromPayload,
  mergeWorkspacePayload,
  type WorkspacePayload,
} from './workspaceApi';
import { buildAppPath, slugifyBrandId } from './appPaths';
import { normalizeBrandUrl } from '../utils/websiteUrl';
import {
  listLocalBrands,
  saveLocalBrands,
  getActiveBrandId,
  setActiveBrandId,
  upsertBrandForWorkspace,
  type LocalBrand,
} from '../utils/brands';

function navigateAfterBrandSwitch(payload?: WorkspacePayload | null): void {
  if (payload?.brandAnalysis && payload.brandUrl) {
    window.location.href = buildAppPath('dashboard', slugifyBrandId(payload.brandUrl));
    return;
  }
  window.location.href = '/app/onboarding';
}

export type MemberRole = 'admin' | 'editor';

export interface OrgInfo {
  id: string;
  name: string;
  agency_name?: string | null;
  agency_logo_url?: string | null;
  plan?: string;
}

export interface BrandSummary {
  id: string;
  slug: string;
  name: string;
  brand_url?: string | null;
}

export async function fetchOrg(): Promise<OrgInfo | null> {
  if (!isCloudEnabled()) {
    const raw = localStorage.getItem('ai_cmo_agency');
    return raw ? JSON.parse(raw) : { id: 'local', name: 'My workspace' };
  }
  const res = await apiFetch('/api/teams/org');
  if (!res.ok) return null;
  const data = await res.json();
  return data.org;
}

export async function updateOrg(patch: {
  name?: string;
  agencyName?: string;
  agencyLogoUrl?: string;
}): Promise<OrgInfo | null> {
  if (!isCloudEnabled()) {
    const current = (await fetchOrg()) || { id: 'local', name: 'My workspace' };
    const updated = {
      ...current,
      ...(patch.name && { name: patch.name }),
      ...(patch.agencyName !== undefined && { agency_name: patch.agencyName }),
      ...(patch.agencyLogoUrl !== undefined && { agency_logo_url: patch.agencyLogoUrl }),
    };
    localStorage.setItem('ai_cmo_agency', JSON.stringify(updated));
    return updated;
  }
  const res = await apiFetch('/api/teams/org', { method: 'PATCH', body: JSON.stringify(patch) });
  if (!res.ok) throw new Error('Failed to update agency settings');
  const data = await res.json();
  return data.org;
}

export async function fetchBrands(): Promise<BrandSummary[]> {
  if (!isCloudEnabled()) {
    return listLocalBrands().map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      brand_url: b.brandUrl,
    }));
  }
  const res = await apiFetch('/api/teams/brands');
  if (!res.ok) return [];
  const data = await res.json();
  return data.brands || [];
}

export async function updateBrand(
  id: string,
  patch: { name?: string; brandUrl?: string; payload?: WorkspacePayload },
): Promise<BrandSummary> {
  if (!isCloudEnabled()) {
    const brands = listLocalBrands();
    const idx = brands.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Brand not found');
    brands[idx] = {
      ...brands[idx],
      ...(patch.name && { name: patch.name }),
      ...(patch.brandUrl !== undefined && { brandUrl: patch.brandUrl }),
      ...(patch.payload && { payload: patch.payload }),
    };
    saveLocalBrands(brands);
    const b = brands[idx];
    return { id: b.id, slug: b.slug, name: b.name, brand_url: b.brandUrl };
  }
  const res = await apiFetch(`/api/teams/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(patch.name && { name: patch.name }),
      ...(patch.brandUrl !== undefined && { brandUrl: patch.brandUrl }),
      ...(patch.payload && { payload: patch.payload }),
    }),
  });
  if (!res.ok) throw new Error('Failed to update brand');
  const data = await res.json();
  return data.brand;
}

export async function fetchBrandPayload(brandId: string): Promise<WorkspacePayload | null> {
  if (!isCloudEnabled()) {
    const brands = listLocalBrands();
    const b = brands.find((x) => x.id === brandId);
    return (b?.payload as WorkspacePayload) || null;
  }
  const res = await apiFetch(`/api/teams/brands/${brandId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.brand?.payload || null;
}

export async function createBrand(
  name: string,
  brandUrl?: string,
  payloadOverride?: WorkspacePayload,
): Promise<BrandSummary> {
  const payload = payloadOverride ?? buildPayloadFromLocal();
  if (!isCloudEnabled()) {
    const brands = listLocalBrands();
    const brand: LocalBrand = {
      id: crypto.randomUUID(),
      slug: slugifyBrandId(brandUrl || name),
      name,
      brandUrl: brandUrl || '',
      payload,
    };
    brands.push(brand);
    saveLocalBrands(brands);
    setActiveBrandId(brand.id);
    return { id: brand.id, slug: brand.slug, name: brand.name, brand_url: brand.brandUrl };
  }
  const res = await apiFetch('/api/teams/brands', {
    method: 'POST',
    body: JSON.stringify({ name, brandUrl, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const hint = (err as { setupHint?: string }).setupHint;
    throw new Error(
      hint || (err as { error?: string }).error || 'Failed to create brand',
    );
  }
  const data = await res.json();
  setActiveBrandId(data.brand.id);
  return data.brand;
}

/** Create or reuse the cloud brand row for the current workspace URL. */
export async function ensureWorkspaceBrand(
  name: string,
  brandUrl: string,
  payload: WorkspacePayload,
): Promise<BrandSummary | null> {
  if (!isCloudEnabled()) return null;

  const normalized = normalizeBrandUrl(brandUrl);
  if (!normalized) return null;

  const brands = await fetchBrands();
  const slug = slugifyBrandId(normalized || name);
  const existing =
    brands.find((b) => b.brand_url && normalizeBrandUrl(b.brand_url) === normalized) ||
    brands.find((b) => b.slug === slug);

  if (existing) {
    if (!getActiveBrandId()) setActiveBrandId(existing.id);
    return existing;
  }

  try {
    return await createBrand(name, normalized, payload);
  } catch {
    const retry = await fetchBrands();
    const match =
      retry.find((b) => b.brand_url && normalizeBrandUrl(b.brand_url) === normalized) ||
      retry.find((b) => b.slug === slug);
    if (match) {
      setActiveBrandId(match.id);
      return match;
    }
    return null;
  }
}

/** After a site audit, keep the brand list and active brand aligned with the analyzed URL. */
export async function syncWorkspaceBrand(
  name: string,
  brandUrl: string,
  payload: WorkspacePayload,
): Promise<BrandSummary> {
  const normalized = normalizeBrandUrl(brandUrl);
  if (!isCloudEnabled()) {
    const brand = upsertBrandForWorkspace(name, normalized, payload);
    return { id: brand.id, slug: brand.slug, name: brand.name, brand_url: brand.brandUrl };
  }

  const currentId = getActiveBrandId();
  if (currentId) {
    await updateBrand(currentId, { payload: buildPayloadFromLocal() }).catch(() => undefined);
  }

  const brands = await fetchBrands();
  const slug = slugifyBrandId(normalized || name);
  const existing =
    brands.find((b) => b.brand_url && normalizeBrandUrl(b.brand_url) === normalized) ||
    brands.find((b) => b.slug === slug);

  if (existing) {
    const updated = await updateBrand(existing.id, { name, brandUrl: normalized, payload });
    setActiveBrandId(existing.id);
    return updated;
  }

  return createBrand(name, normalized, payload);
}

/** On sign-in, load the active brand's saved workspace instead of a stale global workspace. */
export async function resolveActiveBrandOnLoad(
  workspacePayload: WorkspacePayload | null,
): Promise<WorkspacePayload | null> {
  if (!isCloudEnabled()) return workspacePayload;

  const brands = await fetchBrands();
  if (brands.length === 0) return workspacePayload;

  let activeId = getActiveBrandId();
  const url = workspacePayload?.brandUrl;

  if (!activeId || !brands.some((b) => b.id === activeId)) {
    const match = url
      ? brands.find((b) => b.brand_url && normalizeBrandUrl(b.brand_url) === normalizeBrandUrl(url))
      : undefined;
    activeId = match?.id ?? brands[0].id;
    setActiveBrandId(activeId);
  }

  const brandPayload = await fetchBrandPayload(activeId);
  if (!brandPayload) return workspacePayload;
  if (!workspacePayload) return brandPayload;
  return mergeWorkspacePayload(workspacePayload, brandPayload);
}

export async function switchBrand(brandId: string): Promise<void> {
  if (!isCloudEnabled()) {
    const brands = listLocalBrands();
    const currentId = getActiveBrandId();
    if (currentId && currentId !== brandId) {
      const idx = brands.findIndex((b) => b.id === currentId);
      if (idx >= 0) brands[idx] = { ...brands[idx], payload: buildPayloadFromLocal() };
    }
    const target = brands.find((b) => b.id === brandId);
    if (target?.payload) hydrateLocalFromPayload(target.payload as WorkspacePayload);
    saveLocalBrands(brands);
    setActiveBrandId(brandId);
    navigateAfterBrandSwitch(target?.payload as WorkspacePayload | undefined);
    return;
  }

  const currentId = getActiveBrandId();
  if (currentId && currentId !== brandId) {
    await updateBrand(currentId, { payload: buildPayloadFromLocal() });
  }

  const res = await apiFetch(`/api/teams/brands/${brandId}`);
  if (!res.ok) throw new Error('Failed to load brand');
  const data = await res.json();
  if (data.brand?.payload) hydrateLocalFromPayload(data.brand.payload);
  setActiveBrandId(brandId);
  navigateAfterBrandSwitch(data.brand?.payload as WorkspacePayload | undefined);
}

export async function fetchMembers(): Promise<
  { id: string; email: string; role: MemberRole; joined_at?: string | null }[]
> {
  if (!isCloudEnabled()) {
    try {
      return JSON.parse(localStorage.getItem('ai_cmo_team_members') || '[]');
    } catch {
      return [];
    }
  }
  const res = await apiFetch('/api/teams/members');
  if (!res.ok) return [];
  const data = await res.json();
  return data.members || [];
}

export async function inviteMember(email: string, role: MemberRole = 'editor'): Promise<{ inviteUrl?: string }> {
  if (!isCloudEnabled()) {
    const members = await fetchMembers();
    members.push({ id: crypto.randomUUID(), email, role, joined_at: null });
    localStorage.setItem('ai_cmo_team_members', JSON.stringify(members));
    return { inviteUrl: `${window.location.origin}/app/settings?invite=local` };
  }
  const res = await apiFetch('/api/teams/members/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invite failed');
  }
  return res.json();
}

export async function fetchUserRole(): Promise<{ role: MemberRole; canApprove: boolean }> {
  if (!isCloudEnabled()) {
    const plan = localStorage.getItem('ai_cmo_plan');
    return { role: 'admin', canApprove: plan === 'team' };
  }
  const res = await apiFetch('/api/teams/role');
  if (!res.ok) return { role: 'editor', canApprove: false };
  return res.json();
}

export async function saveCurrentBrandSnapshot(): Promise<void> {
  const activeId = getActiveBrandId();
  if (!activeId) return;
  const payload = buildPayloadFromLocal();
  if (isCloudEnabled()) {
    await updateBrand(activeId, { payload });
    return;
  }
  const brands = listLocalBrands();
  if (brands.length === 0) return;
  const idx = brands.findIndex((b) => b.id === activeId);
  if (idx >= 0) {
    brands[idx] = { ...brands[idx], payload };
    saveLocalBrands(brands);
  }
}
