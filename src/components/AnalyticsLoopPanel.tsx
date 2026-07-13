/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3, Activity, ExternalLink, Loader2 } from 'lucide-react';
import { PageUplift, SeoAgentAuditResult } from '../types';
import { isCloudEnabled } from '../lib/cloudConfig';
import { fetchLiveSeoData } from '../lib/workspaceApi';
import { loadAnalyticsBaseline, saveAnalyticsBaseline } from '../utils/analyticsLoop';
import { GROWTH_STACK_PRODUCTS, normalizeDomainForAudit, pulseDashboardUrl } from '../lib/growthStack';
import { fetchPulseStats, type PulseStatsResponse } from '../lib/growthStackApi';
import PulseEnableCard from './PulseEnableCard';

interface AnalyticsLoopPanelProps {
  siteUrl: string;
  audit: SeoAgentAuditResult | null;
  ga4PropertyId?: string;
}

export default function AnalyticsLoopPanel({ siteUrl, audit, ga4PropertyId }: AnalyticsLoopPanelProps) {
  const [uplifts, setUplifts] = useState<PageUplift[]>([]);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState<PulseStatsResponse | null>(null);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [baselineDate, setBaselineDate] = useState<string | null>(
    () => loadAnalyticsBaseline()?.capturedAt || null
  );

  useEffect(() => {
    let cancelled = false;
    if (!siteUrl) {
      setPulse(null);
      setPulseLoading(false);
      return;
    }
    const domain = normalizeDomainForAudit(siteUrl);
    if (!domain) {
      setPulseLoading(false);
      return;
    }
    setPulseLoading(true);
    fetchPulseStats(domain).then((res) => {
      if (!cancelled) {
        setPulse(res);
        setPulseLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [siteUrl]);

  const captureBaseline = async () => {
    if (!isCloudEnabled() || !siteUrl) return;
    setLoading(true);
    try {
      const live = await fetchLiveSeoData(siteUrl, ga4PropertyId);
      const queries = live.googleSearchConsole?.topQueries || [];
      const pages = live.ga4?.topPages || [];
      const baseline = {
        capturedAt: new Date().toISOString(),
        siteUrl,
        pages: [
          ...queries.slice(0, 15).map((q: { query: string; clicks: number; position: number }) => ({
            url: q.query,
            title: q.query,
            clicks: q.clicks,
            position: q.position,
          })),
          ...pages.map((p: { path: string; sessions: number }) => ({
            url: p.path,
            clicks: 0,
            position: 0,
            sessions: p.sessions,
          })),
        ],
      };
      saveAnalyticsBaseline(baseline);
      setBaselineDate(baseline.capturedAt);
    } finally {
      setLoading(false);
    }
  };

  const computeUplift = async () => {
    const baseline = loadAnalyticsBaseline();
    if (!baseline || !isCloudEnabled() || !siteUrl) return;
    setLoading(true);
    try {
      const live = await fetchLiveSeoData(siteUrl, ga4PropertyId);
      const queryMap = new Map(
        (live.googleSearchConsole?.topQueries || []).map(
          (q: { query: string; clicks: number; position: number }) => [q.query, q]
        )
      );
      const pageMap = new Map(
        (live.ga4?.topPages || []).map((p: { path: string; sessions: number }) => [p.path, p])
      );

      const optimizedUrls = audit?.metaTagRewrites?.map((m) => m.url) || [];
      const results: PageUplift[] = [];

      for (const b of baseline.pages) {
        const isOptimized = optimizedUrls.some((u) => u.includes(b.url) || b.url.includes(u));
        if (!isOptimized && optimizedUrls.length > 0) continue;

        const currentQ = queryMap.get(b.url) as { clicks: number; position: number } | undefined;
        const currentP = pageMap.get(b.url) as { sessions: number } | undefined;
        results.push({
          url: b.url,
          title: b.title,
          baselineClicks: b.clicks,
          currentClicks: currentQ?.clicks ?? b.clicks,
          baselinePosition: b.position,
          currentPosition: currentQ?.position ?? b.position,
          baselineSessions: b.sessions,
          currentSessions: currentP?.sessions ?? b.sessions,
        });
      }
      setUplifts(results.slice(0, 12));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baselineDate) computeUplift();
  }, [siteUrl, audit?.metaTagRewrites?.length]);

  const Delta = ({ cur, base, invert }: { cur: number; base: number; invert?: boolean }) => {
    const diff = cur - base;
    const good = invert ? diff < 0 : diff > 0;
    const Icon = diff === 0 ? Minus : good ? TrendingUp : TrendingDown;
    const color = diff === 0 ? 'text-slate-500' : good ? 'text-emerald-400' : 'text-rose-400';
    return (
      <span className={`flex items-center gap-0.5 ${color}`}>
        <Icon className="w-3 h-3" />
        {diff > 0 ? '+' : ''}{diff}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-900 border border-emerald-800/40 rounded-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              {GROWTH_STACK_PRODUCTS.pulse.name} · 7d on-site
            </p>
            {pulseLoading ? (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading Pulse stats…
              </p>
            ) : pulse?.live ? (
              <p className="text-sm text-slate-300 mt-2">
                <span className="text-2xl font-display font-bold text-white">{pulse.visitors ?? 0}</span>
                <span className="text-slate-500"> visitors · </span>
                {pulse.views ?? 0} views · {pulse.conversions ?? 0} conversions
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  No Pulse traffic yet for this brand.
                </p>
                <PulseEnableCard brandUrl={siteUrl} compact />
              </div>
            )}
          </div>
          <a
            href={pulse?.dashboardUrl || pulseDashboardUrl(siteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 shrink-0"
          >
            Open Pulse <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Did this work?
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Compare GSC/GA4 metrics before vs after your optimizations.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={captureBaseline}
            disabled={loading || !isCloudEnabled()}
            className="text-xs font-bold px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
          >
            Set baseline
          </button>
          <button
            type="button"
            onClick={computeUplift}
            disabled={loading || !baselineDate}
            className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!isCloudEnabled() && (
        <p className="text-xs text-amber-400/90 bg-amber-950/20 border border-amber-900/40 rounded-lg px-3 py-2">
          Connect GSC/GA4 in cloud mode to track uplift after publish.
        </p>
      )}

      {baselineDate && (
        <p className="text-[10px] font-mono text-slate-500">
          Baseline: {new Date(baselineDate).toLocaleDateString()}
        </p>
      )}

      {uplifts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-2 pr-4">Page / query</th>
                <th className="pb-2 pr-4">Clicks</th>
                <th className="pb-2 pr-4">Position</th>
                <th className="pb-2">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {uplifts.map((u) => (
                <tr key={u.url} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-slate-300 max-w-[200px] truncate">{u.title || u.url}</td>
                  <td className="py-2 pr-4">
                    {u.baselineClicks} → {u.currentClicks}{' '}
                    <Delta cur={u.currentClicks} base={u.baselineClicks} />
                  </td>
                  <td className="py-2 pr-4">
                    {u.baselinePosition} → {u.currentPosition}{' '}
                    <Delta cur={u.currentPosition} base={u.baselinePosition} invert />
                  </td>
                  <td className="py-2">
                    {u.baselineSessions != null ? (
                      <>
                        {u.baselineSessions} → {u.currentSessions ?? '—'}{' '}
                        <Delta cur={u.currentSessions ?? 0} base={u.baselineSessions} />
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-6 text-center">
          Set a baseline after your first audit, then refresh after publishing optimizations.
        </p>
      )}
    </div>
  );
}
