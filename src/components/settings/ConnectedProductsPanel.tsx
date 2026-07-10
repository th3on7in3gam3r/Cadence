/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Grid3X3,
  Link2,
  Link2Off,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { isCloudEnabled } from '../../lib/cloudConfig';
import {
  fetchStudioIdentity,
  updateStudioProductLink,
  type StudioIdentityResponse,
  type StudioProductId,
} from '../../lib/studioApi';
import { BIBLEFUNLAND_STUDIOS_URL } from '../../lib/growthStack';
import { PRODUCT_NAME } from '../../lib/brand';

const PRODUCT_ICONS: Record<StudioProductId, string> = {
  ai_cmo: 'text-amber-400',
  kerygma: 'text-violet-400',
  citepilot: 'text-cyan-400',
  aegis: 'text-rose-400',
};

export default function ConnectedProductsPanel() {
  const cloud = isCloudEnabled();
  const [identity, setIdentity] = useState<StudioIdentityResponse | null>(null);
  const [loading, setLoading] = useState(cloud);
  const [busy, setBusy] = useState<StudioProductId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aegisLogin, setAegisLogin] = useState('');

  const refresh = async () => {
    if (!cloud) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudioIdentity();
      setIdentity(data);
      if (!data) {
        setError('Run supabase/schema-v3-studio-identity.sql in Supabase SQL Editor.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load connected products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [cloud]);

  const toggleLink = async (product: StudioProductId, linked: boolean) => {
    if (product === 'ai_cmo') return;
    setBusy(product);
    setError(null);
    try {
      const updated = await updateStudioProductLink({ product, linked });
      setIdentity(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  };

  const saveAegis = async () => {
    if (!aegisLogin.trim()) return;
    setBusy('aegis');
    setError(null);
    try {
      const updated = await updateStudioProductLink({
        product: 'aegis',
        linked: true,
        githubLogin: aegisLogin.trim(),
      });
      setIdentity(updated);
      setAegisLogin('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  };

  if (!cloud) {
    return (
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-amber-400" />
          Connected products
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Sign in with Supabase cloud mode to link your Bible Funland studio accounts across
          {PRODUCT_NAME}, Kerygma Social, CitePilot, and Aegis Loop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-amber-400" />
          Connected products (Phase 3 hub)
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
          One email across the growth stack — without forcing every product onto the same login yet.
          {PRODUCT_NAME} is your identity hub; mark sister products you use with the same email, or add your
          GitHub username for Aegis.
        </p>
        <a
          href={BIBLEFUNLAND_STUDIOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 mt-2"
        >
          Bible Funland Studios <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {error && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading connected products…
        </div>
      ) : (
        <div className="grid gap-3">
          {(identity?.products || []).map((p) => (
            <div
              key={p.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className={`text-sm font-bold ${PRODUCT_ICONS[p.id]}`}>{p.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.tagline}</p>
                <p className="text-[10px] text-slate-600 mt-1">{p.authNote}</p>
                {p.externalId && (
                  <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                    ID: {p.externalId}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    p.linked
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {p.linked ? 'Linked' : 'Not linked'}
                </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300"
                  title={`Open ${p.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {p.id !== 'ai_cmo' && (
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => toggleLink(p.id, !p.linked)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 cursor-pointer disabled:opacity-50"
                  >
                    {busy === p.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : p.linked ? (
                      <Link2Off className="w-3 h-3" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    {p.linked ? 'Unlink' : 'Same email'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <p className="text-xs font-bold text-white">Aegis Loop — GitHub username (optional)</p>
        <p className="text-[10px] text-slate-500">
          Aegis uses GitHub OAuth, not email magic links. Enter your GitHub username to link your hub row.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={aegisLogin}
            onChange={(e) => setAegisLogin(e.target.value)}
            placeholder="github-username"
            className="flex-1 min-w-[160px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
          />
          <button
            type="button"
            onClick={saveAegis}
            disabled={busy === 'aegis' || !aegisLogin.trim()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {busy === 'aegis' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Link Aegis
          </button>
        </div>
      </div>

      {identity?.email && (
        <p className="text-[10px] text-slate-600 font-mono">
          Hub email: {identity.email} · Updated {new Date(identity.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
