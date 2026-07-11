/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Building2, Check } from 'lucide-react';
import { fetchBrands, switchBrand, createBrand } from '../lib/teamsApi';
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
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [busy, setBusy] = useState(false);

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

  const handleSwitch = async (id: string) => {
    if (id === resolvedActiveId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setOpen(false);
    try {
      await switchBrand(id);
    } catch {
      setBusy(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const url = newUrl.trim() ? normalizeBrandUrl(newUrl.trim()) : undefined;
      await createBrand(newName.trim(), url);
      setNewName('');
      setNewUrl('');
      setAdding(false);
      refreshBrands();
    } finally {
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
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white cursor-pointer max-w-[180px]"
        title={headerSubtitle || headerLabel}
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{headerLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[240px] max-w-[280px] bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Brand sites
            </p>
            {brands.map((b) => {
              const isActive = b.id === resolvedActiveId;
              const site = b.brand_url ? domainFromBrandUrl(b.brand_url) : '';
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSwitch(b.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-start gap-2 ${
                    isActive ? 'bg-slate-800/60' : ''
                  }`}
                >
                  <span className="mt-0.5 w-3.5 shrink-0">
                    {isActive ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs truncate ${isActive ? 'text-white font-semibold' : 'text-slate-300'}`}>
                      {b.name}
                    </span>
                    {site && (
                      <span className="block text-[10px] text-slate-500 truncate">{site}</span>
                    )}
                  </span>
                </button>
              );
            })}
            {onViewCampaignHistory && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onViewCampaignHistory();
                }}
                className="w-full text-left px-3 py-2 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer border-t border-slate-800"
              >
                Saved audits → Campaign History
              </button>
            )}
            <button
              type="button"
              onClick={() => { setAdding(true); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer border-t border-slate-800"
            >
              <Plus className="w-3 h-3" /> Add brand site
            </button>
          </div>
        </>
      )}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="absolute right-0 top-full mt-1 z-50 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex flex-col gap-2 min-w-[220px]"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Brand name"
            className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
            autoFocus
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Website URL (optional)"
            className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-full"
          />
          <div className="flex gap-2">
            <button type="submit" className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-slate-500 cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
