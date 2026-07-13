/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
} from 'lucide-react';
import {
  citePilotAuditUrl,
  GROWTH_STACK_PRODUCTS,
  kerygmaSignUpUrl,
  normalizeDomainForAudit,
  pulseDashboardUrl,
  pulseSiteIdFromBrandUrl,
} from '../lib/growthStack';
import {
  fetchAegisUrlCheck,
  fetchCitePilotCitations,
  fetchPulseStats,
  type AegisUrlCheckResponse,
  type CitePilotCitationsResponse,
  type PulseStatsResponse,
} from '../lib/growthStackApi';
import {
  loadGrowthStackSettings,
  loadCitationHistory,
  recordCitationScore,
} from '../utils/growthStackSettings';
import PulseEnableCard from './PulseEnableCard';

interface GrowthStackInsightsProps {
  brandUrl: string;
  compact?: boolean;
}

export default function GrowthStackInsights({ brandUrl, compact }: GrowthStackInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [citations, setCitations] = useState<CitePilotCitationsResponse | null>(null);
  const [security, setSecurity] = useState<AegisUrlCheckResponse | null>(null);
  const [pulse, setPulse] = useState<PulseStatsResponse | null>(null);
  const domain = normalizeDomainForAudit(brandUrl);
  const pulseSiteId = domain ? pulseSiteIdFromBrandUrl(brandUrl) : '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const settings = loadGrowthStackSettings();
      const [citeRes, secRes, pulseRes] = await Promise.all([
        domain ? fetchCitePilotCitations(domain, settings.citePilotApiKey) : Promise.resolve(null),
        brandUrl ? fetchAegisUrlCheck(brandUrl) : Promise.resolve(null),
        domain ? fetchPulseStats(domain) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      if (citeRes?.score != null && domain) {
        recordCitationScore(domain, citeRes.score);
      }
      setCitations(citeRes);
      setSecurity(secRes);
      setPulse(pulseRes);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [brandUrl, domain]);

  const history = domain ? loadCitationHistory(domain) : [];
  const localTrend =
    history.length >= 2 ? history[0].score - history[1].score : citations?.trend ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading growth stack insights…
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div
        className={`grid gap-4 ${
          compact ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        <CitationCard
          domain={domain}
          brandUrl={brandUrl}
          data={citations}
          trend={localTrend}
          compact={compact}
        />
        <SecurityCard data={security} brandUrl={brandUrl} compact={compact} />
        <PulseCard
          domain={domain}
          siteId={pulseSiteId}
          brandUrl={brandUrl}
          data={pulse}
          compact={compact}
        />
      </div>

      {!compact && (
        <div className="grid sm:grid-cols-3 gap-4">
          <a
            href={citePilotAuditUrl(brandUrl || domain)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 border border-cyan-800/40 rounded-xl hover:border-cyan-600/50 transition-colors group"
          >
            <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Deep dive · CitePilot
            </p>
            <p className="text-sm font-bold text-white mt-2 group-hover:text-cyan-100">
              Open full citation audit →
            </p>
          </a>
          <a
            href={kerygmaSignUpUrl(brandUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 border border-amber-800/40 rounded-xl hover:border-amber-600/50 transition-colors group"
          >
            <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Execute · Kerygma Social
            </p>
            <p className="text-sm font-bold text-white mt-2 group-hover:text-amber-100">
              Generate social posts on autopilot →
            </p>
          </a>
          <a
            href={pulseDashboardUrl(brandUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 border border-emerald-800/40 rounded-xl hover:border-emerald-600/50 transition-colors group"
          >
            <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Measure · Pulse
            </p>
            <p className="text-sm font-bold text-white mt-2 group-hover:text-emerald-100">
              Open site analytics →
            </p>
          </a>
        </div>
      )}
    </div>
  );
}

function CitationCard({
  domain,
  brandUrl,
  data,
  trend,
  compact,
}: {
  domain: string;
  brandUrl: string;
  data: CitePilotCitationsResponse | null;
  trend: number | null;
  compact?: boolean;
}) {
  if (!data?.connected && data?.error) {
    return (
      <InsightShell
        icon={<Search className="w-4 h-4 text-cyan-400" />}
        title="AI citation visibility"
        compact={compact}
      >
        <p className="text-xs text-slate-500">{data.error}</p>
        <a
          href={citePilotAuditUrl(brandUrl || domain)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-cyan-400"
        >
          Run free audit on CitePilot <ExternalLink className="w-3 h-3" />
        </a>
      </InsightShell>
    );
  }

  if (!data?.hasAudit) {
    return (
      <InsightShell
        icon={<Search className="w-4 h-4 text-cyan-400" />}
        title="AI citation visibility"
        compact={compact}
      >
        <p className="text-xs text-slate-400 leading-relaxed">
          No CitePilot audit on file for <strong className="text-slate-300">{domain}</strong> yet.
        </p>
        <a
          href={data?.auditUrl || citePilotAuditUrl(brandUrl || domain)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-cyan-400"
        >
          Run free citation audit <ExternalLink className="w-3 h-3" />
        </a>
      </InsightShell>
    );
  }

  return (
    <InsightShell
      icon={<Search className="w-4 h-4 text-cyan-400" />}
      title="AI citation visibility"
      compact={compact}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-display font-bold text-white">
            {data.score}
            <span className="text-sm text-slate-500 font-normal">/100</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {data.cited ?? 0} of {data.total ?? 0} prompts cited
          </p>
        </div>
        {trend != null && trend !== 0 && (
          <span
            className={`flex items-center gap-0.5 text-xs font-bold ${
              trend > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend > 0 ? '+' : ''}
            {trend} pts
          </span>
        )}
        {trend === 0 && (
          <span className="flex items-center gap-0.5 text-xs text-slate-500">
            <Minus className="w-3.5 h-3.5" /> Steady
          </span>
        )}
      </div>
      {data.auditedAt && (
        <p className="text-[10px] text-slate-600 mt-2">
          Last audit {new Date(data.auditedAt).toLocaleDateString()}
        </p>
      )}
      {data.reportUrl && (
        <a
          href={data.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-cyan-400/90"
        >
          View on {GROWTH_STACK_PRODUCTS.citePilot.name} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </InsightShell>
  );
}

function SecurityCard({
  data,
  brandUrl,
  compact,
}: {
  data: AegisUrlCheckResponse | null;
  brandUrl: string;
  compact?: boolean;
}) {
  if (!data?.connected && data?.error) {
    return (
      <InsightShell
        icon={<Shield className="w-4 h-4 text-violet-400" />}
        title="Security headers"
        compact={compact}
      >
        <p className="text-xs text-slate-500">{data.error}</p>
      </InsightShell>
    );
  }

  if (!data || data.status === 'failed') {
    return (
      <InsightShell
        icon={<Shield className="w-4 h-4 text-violet-400" />}
        title="Security headers"
        compact={compact}
      >
        <p className="text-xs text-slate-400">{data?.summary || 'Could not probe this URL.'}</p>
      </InsightShell>
    );
  }

  return (
    <InsightShell
      icon={<Shield className="w-4 h-4 text-violet-400" />}
      title="Security headers"
      compact={compact}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-display font-bold text-white">
            {data.score}
            <span className="text-sm text-slate-500 font-normal ml-1">· Grade {data.grade}</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{data.summary}</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
        <HeaderPill ok={data.https} label="HTTPS" />
        <HeaderPill ok={data.hsts} label="HSTS" />
        <HeaderPill ok={data.csp} label="CSP" />
      </ul>
      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">{data.marketerNote}</p>
      <a
        href={data.reportUrl || GROWTH_STACK_PRODUCTS.aegis.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-violet-400/90"
      >
        Full scan in Aegis Loop <ExternalLink className="w-3 h-3" />
      </a>
    </InsightShell>
  );
}

function PulseCard({
  domain,
  siteId,
  brandUrl,
  data,
  compact,
}: {
  domain: string;
  siteId: string;
  brandUrl: string;
  data: PulseStatsResponse | null;
  compact?: boolean;
}) {
  const dashboard = data?.dashboardUrl || pulseDashboardUrl(brandUrl);

  if (!data?.connected && data?.error) {
    return (
      <InsightShell
        icon={<Activity className="w-4 h-4 text-emerald-400" />}
        title="Site analytics"
        compact={compact}
      >
        <p className="text-xs text-slate-500">{data.error}</p>
        <a
          href={dashboard}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400"
        >
          Open Pulse <ExternalLink className="w-3 h-3" />
        </a>
      </InsightShell>
    );
  }

  if (!data?.live) {
    return (
      <InsightShell
        icon={<Activity className="w-4 h-4 text-emerald-400" />}
        title="Site analytics"
        compact={compact}
      >
        <p className="text-xs text-slate-400 leading-relaxed">
          No Pulse traffic for <strong className="text-slate-300">{domain}</strong> yet.
        </p>
        <div className="mt-3">
          <PulseEnableCard brandUrl={brandUrl} compact />
        </div>
        <a
          href={dashboard}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400"
        >
          Open Pulse dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </InsightShell>
    );
  }

  return (
    <InsightShell
      icon={<Activity className="w-4 h-4 text-emerald-400" />}
      title="Site analytics · 7d"
      compact={compact}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-display font-bold text-white">
            {data.visitors ?? 0}
            <span className="text-sm text-slate-500 font-normal ml-1">visitors</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {data.views ?? 0} views · {data.conversions ?? 0} conversions
          </p>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-2">
        {data.totalEvents ?? 0} events · site <span className="font-mono">{siteId}</span>
      </p>
      <a
        href={dashboard}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-400/90"
      >
        Full report in {GROWTH_STACK_PRODUCTS.pulse.name} <ExternalLink className="w-3 h-3" />
      </a>
    </InsightShell>
  );
}

function InsightShell({
  icon,
  title,
  compact,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function HeaderPill({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded border ${
        ok
          ? 'border-emerald-800/50 text-emerald-400 bg-emerald-950/30'
          : 'border-amber-800/50 text-amber-400 bg-amber-950/30'
      }`}
    >
      {ok ? '✓' : '○'} {label}
    </span>
  );
}
