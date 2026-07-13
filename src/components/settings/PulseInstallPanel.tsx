/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Check, Copy, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { isCloudEnabled } from '../../lib/cloudConfig';
import { claimPulseSite, fetchPulseInstall, type PulseInstallInfo } from '../../lib/pulseApi';
import { GROWTH_STACK_PRODUCTS } from '../../lib/growthStack';
import { PRODUCT_NAME } from '../../lib/brand';

interface PulseInstallPanelProps {
  brandUrl?: string;
}

type CopyTarget = 'snippet' | 'prompt' | null;

export default function PulseInstallPanel({ brandUrl }: PulseInstallPanelProps) {
  const [info, setInfo] = useState<PulseInstallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyTarget>(null);

  const load = useCallback(async () => {
    if (!isCloudEnabled()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPulseInstall(brandUrl);
      setInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Pulse');
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [brandUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    try {
      const result = await claimPulseSite(brandUrl);
      setInfo(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setClaiming(false);
    }
  }

  async function copyText(text: string, target: CopyTarget) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(target);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  if (!isCloudEnabled()) {
    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-400">
        Sign in to the hosted {PRODUCT_NAME} workspace to claim your site and get a Pulse pixel snippet.
      </div>
    );
  }

  return (
    <section className="p-5 rounded-xl border border-emerald-800/40 bg-slate-900/80 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {GROWTH_STACK_PRODUCTS.pulse.name} · on-site analytics
          </p>
          <h3 className="mt-1 text-sm font-display font-bold text-white">Claim site & install pixel</h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
            One click claims your brand domain, generates a read key on the server, and gives you the
            install snippet. Included with {PRODUCT_NAME} — no separate charge for analytics keys.
          </p>
        </div>
        {info?.claimed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Claimed
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading…
        </p>
      ) : error ? (
        <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : !brandUrl ? (
        <p className="text-xs text-amber-400/90 bg-amber-950/20 border border-amber-900/40 rounded-lg px-3 py-2">
          Analyze your website first so we know which domain to claim.
        </p>
      ) : info ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>
              Domain: <strong className="text-slate-200">{info.domain}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Site ID: <code className="text-emerald-300">{info.siteId}</code>
            </span>
          </div>

          {!info.claimed ? (
            <button
              type="button"
              onClick={() => void handleClaim()}
              disabled={claiming}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
            >
              {claiming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Claim site & generate snippet
            </button>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Snippet</p>
                  <button
                    type="button"
                    onClick={() => void copyText(info.snippet, 'snippet')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === 'snippet' ? 'Copied' : 'Copy snippet'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {info.snippet}
                </pre>
                <p className="text-[10px] text-slate-500">
                  Paste before <code>&lt;/body&gt;</code> on every public page. Keys stay on the server —
                  customers never buy or manage Pulse read keys separately.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">AI install prompt</p>
                  <button
                    type="button"
                    onClick={() => void copyText(info.idePrompt, 'prompt')}
                    className="text-[10px] font-bold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {info.idePrompt}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href={info.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1"
                >
                  Open Pulse dashboard <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => void handleClaim()}
                  disabled={claiming}
                  className="text-xs font-bold text-slate-500 hover:text-slate-300 cursor-pointer disabled:opacity-50"
                >
                  {claiming ? 'Regenerating…' : 'Regenerate keys & snippet'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
