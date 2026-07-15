/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  enablePulseForBrand,
  fetchPulseDashboardLink,
  fetchPulseInstall,
  resyncPulseForBrand,
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

type CopyTarget = 'snippet' | 'prompt' | 'readKey' | null;

export default function PulseEnableCard({ brandUrl, compact, className = '' }: PulseEnableCardProps) {
  const [info, setInfo] = useState<PulseInstallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyTarget>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(null);
    try {
      const result = await enablePulseForBrand(brandUrl);
      setInfo(result);
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not enable Pulse');
    } finally {
      setEnabling(false);
    }
  }

  async function handleRetrySync() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await resyncPulseForBrand(brandUrl);
      setInfo((prev) => ({
        ...(prev || {}),
        ...result,
        enabled: true,
        claimed: true,
      } as PulseInstallInfo));
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sync with Pulse');
    } finally {
      setSyncing(false);
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
  const syncFailed = Boolean(enabled && info?.registeredOnPulse === false);

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
        {enabled && !syncFailed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Enabled
          </span>
        )}
        {syncFailed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Sync needed
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

          {syncFailed ? (
            <div className="space-y-2 rounded-lg border border-amber-800/50 bg-amber-950/20 px-3 py-2.5">
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Cadence saved this site, but the key did not sync to Pulse. Set matching{' '}
                <code className="text-amber-100">PULSE_PARTNER_SECRET</code> on Cadence and Pulse, then
                retry.
              </p>
              <button
                type="button"
                onClick={() => void handleRetrySync()}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Retry sync
              </button>
            </div>
          ) : null}

          {message && !syncFailed ? (
            <p className="text-xs text-slate-400">{message}</p>
          ) : null}

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
              {info.readKey ? (
                <div className="space-y-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400/90 uppercase">
                      Dashboard read key
                    </span>
                    <button
                      type="button"
                      onClick={() => void copyText(info.readKey!, 'readKey')}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === 'readKey' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block text-[11px] font-mono text-slate-200 break-all select-all">
                    {info.readKey}
                  </code>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste this into Pulse when it asks to unlock the site. It is not part of the
                    website pixel.
                  </p>
                </div>
              ) : null}
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
              {!compact && info.idePrompt ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      AI assistant
                    </span>
                    <button
                      type="button"
                      onClick={() => void copyText(info.idePrompt, 'prompt')}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
                    </button>
                  </div>
                </div>
              ) : null}
              {!compact && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          const { url } = await fetchPulseDashboardLink(brandUrl);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (e: unknown) {
                          setError(
                            e instanceof Error ? e.message : 'Could not open Pulse',
                          );
                          if (info?.dashboardUrl) {
                            window.open(info.dashboardUrl, '_blank', 'noopener,noreferrer');
                          }
                        }
                      })();
                    }}
                    className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                  >
                    Open Pulse <ExternalLink className="w-3 h-3" />
                  </button>
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
