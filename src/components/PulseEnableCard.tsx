/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Check, Copy, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  enablePulseForBrand,
  fetchPulseInstall,
  type PulseInstallInfo,
} from '../lib/pulseApi';
import { GROWTH_STACK_PRODUCTS } from '../lib/growthStack';
import { PRODUCT_NAME } from '../lib/brand';

interface PulseEnableCardProps {
  brandUrl?: string;
  /** Compact layout for SEO Agent / dashboard embeds */
  compact?: boolean;
  className?: string;
}

type CopyTarget = 'snippet' | 'prompt' | null;

export default function PulseEnableCard({ brandUrl, compact, className = '' }: PulseEnableCardProps) {
  const [info, setInfo] = useState<PulseInstallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
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

  async function handleEnable() {
    setEnabling(true);
    setError(null);
    try {
      const result = await enablePulseForBrand(brandUrl);
      setInfo(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not enable Pulse');
    } finally {
      setEnabling(false);
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

  const enabled = info?.enabled ?? info?.claimed;

  if (!isCloudEnabled()) {
    return null;
  }

  return (
    <section
      className={`rounded-xl border border-emerald-800/40 bg-slate-900/80 space-y-3 ${
        compact ? 'p-4' : 'p-5'
      } ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {GROWTH_STACK_PRODUCTS.pulse.name}
            {info ? (
              <span className="text-slate-500 font-normal normal-case">
                · {info.sitesUsed}/{info.sitesLimit} site{info.sitesLimit === 1 ? '' : 's'}
              </span>
            ) : null}
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
              Included with {PRODUCT_NAME} today — no Stripe or separate key SKU. Free: 1 site; Pro and
              Growth Stack bundles can cover more when you monetize.
            </p>
          )}
        </div>
        {enabled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Enabled
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
        <p className="text-xs text-amber-400/90">Add a brand URL to enable Pulse for this workspace.</p>
      ) : info ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-200">{info.domain}</strong>
            {' · '}
            <code className="text-emerald-300">{info.siteId}</code>
          </p>

          {!enabled ? (
            <button
              type="button"
              onClick={() => void handleEnable()}
              disabled={enabling}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
            >
              {enabling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Enable Pulse for this brand
            </button>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Snippet</span>
                  <button
                    type="button"
                    onClick={() => void copyText(info.snippet, 'snippet')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === 'snippet' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {info.snippet}
                </pre>
              </div>
              {!compact && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={info.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1"
                  >
                    Open Pulse <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="/app/settings?tab=integrations"
                    className="text-xs font-bold text-slate-500 hover:text-slate-300"
                  >
                    Full install options
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
