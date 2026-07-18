/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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
import GrowthStackEmptyPreview from './dashboard/GrowthStackEmptyPreview';
import { helpForSecurityHeader, type SecurityHeaderLabel } from '../utils/securityHeaderHelp';

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
        brandUrl ? fetchAegisUrlCheck(brandUrl, settings.aegisApiKey) : Promise.resolve(null),
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
            href={kerygmaSignUpUrl(brandUrl, 'growth-insights')}
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
    const auditHref = data?.auditUrl || citePilotAuditUrl(brandUrl || domain);
    return (
      <InsightShell
        icon={<Search className="w-4 h-4 text-cyan-400" />}
        title="AI citation visibility"
        compact={compact}
      >
        <GrowthStackEmptyPreview variant="citation" className="mb-3" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Run a free CitePilot audit to see how often AI cites your brand on buyer prompts.
        </p>
        <a
          href={auditHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          Here&apos;s what you&apos;ll see once you run your first audit →
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
        <HeaderPill ok={data.https} label="HTTPS" {...helpForSecurityHeader('HTTPS', data.reportUrl)} />
        <HeaderPill ok={data.hsts} label="HSTS" {...helpForSecurityHeader('HSTS', data.reportUrl)} />
        <HeaderPill ok={data.csp} label="CSP" {...helpForSecurityHeader('CSP', data.reportUrl)} />
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
  const enableRef = useRef<HTMLDivElement>(null);

  const scrollToEnable = () => {
    enableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const focusable = enableRef.current?.querySelector<HTMLElement>('button, a, input');
    focusable?.focus();
  };

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
        <GrowthStackEmptyPreview variant="pulse" className="mb-3" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Enable Pulse to track visitors, views, and conversions from your campaigns.
        </p>
        <button
          type="button"
          onClick={scrollToEnable}
          className="mt-3 flex w-full items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Here&apos;s what you&apos;ll see once Pulse is tracking your site →
        </button>
        <div ref={enableRef} className="mt-3">
          <PulseEnableCard brandUrl={brandUrl} compact />
        </div>
        <a
          href={dashboard}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-400/80 hover:text-emerald-400"
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

function HeaderPill({
  ok,
  label,
  okHint,
  missingHint,
  fixUrl,
}: {
  ok?: boolean;
  label: SecurityHeaderLabel;
  okHint: string;
  missingHint: string;
  fixUrl: string;
}) {
  const pillClass = `px-2 py-0.5 rounded border ${
    ok
      ? 'border-emerald-800/50 text-emerald-400 bg-emerald-950/30'
      : 'border-amber-800/50 text-amber-400 bg-amber-950/30'
  }`;

  if (ok) {
    return (
      <span className={pillClass} title={okHint}>
        ✓ {label}
      </span>
    );
  }

  return (
    <span className="relative group/pill" tabIndex={0}>
      <span className={`${pillClass} cursor-help`}>○ {label}</span>
      <span
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 hidden group-hover/pill:block group-focus-within/pill:block z-10 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 shadow-lg"
      >
        <p className="text-[10px] text-slate-300 leading-snug">{missingHint}</p>
        <a
          href={fixUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-bold text-violet-300 hover:text-violet-200"
        >
          How to fix →
        </a>
      </span>
    </span>
  );
}
