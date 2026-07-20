/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Building2, Check, Loader2, Trash2, Pencil } from 'lucide-react';
import { createBrand, deleteBrand, fetchBrands, switchBrand, updateBrand } from '../lib/teamsApi';
import { buildEmptyWorkspacePayload } from '../lib/workspaceApi';
import type { BrandSummary } from '../lib/teamsApi';
import { getActiveBrandId } from '../utils/brands';
import { domainFromBrandUrl, normalizeBrandUrl } from '../utils/websiteUrl';

interface BrandSwitcherProps {
  currentBrandName?: string;
  brandUrl?: string;
  onViewCampaignHistory?: () => void;
}

function brandUrlsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeBrandUrl(a) === normalizeBrandUrl(b);
}

export default function BrandSwitcher({
  currentBrandName,
  brandUrl,
  onViewCampaignHistory,
}: BrandSwitcherProps) {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => getActiveBrandId());
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandSummary | null>(null);
  const [editingBrand, setEditingBrand] = useState<BrandSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const refreshBrands = () => {
    fetchBrands()
      .then((list) => {
        setBrands(list);
        setActiveId(getActiveBrandId());
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshBrands();
  }, [currentBrandName, brandUrl]);

  const resolvedActiveId = useMemo(() => {
    if (activeId && brands.some((b) => b.id === activeId)) return activeId;
    const byUrl = brands.find((b) => brandUrlsMatch(b.brand_url, brandUrl));
    if (byUrl) return byUrl.id;
    return brands[0]?.id ?? null;
  }, [activeId, brands, brandUrl]);

  const activeBrand = brands.find((b) => b.id === resolvedActiveId);
  const headerLabel = activeBrand?.name || currentBrandName || 'Brand workspace';
  const headerSubtitle = activeBrand?.brand_url
    ? domainFromBrandUrl(activeBrand.brand_url)
    : brandUrl
      ? domainFromBrandUrl(brandUrl)
      : '';
  const canDelete = brands.length > 1;

  const closeDropdown = () => {
    setOpen(false);
    setManaging(false);
    setDeleteTarget(null);
    setEditingBrand(null);
    setActionError(null);
  };

  const handleSwitch = async (id: string) => {
    if (managing || editingBrand) return;
    if (id === resolvedActiveId) {
      closeDropdown();
      return;
    }
    setBusy(true);
    setSwitchError(null);
    setOpen(false);
    try {
      await switchBrand(id);
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : 'Failed to switch brand');
      setBusy(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setAddError('Enter a brand name.');
      return;
    }
    setBusy(true);
    setAddError(null);
    try {
      const url = newUrl.trim() ? normalizeBrandUrl(newUrl.trim()) : undefined;
      const brand = await createBrand(name, url, buildEmptyWorkspacePayload(url || ''));
      setNewName('');
      setNewUrl('');
      setAdding(false);
      await switchBrand(brand.id);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add brand');
      setBusy(false);
    }
  };

  const startEdit = (brand: BrandSummary) => {
    setEditingBrand(brand);
    setEditName(brand.name);
    setEditUrl(brand.brand_url || '');
    setDeleteTarget(null);
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    const name = editName.trim();
    if (!name) {
      setActionError('Enter a brand name.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await updateBrand(editingBrand.id, {
        name,
        brandUrl: editUrl.trim() ? normalizeBrandUrl(editUrl.trim()) : '',
      });
      setEditingBrand(null);
      refreshBrands();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update brand');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const wasActive = deleteTarget.id === resolvedActiveId;
    setBusy(true);
    setActionError(null);
    try {
      await deleteBrand(deleteTarget.id);
      setDeleteTarget(null);
      setManaging(false);
      if (!wasActive) {
        refreshBrands();
        setBusy(false);
        return;
      }
      setOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete brand');
      setBusy(false);
    }
  };

  if (brands.length === 0 && !adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
        title="Add a brand site"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="truncate max-w-[120px]">{headerLabel}</span>
      </button>
    );
  }

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => {
          if (open) closeDropdown();
          else setOpen(true);
        }}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white cursor-pointer max-w-[180px]"
        title={headerSubtitle || headerLabel}
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{headerLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
      </button>
      {switchError && (
        <p className="absolute right-0 top-full mt-1 z-50 max-w-[280px] text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-lg px-2.5 py-1.5">
          {switchError}
        </p>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeDropdown} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[260px] max-w-[300px] bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Brand workspaces
              </p>
              <button
                type="button"
                onClick={() => {
                  setManaging((v) => !v);
                  setDeleteTarget(null);
                  setEditingBrand(null);
                  setActionError(null);
                }}
                className={`text-[10px] font-semibold cursor-pointer ${
                  managing ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {managing ? 'Done' : 'Manage'}
              </button>
            </div>
            {managing && (
              <p className="px-3 pb-1 text-[10px] text-slate-500 leading-snug">
                Edit a wrong URL or remove a duplicate workspace. Campaign history is kept separately.
              </p>
            )}
            {brands.map((b) => {
              const isActive = b.id === resolvedActiveId;
              const site = b.brand_url ? domainFromBrandUrl(b.brand_url) : '';
              const isEditing = editingBrand?.id === b.id;

              if (isEditing) {
                return (
                  <form
                    key={b.id}
                    onSubmit={handleSaveEdit}
                    className="px-3 py-2 border-t border-slate-800 space-y-2"
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Brand name"
                      className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
                      autoFocus
                      disabled={busy}
                    />
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Website URL"
                      className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
                      disabled={busy}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditingBrand(null)}
                        className="text-xs text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={b.id}
                  className={`group flex items-start gap-1 hover:bg-slate-800 ${
                    isActive ? 'bg-slate-800/60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitch(b.id)}
                    className="flex-1 min-w-0 text-left px-3 py-2 cursor-pointer flex items-start gap-2"
                  >
                    <span className="mt-0.5 w-3.5 shrink-0">
                      {isActive ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xs truncate ${
                          isActive ? 'text-white font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {b.name}
                      </span>
                      {site && (
                        <span className="block text-[10px] text-slate-500 truncate">{site}</span>
                      )}
                    </span>
                  </button>
                  {managing && (
                    <div className="flex items-center gap-0.5 pr-2 pt-2 shrink-0">
                      <button
                        type="button"
                        title="Edit name or URL"
                        onClick={() => startEdit(b)}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        title={canDelete ? 'Remove workspace' : 'Keep at least one workspace'}
                        disabled={!canDelete || busy}
                        onClick={() => {
                          setDeleteTarget(b);
                          setActionError(null);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {deleteTarget && (
              <div className="mx-3 my-2 p-2.5 rounded-lg border border-rose-900/50 bg-rose-950/30">
                <p className="text-[11px] text-slate-200 leading-snug">
                  Remove <strong className="text-white">{deleteTarget.name}</strong> from your
                  workspaces?
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Saved audits stay in Campaign History.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDelete}
                    className="text-[11px] font-bold px-2 py-1 bg-rose-600 text-white rounded cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                    Delete
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDeleteTarget(null)}
                    className="text-[11px] text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {actionError && (
              <p className="px-3 pb-1 text-[11px] text-rose-400 leading-snug">{actionError}</p>
            )}
            <div className="border-t border-slate-800 mt-1 pt-1">
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                History
              </p>
              {onViewCampaignHistory && (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown();
                    onViewCampaignHistory();
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                >
                  Saved audits → Campaign History
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setOpen(false);
                setManaging(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer border-t border-slate-800"
            >
              <Plus className="w-3 h-3" /> Add brand site
            </button>
          </div>
        </>
      )}
      {adding && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden />
          <form
            onSubmit={handleAdd}
            className="absolute right-0 top-full mt-1 z-50 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex flex-col gap-2 min-w-[240px]"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">New brand site</p>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (addError) setAddError(null);
              }}
              placeholder="Brand name"
              className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
              autoFocus
              disabled={busy}
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Website URL (optional)"
              className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
              disabled={busy}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
              >
                {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                Add
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setAdding(false);
                  setAddError(null);
                }}
                className="text-xs text-slate-500 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            {addError ? (
              <p className="text-[11px] text-rose-400 leading-snug">{addError}</p>
            ) : null}
          </form>
        </>
      )}
    </div>
  );
}
