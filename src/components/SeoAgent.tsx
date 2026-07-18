/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, Globe, Zap, AlertTriangle, CheckCircle2,
  RefreshCw, Link2, BarChart3, FileText, Target, Layers, Copy, Check, Plus, Download, Lock,
} from 'lucide-react';
import { clearSeoStorage } from '../utils/campaignRuns';
import { apiFetch } from '../lib/api';
import { useProgress } from '../contexts/ProgressContext';
import { isCloudEnabled } from '../lib/cloudConfig';
import { fetchBillingStatus, canRunLocalAudit, recordLocalAuditUsage, canRunDeepCrawlLocal, recordLocalDeepCrawlPages, type BillingStatus } from '../lib/billingApi';
import type { CrawlMode } from '../lib/plans';
import { fetchOrg } from '../lib/teamsApi';
import { exportSeoAuditPdf } from '../utils/auditReport';
import { exportMetaTags, fetchIntegrationStatus, fetchLiveSeoData } from '../lib/workspaceApi';
import GrowthStackInsights from './GrowthStackInsights';
import { showGrowthStackUi } from '../lib/brand';
import AnalyticsLoopPanel from './AnalyticsLoopPanel';
import { normalizeBrandUrl, looksLikeBrokenDomain } from '../utils/websiteUrl';
import {
  CompetitorComparison,
  KeywordCluster,
  SeoScoreSnapshot,
} from '../types';
import {
  addNotification,
  appendSeoScoreSnapshot,
  checkScoreDrop,
  loadNotificationPrefs,
  loadSeoScoreHistory,
} from '../utils/notifications';
import {
  WebsiteAnalysis,
  SiteCrawlResult,
  SeoAgentAuditResult,
  SeoStackIntegrations,
  MetaTagRewrite,
} from '../types';

interface SeoAgentProps {
  brandUrl: string;
  companyInfo: WebsiteAnalysis;
  onBackToDashboard: () => void;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onGenerateSeoKeywords?: () => void;
  isGeneratingKeywords?: boolean;
  onNewBrandAudit?: () => void;
  onOpenBilling?: () => void;
}

type AgentTab = 'overview' | 'technical' | 'keywords' | 'meta' | 'roadmap' | 'content' | 'integrations' | 'competitors' | 'analytics';

const DEFAULT_INTEGRATIONS: SeoStackIntegrations = {
  googleSearchConsole: { connected: false },
  ga4: { connected: false },
  keywordTool: { connected: false },
};

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} stroke="#1e293b" strokeWidth="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={r}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {score}%
        </span>
      </div>
      <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">{label}</span>
    </div>
  );
}

export default function SeoAgent({
  brandUrl,
  companyInfo,
  onBackToDashboard,
  triggerToast,
  onGenerateSeoKeywords,
  isGeneratingKeywords,
  onNewBrandAudit,
  onOpenBilling,
}: SeoAgentProps) {
  const [crawlMode, setCrawlMode] = useState<CrawlMode>('quick');
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [siteUrl, setSiteUrl] = useState(() => normalizeBrandUrl(brandUrl) || '');
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');
  const [phase, setPhase] = useState<'idle' | 'crawling' | 'analyzing' | 'done'>('idle');
  const [crawl, setCrawl] = useState<SiteCrawlResult | null>(() => {
    try {
      const s = localStorage.getItem('ai_cmo_seo_crawl');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [audit, setAudit] = useState<SeoAgentAuditResult | null>(() => {
    try {
      const s = localStorage.getItem('ai_cmo_seo_audit');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [integrations, setIntegrations] = useState<SeoStackIntegrations>(() => {
    try {
      const s = localStorage.getItem('ai_cmo_seo_integrations');
      return s ? JSON.parse(s) : DEFAULT_INTEGRATIONS;
    } catch {
      return DEFAULT_INTEGRATIONS;
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<MetaTagRewrite | null>(null);
  const [liveSeoLoading, setLiveSeoLoading] = useState(false);
  const [ga4PropertyId, setGa4PropertyId] = useState('');

  useEffect(() => {
    const normalized = normalizeBrandUrl(brandUrl);
    if (normalized) setSiteUrl(normalized);
  }, [brandUrl]);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorData, setCompetitorData] = useState<CompetitorComparison | null>(null);
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<SeoScoreSnapshot[]>(() => loadSeoScoreHistory());
  const [lastAuditError, setLastAuditError] = useState<string | null>(null);
  const { startProgress, setProgress, endProgress } = useProgress();

  useEffect(() => {
    localStorage.setItem('ai_cmo_seo_integrations', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    fetchBillingStatus().then(setBillingStatus).catch(() => undefined);
  }, []);

  // Pull live GSC/GA4 when cloud integrations are connected
  useEffect(() => {
    if (!isCloudEnabled()) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchIntegrationStatus();
        if (cancelled) return;
        const gsc = status.connections.google_search_console?.connected;
        const ga4 = status.connections.google_analytics?.connected;
        setIntegrations((prev) => ({
          ...prev,
          googleSearchConsole: {
            ...prev.googleSearchConsole,
            connected: !!gsc,
            propertyUrl: siteUrl || brandUrl,
          },
          ga4: {
            ...prev.ga4,
            connected: !!ga4,
          },
        }));
        if (!gsc && !ga4) return;
        setLiveSeoLoading(true);
        const live = await fetchLiveSeoData(siteUrl || brandUrl, ga4PropertyId || undefined);
        if (cancelled) return;
        setIntegrations((prev) => ({
          ...prev,
          googleSearchConsole: {
            ...prev.googleSearchConsole,
            connected: !!gsc,
            propertyUrl: siteUrl || brandUrl,
            topQueries: live.topQueries || prev.googleSearchConsole.topQueries,
          },
          ga4: {
            ...prev.ga4,
            connected: !!ga4,
            propertyId: ga4PropertyId || prev.ga4.propertyId,
            topPages: live.topPages || prev.ga4.topPages,
          },
        }));
      } catch {
        /* live data optional */
      } finally {
        if (!cancelled) setLiveSeoLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brandUrl, siteUrl, ga4PropertyId]);

  const startNewSeoAudit = () => {
    clearSeoStorage();
    setCrawl(null);
    setAudit(null);
    setPhase('idle');
    setActiveTab('overview');
    setSelectedMeta(null);
    triggerToast?.('Ready for a new SEO audit — enter a URL and run.', 'info');
  };

  const runFullAudit = async (mode: CrawlMode = crawlMode) => {
    if (!siteUrl.trim()) {
      triggerToast?.('Enter a website URL to audit.', 'error');
      return;
    }
    const billing = billingStatus || (await fetchBillingStatus());
    setBillingStatus(billing);
    const auditGate = canRunLocalAudit(billing);
    if (!auditGate.allowed) {
      triggerToast?.(auditGate.reason || 'Audit limit reached. Upgrade in Settings → Billing.', 'error');
      return;
    }
    const crawlGate = canRunDeepCrawlLocal(billing, mode);
    if (!crawlGate.allowed) {
      triggerToast?.(crawlGate.reason || 'Deep crawl requires Pro.', 'error');
      return;
    }
    setCrawlMode(mode);
    setLastAuditError(null);
    setPhase('crawling');
    startProgress(mode === 'deep' ? 'Deep crawling every page…' : 'Crawling your site…');
    setProgress(15);
    try {
      const crawlRes = await apiFetch('/api/seo-agent/crawl', {
        method: 'POST',
        body: JSON.stringify({ url: siteUrl.trim(), mode }),
      });
      if (!crawlRes.ok) {
        const err = await crawlRes.json().catch(() => ({}));
        if (err.upgradeRequired && onOpenBilling) {
          triggerToast?.(err.error || 'Upgrade required for deep crawl.', 'error');
        }
        throw new Error(err.error || 'Crawl failed');
      }
      const crawlData: SiteCrawlResult = await crawlRes.json();
      setCrawl(crawlData);
      localStorage.setItem('ai_cmo_seo_crawl', JSON.stringify(crawlData));
      if (mode === 'deep' && !isCloudEnabled()) {
        recordLocalDeepCrawlPages(crawlData.pagesCrawled);
      } else if (mode === 'deep') {
        fetchBillingStatus().then(setBillingStatus).catch(() => undefined);
      }

      setPhase('analyzing');
      setProgress(45, 'Analyzing pages & keyword gaps…');
      const auditRes = await apiFetch('/api/seo-agent/audit', {
        method: 'POST',
        body: JSON.stringify({
          url: siteUrl.trim(),
          crawlResult: crawlData,
          companyInfo,
          integrations: integrations.googleSearchConsole.connected || integrations.ga4.connected
            ? integrations
            : undefined,
        }),
      });
      if (!auditRes.ok) {
        const err = await auditRes.json().catch(() => ({}));
        throw new Error(err.error || 'AI audit failed');
      }
      const auditData: SeoAgentAuditResult = await auditRes.json();
      setAudit(auditData);
      localStorage.setItem('ai_cmo_seo_audit', JSON.stringify(auditData));
      if (!isCloudEnabled()) recordLocalAuditUsage();

      const history = appendSeoScoreSnapshot({
        overallScore: auditData.overallScore,
        technicalScore: auditData.technicalScore,
        contentScore: auditData.contentScore,
        keywordScore: auditData.keywordScore,
        label: companyInfo.brandName,
      });
      setScoreHistory(history);
      checkScoreDrop(auditData.overallScore);
      const prefs = loadNotificationPrefs();
      if (prefs.onAuditComplete) {
        addNotification({
          type: 'audit_complete',
          title: 'SEO audit complete',
          message: `${companyInfo.brandName}: ${auditData.overallScore}% overall score. ${auditData.keywordGaps.length} keyword gaps found.`,
        });
        if (prefs.slackWebhookUrl) {
          apiFetch('/api/notifications/dispatch', {
            method: 'POST',
            body: JSON.stringify({
              type: 'audit_complete',
              title: 'SEO audit complete',
              message: `${companyInfo.brandName}: ${auditData.overallScore}% overall`,
              slackWebhookUrl: prefs.slackWebhookUrl,
            }),
          }).catch(() => undefined);
        }
      }

      setClustersLoading(true);
      apiFetch('/api/seo-intel/keyword-clusters', {
        method: 'POST',
        body: JSON.stringify({
          keywordGaps: auditData.keywordGaps,
          topQueries: integrations.googleSearchConsole.topQueries,
          companyInfo,
        }),
      })
        .then((r) => r.json())
        .then((d) => setClusters(d.clusters || []))
        .catch(() => undefined)
        .finally(() => setClustersLoading(false));

      setProgress(100, 'Audit complete');
      setTimeout(() => endProgress(), 600);
      setPhase('done');
      triggerToast?.('SEO audit complete — strategy and roadmap ready.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Audit failed';
      setLastAuditError(msg);
      endProgress();
      triggerToast?.(msg, 'error');
      setPhase('idle');
    }
  };

  const runCompetitorCompare = async () => {
    if (!competitorUrl.trim() || !siteUrl.trim()) {
      triggerToast?.('Enter your URL and a competitor URL.', 'error');
      return;
    }
    setCompetitorLoading(true);
    try {
      const res = await apiFetch('/api/seo-intel/competitor-compare', {
        method: 'POST',
        body: JSON.stringify({
          yourUrl: siteUrl.trim(),
          competitorUrl: competitorUrl.trim(),
          companyInfo,
        }),
      });
      if (!res.ok) throw new Error('Compare failed');
      const data = await res.json();
      setCompetitorData(data);
      setActiveTab('competitors');
      triggerToast?.('Competitor analysis ready.', 'success');
    } catch (e: unknown) {
      triggerToast?.(e instanceof Error ? e.message : 'Compare failed', 'error');
    } finally {
      setCompetitorLoading(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportPdfReport = async () => {
    if (!audit) return;
    setExportingPdf(true);
    try {
      const org = await fetchOrg();
      await exportSeoAuditPdf(audit, {
        clientName: companyInfo.brandName,
        siteUrl: siteUrl.trim(),
        agencyName: org?.agency_name || undefined,
        agencyLogoUrl: org?.agency_logo_url || undefined,
      });
      triggerToast?.('Print dialog opened — save as PDF.', 'success');
    } catch (e: unknown) {
      triggerToast?.(e instanceof Error ? e.message : 'PDF export failed', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const exportAllMetaTags = async () => {
    if (!audit?.metaTagRewrites?.length) return;
    try {
      const pages = audit.metaTagRewrites.map((m) => ({
        url: m.url,
        title: m.suggestedTitle,
        metaDescription: m.suggestedMetaDescription,
      }));
      const { html } = await exportMetaTags(pages);
      await navigator.clipboard.writeText(html);
      triggerToast?.('Meta tag pack copied to clipboard — paste into your CMS.', 'success');
    } catch {
      const fallback = audit.metaTagRewrites
        .map((m) => `<!-- ${m.url} -->\n<title>${m.suggestedTitle}</title>\n<meta name="description" content="${m.suggestedMetaDescription}" />`)
        .join('\n\n');
      await navigator.clipboard.writeText(fallback);
      triggerToast?.('Meta tags copied (local export).', 'success');
    }
  };

  const allIssues = crawl
    ? [
        ...crawl.siteWideIssues,
        ...crawl.pages.flatMap((p) => p.issues.map((i) => ({ ...i, page: p.url }))),
      ]
    : [];
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  const tabs: { id: AgentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'technical', label: 'Technical crawl', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'keywords', label: 'Keyword gaps', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'meta', label: 'Meta tags', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: '100% roadmap', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'content', label: 'Content plan', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'competitors', label: 'Competitors', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Uplift', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'integrations', label: 'SEO stack', icon: <Link2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-16 animate-fade-in" id="seo-agent-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              SEO AI Agent
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Crawl every page, find keyword gaps, fix technical issues, and build a 100% optimization plan.
            </p>
          </div>
        </div>
      </div>

      {lastAuditError && (
        <div role="alert" className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-rose-300">{lastAuditError}</p>
          <button
            type="button"
            onClick={() => runFullAudit(crawlMode)}
            className="text-xs font-bold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          >
            Retry audit
          </button>
        </div>
      )}

      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Website to audit</label>
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {looksLikeBrokenDomain(siteUrl) && (
              <p className="mt-1.5 text-[11px] text-amber-400">
                This domain looks misspelled (`.om` instead of `.com`). Try{' '}
                <button
                  type="button"
                  onClick={() => setSiteUrl(normalizeBrandUrl(siteUrl))}
                  className="underline font-semibold cursor-pointer"
                >
                  {normalizeBrandUrl(siteUrl)}
                </button>
              </p>
            )}
          </div>
          <div className="flex-1 w-full md:max-w-xs">
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Competitor URL</label>
            <input
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://competitor.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Crawl mode */}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCrawlMode('quick')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              crawlMode === 'quick'
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <p className="text-sm font-bold text-white">Quick audit</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {billingStatus?.limits.quickCrawlMaxPages ?? 8} pages · site summary · included on all plans
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!billingStatus?.limits.deepCrawlEnabled) {
                triggerToast?.('Deep crawl requires Pro or Team.', 'info');
                return;
              }
              setCrawlMode('deep');
            }}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              crawlMode === 'deep'
                ? 'border-amber-500/50 bg-amber-950/20'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            } ${!billingStatus?.limits.deepCrawlEnabled ? 'opacity-80' : ''}`}
          >
            <p className="text-sm font-bold text-white flex items-center gap-2">
              Deep crawl
              {!billingStatus?.limits.deepCrawlEnabled && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-0.5">
                  <Lock className="w-3 h-3" /> Pro
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Up to {billingStatus?.limits.deepCrawlMaxPagesPerJob ?? 100} pages · per-page modules · link map
            </p>
            {billingStatus?.limits.deepCrawlEnabled && (
              <p className="text-[10px] text-amber-400/80 mt-1 font-mono">
                {billingStatus.usage.deepCrawlPagesThisMonth ?? 0} / {billingStatus.limits.deepCrawlPagesPerMonth} page credits used
              </p>
            )}
          </button>
        </div>

        {!billingStatus?.limits.deepCrawlEnabled && onOpenBilling && (
          <p className="text-[11px] text-slate-500">
            Need page-by-page analysis?{' '}
            <button type="button" onClick={onOpenBilling} className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer">
              Upgrade to Pro →
            </button>
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          {(crawl || audit) && (
            <button
              type="button"
              onClick={startNewSeoAudit}
              disabled={phase === 'crawling' || phase === 'analyzing'}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700 text-slate-200 font-bold rounded-lg text-sm cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New SEO audit
            </button>
          )}
          <button
            type="button"
            onClick={runCompetitorCompare}
            disabled={competitorLoading || !competitorUrl.trim()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700 text-slate-200 font-bold rounded-lg text-sm cursor-pointer"
          >
            {competitorLoading ? 'Comparing…' : 'Compare competitor'}
          </button>
          <button
            type="button"
            onClick={() => runFullAudit(crawlMode)}
            disabled={phase === 'crawling' || phase === 'analyzing' || (crawlMode === 'deep' && !billingStatus?.limits.deepCrawlEnabled)}
            className={`px-5 py-2.5 font-bold rounded-lg text-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
              crawlMode === 'deep'
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {(phase === 'crawling' || phase === 'analyzing') && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            {phase === 'crawling'
              ? crawlMode === 'deep' ? 'Deep crawling…' : 'Crawling pages…'
              : phase === 'analyzing'
                ? 'Building strategy…'
                : crawlMode === 'deep'
                  ? audit ? 'Re-run deep audit' : 'Run deep SEO audit'
                  : audit ? 'Re-run quick audit' : 'Run quick SEO audit'}
          </button>
        </div>
      </div>

      {onNewBrandAudit && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-slate-500">Auditing a different brand entirely?</p>
          <button
            type="button"
            onClick={onNewBrandAudit}
            className="text-[11px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New brand audit
          </button>
        </div>
      )}

      {crawl && (
        <div className="flex flex-wrap gap-3 text-[10px] font-mono">
          <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400">
            {crawl.pagesCrawled} pages crawled
            {crawl.pagesDiscovered != null && crawl.pagesDiscovered > crawl.pagesCrawled && (
              <> · {crawl.pagesDiscovered} discovered</>
            )}
          </span>
          {crawl.crawlMode === 'deep' && (
            <span className="px-2 py-1 bg-amber-950/40 border border-amber-800/40 rounded text-amber-400">
              Deep crawl
            </span>
          )}
          <span className="px-2 py-1 bg-rose-950/40 border border-rose-800/40 rounded text-rose-400">
            {criticalCount} critical
          </span>
          <span className="px-2 py-1 bg-amber-950/40 border border-amber-800/40 rounded text-amber-400">
            {warningCount} warnings
          </span>
          {audit && (
            <span className="px-2 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-400">
              Overall score {audit.overallScore}%
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-b-2 -mb-px cursor-pointer transition-colors ${
              activeTab === t.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {showGrowthStackUi() && <GrowthStackInsights brandUrl={siteUrl || brandUrl} />}
          {!audit ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Run a full audit to see scores, gaps, and your optimization roadmap.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <ScoreRing score={audit.overallScore} label="Overall" color="#34d399" />
                <ScoreRing score={audit.technicalScore} label="Technical" color="#2dd4bf" />
                <ScoreRing score={audit.contentScore} label="Content" color="#60a5fa" />
                <ScoreRing score={audit.keywordScore} label="Keywords" color="#fbbf24" />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={exportPdfReport}
                  disabled={exportingPdf}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {exportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export PDF report
                </button>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase mb-2">Executive summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{audit.executiveSummary}</p>
                {audit.integratedInsights && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
                    <strong className="text-slate-400">Stack insights:</strong> {audit.integratedInsights}
                  </p>
                )}
              </div>
              {scoreHistory.length > 1 && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-3">Score over time</h4>
                  <div className="flex items-end gap-2 h-24">
                    {scoreHistory.slice(-10).map((s, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-emerald-500/80 rounded-t"
                          style={{ height: `${Math.max(8, s.overallScore)}%` }}
                          title={`${s.overallScore}%`}
                        />
                        <span className="text-[8px] text-slate-600 font-mono">
                          {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {onGenerateSeoKeywords && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onGenerateSeoKeywords}
                    disabled={isGeneratingKeywords}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    {isGeneratingKeywords ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    {isGeneratingKeywords ? 'Generating keywords…' : 'Generate SEO Keywords asset from audit'}
                  </button>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Top keyword gaps</h4>
                  <ul className="space-y-2">
                    {audit.keywordGaps.slice(0, 5).map((g, i) => (
                      <li key={i} className="text-xs text-slate-300 flex justify-between gap-2">
                        <span className="font-medium text-white truncate">{g.keyword}</span>
                        <span className="text-emerald-400 shrink-0">{g.opportunityScore}% opp</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Roadmap phases</h4>
                  <ul className="space-y-2">
                    {audit.optimizationRoadmap.map((p) => (
                      <li key={p.phase} className="text-xs text-slate-300">
                        <span className="text-amber-400 font-bold">Phase {p.phase}:</span> {p.title}{' '}
                        <span className="text-slate-500">(+{p.estimatedLiftPercent}% est.)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="space-y-4">
          {!crawl ? (
            <p className="text-slate-500 text-sm py-8 text-center">Run an audit to crawl pages.</p>
          ) : (
            <>
              {crawl.crawlMode === 'deep' && crawl.linkGraph && (
                <div className="p-4 bg-amber-950/15 border border-amber-800/30 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    Link map (deep crawl)
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">Pages crawled</span>
                      <span className="text-white font-bold">{crawl.linkGraph.nodes.length}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">Internal links</span>
                      <span className="text-white font-bold">{crawl.linkGraph.edges.length}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">Orphan pages</span>
                      <span className="text-rose-400 font-bold">{crawl.linkGraph.orphanPages.length}</span>
                    </div>
                  </div>
                  {crawl.linkGraph.orphanPages.length > 0 && (
                    <ul className="text-[10px] text-slate-400 space-y-1 max-h-24 overflow-y-auto">
                      {crawl.linkGraph.orphanPages.slice(0, 8).map((u) => (
                        <li key={u} className="truncate text-rose-300/80">{u}</li>
                      ))}
                    </ul>
                  )}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {crawl.linkGraph.nodes
                      .sort((a, b) => a.depth - b.depth)
                      .slice(0, 20)
                      .map((n) => (
                        <div key={n.url} className="flex justify-between gap-2 text-[10px] font-mono">
                          <span className="text-slate-400 truncate" style={{ paddingLeft: n.depth * 8 }}>
                            {n.url.replace(crawl.baseUrl, '') || '/'}
                          </span>
                          <span className="text-slate-500 shrink-0">{n.internalLinks} links</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {crawl.siteWideIssues.length > 0 && (
                <div className="p-4 bg-rose-950/20 border border-rose-800/30 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase">Site-wide issues</h4>
                  {crawl.siteWideIssues.map((issue, i) => (
                    <div key={i}>
                      <IssueRow issue={issue} />
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {crawl.pages.map((page) => (
                  <div key={page.url} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline truncate max-w-full"
                      >
                        {page.url}
                      </a>
                      <span className="text-[10px] font-mono text-slate-500">
                        {page.statusCode} · {page.wordCount} words
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mb-2">
                      <strong className="text-slate-300">Title:</strong> {page.title || '(missing)'}
                    </p>
                    {page.modules && page.modules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {page.modules.map((mod) => (
                          <span
                            key={mod.id}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400"
                            title={`${mod.wordCount} words · ${mod.linkCount} links`}
                          >
                            {mod.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {page.issues.length === 0 ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> No issues detected
                      </span>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {page.issues.map((issue, i) => (
                          <div key={i}>
                            <IssueRow issue={issue} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'keywords' && audit && (
        <div className="overflow-x-auto -mx-1 px-1" role="region" aria-label="Keyword gaps table">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase">
                <th className="py-2 pr-4">Keyword</th>
                <th className="py-2 pr-4">Intent</th>
                <th className="py-2 pr-4">Difficulty</th>
                <th className="py-2 pr-4">Opportunity</th>
                <th className="py-2 pr-4">Current</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {audit.keywordGaps.map((g, i) => (
                <tr key={i} className="border-b border-slate-850/50">
                  <td className="py-3 pr-4 font-medium text-white">{g.keyword}</td>
                  <td className="py-3 pr-4 capitalize">{g.intent}</td>
                  <td className="py-3 pr-4 capitalize">{g.difficulty}</td>
                  <td className="py-3 pr-4 text-emerald-400 font-bold">{g.opportunityScore}%</td>
                  <td className="py-3 pr-4 text-slate-500">{g.currentRanking}</td>
                  <td className="py-3 text-slate-400">{g.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-3">Priority targets</h4>
            <div className="flex flex-wrap gap-2">
              {audit.priorityKeywords.map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300"
                  title={k.rationale}
                >
                  {k.keyword} <span className="text-slate-500">({k.volumeTier})</span>
                </span>
              ))}
            </div>
          </div>
          {(clusters.length > 0 || clustersLoading) && (
            <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-3">
                Keyword clusters {clustersLoading && '· generating…'}
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {clusters.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{c.intent}</p>
                    <p className="text-xs text-slate-400 mt-2">{c.contentBrief}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.keywords.slice(0, 6).map((kw) => (
                        <span key={kw} className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'keywords' && !audit && (
        <p className="text-slate-500 text-sm py-8 text-center">Run an audit for keyword gap analysis.</p>
      )}

      {activeTab === 'meta' && audit && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportAllMetaTags}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg cursor-pointer"
            >
              Export all meta tags
            </button>
          </div>
          {audit.metaTagRewrites.map((m, i) => (
            <div
              key={i}
              className={`p-4 bg-slate-900 border rounded-xl cursor-pointer transition-colors ${
                selectedMeta?.url === m.url ? 'border-emerald-500' : 'border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setSelectedMeta(m)}
            >
              <p className="text-[10px] text-emerald-400 truncate mb-2">{m.url}</p>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Current title</span>
                  <p className="text-slate-400 line-through mt-0.5">{m.currentTitle || '(none)'}</p>
                  <span className="text-[9px] font-mono text-emerald-500 uppercase block mt-2">Suggested</span>
                  <p className="text-white font-medium mt-0.5">{m.suggestedTitle}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Current meta</span>
                  <p className="text-slate-400 line-through mt-0.5">{m.currentMetaDescription || '(none)'}</p>
                  <span className="text-[9px] font-mono text-emerald-500 uppercase block mt-2">Suggested</span>
                  <p className="text-white font-medium mt-0.5">{m.suggestedMetaDescription}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">{m.rationale}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyText(
                    `Title: ${m.suggestedTitle}\nMeta: ${m.suggestedMetaDescription}`,
                    `meta-${i}`
                  );
                }}
                className="mt-2 text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedId === `meta-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy suggested tags
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'meta' && !audit && (
        <p className="text-slate-500 text-sm py-8 text-center">Run an audit for AI meta tag rewrites.</p>
      )}

      {activeTab === 'roadmap' && audit && (
        <div className="space-y-4">
          {audit.optimizationRoadmap.map((phase) => (
            <div key={phase.phase} className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-white">
                  Phase {phase.phase}: {phase.title}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  +{phase.estimatedLiftPercent}% est. lift · {phase.impact} impact
                </span>
              </div>
              <ul className="space-y-1.5">
                {phase.tasks.map((task, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 font-mono shrink-0">{i + 1}.</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roadmap' && !audit && (
        <p className="text-slate-500 text-sm py-8 text-center">Run an audit for the 100% optimization roadmap.</p>
      )}

      {activeTab === 'content' && audit && (
        <div className="grid md:grid-cols-2 gap-4">
          {audit.contentPlan.map((item, i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[9px] font-mono text-amber-500 uppercase">{item.priority} priority</span>
              <h4 className="text-sm font-bold text-white mt-1">{item.topic}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Format: {item.format} · Target: <span className="text-emerald-400">{item.targetKeyword}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'content' && !audit && (
        <p className="text-slate-500 text-sm py-8 text-center">Run an audit for integrated content planning.</p>
      )}

      {activeTab === 'competitors' && (
        <div className="space-y-4">
          {!competitorData ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Enter a competitor URL above and click Compare competitor.
            </p>
          ) : (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-lg font-bold text-white">{competitorData.competitorName}</h3>
              <p className="text-xs text-slate-500">{competitorData.competitorUrl}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-mono text-emerald-500 uppercase mb-2">Their strengths</h4>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {competitorData.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-mono text-rose-500 uppercase mb-2">Their weaknesses</h4>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {competitorData.weaknesses.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-mono text-amber-500 uppercase mb-2">Keyword overlap</h4>
                <div className="flex flex-wrap gap-1">
                  {competitorData.keywordOverlap.map((k) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-mono text-emerald-400 uppercase mb-2">Your opportunities</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {competitorData.opportunities.map((o, i) => (
                    <li key={i}>→ {o}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsLoopPanel siteUrl={siteUrl || brandUrl} audit={audit} ga4PropertyId={ga4PropertyId} />
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {isCloudEnabled() && (
            <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
              Connect Google Search Console and GA4 in <strong className="text-white">Settings → Integrations</strong>.
              {liveSeoLoading ? ' Loading live query and traffic data…' : ' Live data feeds keyword gap analysis when connected.'}
            </p>
          )}
        <div className="grid md:grid-cols-3 gap-4">
          <IntegrationCard
            title="Google Search Console"
            connected={integrations.googleSearchConsole.connected}
            onToggle={(v) =>
              setIntegrations((prev) => ({
                ...prev,
                googleSearchConsole: {
                  ...prev.googleSearchConsole,
                  connected: v,
                  propertyUrl: v ? prev.googleSearchConsole.propertyUrl || siteUrl : undefined,
                  topQueries: v ? prev.googleSearchConsole.topQueries : undefined,
                },
              }))
            }
            fields={
              integrations.googleSearchConsole.connected ? (
                <input
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                  placeholder="Property URL"
                  value={integrations.googleSearchConsole.propertyUrl || ''}
                  onChange={(e) =>
                    setIntegrations((prev) => ({
                      ...prev,
                      googleSearchConsole: { ...prev.googleSearchConsole, propertyUrl: e.target.value },
                    }))
                  }
                />
              ) : null
            }
            description="Pull top queries, clicks, and average position into keyword gap analysis."
            readOnly
          />
          <IntegrationCard
            title="Google Analytics 4"
            connected={integrations.ga4.connected}
            onToggle={(v) =>
              setIntegrations((prev) => ({
                ...prev,
                ga4: {
                  ...prev.ga4,
                  connected: v,
                  propertyId: v ? prev.ga4.propertyId : undefined,
                  topPages: v ? prev.ga4.topPages : undefined,
                },
              }))
            }
            fields={
              integrations.ga4.connected ? (
                <input
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                  placeholder="GA4 Property ID (e.g. properties/123456789)"
                  value={isCloudEnabled() ? (ga4PropertyId || '') : (integrations.ga4.propertyId || '')}
                  onChange={(e) => {
                    if (isCloudEnabled()) {
                      setGa4PropertyId(e.target.value);
                    } else {
                      setIntegrations((prev) => ({
                        ...prev,
                        ga4: { ...prev.ga4, propertyId: e.target.value },
                      }));
                    }
                  }}
                />
              ) : null
            }
            description="Enrich audits with traffic, bounce rate, and landing page performance."
            readOnly
          />
          <IntegrationCard
            title="Keyword research tool"
            connected={integrations.keywordTool.connected}
            onToggle={(v) =>
              setIntegrations((prev) => ({
                ...prev,
                keywordTool: {
                  connected: v,
                  provider: v ? prev.keywordTool.provider : undefined,
                  seedKeywords: v ? prev.keywordTool.seedKeywords : undefined,
                },
              }))
            }
            fields={
              integrations.keywordTool.connected ? (
                <textarea
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white h-16 resize-none"
                  placeholder="Seed keywords (comma separated)"
                  value={(integrations.keywordTool.seedKeywords || []).join(', ')}
                  onChange={(e) =>
                    setIntegrations((prev) => ({
                      ...prev,
                      keywordTool: {
                        ...prev.keywordTool,
                        seedKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    }))
                  }
                />
              ) : null
            }
            description="Feed seed keywords for gap detection and content clustering."
          />
        </div>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: { severity: string; message: string; fix: string; code: string } }) {
  const Icon = issue.severity === 'critical' ? AlertTriangle : issue.severity === 'warning' ? AlertTriangle : CheckCircle2;
  const color =
    issue.severity === 'critical'
      ? 'text-rose-400'
      : issue.severity === 'warning'
        ? 'text-amber-400'
        : 'text-slate-400';
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
      <div>
        <span className={`font-mono font-bold ${color}`}>{issue.code}</span>
        <span className="text-slate-300"> — {issue.message}</span>
        <p className="text-slate-500 mt-0.5">Fix: {issue.fix}</p>
      </div>
    </div>
  );
}

function IntegrationCard({
  title,
  description,
  connected,
  onToggle,
  fields,
  readOnly,
}: {
  title: string;
  description: string;
  connected: boolean;
  onToggle: (connected: boolean) => void;
  fields?: React.ReactNode;
  readOnly?: boolean;
}) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        {readOnly ? (
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${
            connected ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}>
            {connected ? 'Connected' : 'Not connected'}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(!connected)}
            className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${
              connected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {connected ? 'Connected' : 'Connect'}
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      {fields}
    </div>
  );
}
