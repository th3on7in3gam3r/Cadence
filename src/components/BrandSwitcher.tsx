/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronDown, Plus, Building2 } from 'lucide-react';
import { fetchBrands, switchBrand, createBrand } from '../lib/teamsApi';
import type { BrandSummary } from '../lib/teamsApi';

interface BrandSwitcherProps {
  currentBrandName?: string;
}

export default function BrandSwitcher({ currentBrandName }: BrandSwitcherProps) {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBrands().then(setBrands).catch(() => undefined);
  }, [currentBrandName]);

  const handleSwitch = async (id: string) => {
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
      await createBrand(newName.trim());
      setNewName('');
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  if (brands.length <= 1 && !adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
        title="Add client brand"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="truncate max-w-[100px]">{currentBrandName || 'Brand'}</span>
      </button>
    );
  }

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="truncate max-w-[100px]">{currentBrandName || 'Select brand'}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1">
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSwitch(b.id)}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                {b.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setAdding(true); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer border-t border-slate-800"
            >
              <Plus className="w-3 h-3" /> Add client
            </button>
          </div>
        </>
      )}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="absolute right-0 top-full mt-1 z-50 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Client name"
            className="text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white w-32"
            autoFocus
          />
          <button type="submit" className="text-xs font-bold px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-xs text-slate-500 cursor-pointer">
            ×
          </button>
        </form>
      )}
    </div>
  );
}
