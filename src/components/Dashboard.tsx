/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  TrendingUp, Target, Calendar, Compass, Search,
  FileText, Chrome, Mail, Award, BookOpen, Clock, ChevronRight, Package, Layers,
  Users, Radio, Sparkles, HelpCircle, Plus,
} from 'lucide-react';
import { WebsiteAnalysis, MarketingAssetType } from '../types';
import {
  computeCampaignReadiness,
  gradeRingColor,
} from '../utils/campaignReadiness';
import CollapsibleSection from './dashboard/CollapsibleSection';
import ReadinessRing from './dashboard/ReadinessRing';
import GrowthStackInsights from './GrowthStackInsights';
import { showGrowthStackUi } from '../lib/brand';

interface DashboardProps {
  analysis: WebsiteAnalysis;
  brandUrl?: string;
  onGenerateAsset: (type: MarketingAssetType) => void;
  generatingType: MarketingAssetType | null;
  assetHistory?: Record<MarketingAssetType, { timestamp: string; summary: string; asset: any; toneIntensity?: number }[]>;
  onNavigateToHistory?: () => void;
  onNavigateToSeoAgent?: () => void;
  onNavigateToCalendar?: () => void;
  onNewAudit?: () => void;
  savedRunsCount?: number;
  onExportCampaignBundle?: () => void;
  isExportingBundle?: boolean;
  hasCachedAssets?: boolean;
}

const SIMPLE_SUBSCORES: Record<string, string> = {
  'Audience clarity': 'You know who your customers are',
  'Channel fit': 'You’re using the right marketing channels',
  'Strategic depth': 'Your message is clear and strong',
  'Execution ready': 'You have a plan you can follow',
};

export default function Dashboard({
  analysis,
  brandUrl = '',
  onGenerateAsset,
  generatingType,
  assetHistory,
  onNavigateToHistory,
  onNavigateToSeoAgent,
  onNavigateToCalendar,
  onNewAudit,
  savedRunsCount = 0,
  onExportCampaignBundle,
  isExportingBundle,
  hasCachedAssets,
}: DashboardProps) {
  const createSectionRef = useRef<HTMLDivElement>(null);

  const strengthsList = analysis.strengths || [];
  const weaknessesList = analysis.weaknesses || [];
  const opportunitiesList = analysis.opportunities || [];

  const audienceCount = analysis.targetAudience?.length ?? 0;
  const channelCount = analysis.recommendedChannels?.length ?? 0;
  const planWeeks = analysis.thirtyDayActionPlan?.length ?? 0;
  const readiness = computeCampaignReadiness(analysis);
  const strokeColor = gradeRingColor(readiness.score);

  const scrollToCreate = () => {
    createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const assetPrototypes = [
    {
      id: 'seo_keywords' as MarketingAssetType,
      title: 'Search Keywords',
      simpleTitle: 'Keyword list',
      desc: 'A list of words people search for — so Google and AI tools can find you.',
      icon: <Search className="w-4 h-4 text-emerald-400" />,
      bg: 'bg-emerald-950/40 border border-emerald-500/20',
    },
    {
      id: 'blog_post' as MarketingAssetType,
      title: 'Blog Article',
      simpleTitle: 'Blog post',
      desc: 'A full article for your website that helps you show up in search results.',
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      bg: 'bg-blue-950/40 border border-blue-500/20',
    },
    {
      id: 'social_posts' as MarketingAssetType,
      title: 'Social Media Posts',
      simpleTitle: 'Social posts',
      desc: 'Ready-to-post content for X/Twitter, LinkedIn, and more.',
      icon: <Chrome className="w-4 h-4 text-purple-400" />,
      bg: 'bg-purple-950/40 border border-purple-500/20',
    },
    {
      id: 'email_sequence' as MarketingAssetType,
      title: 'Email Series',
      simpleTitle: 'Email series',
      desc: 'Three emails that welcome new subscribers and gently pitch your product.',
      icon: <Mail className="w-4 h-4 text-amber-400" />,
      bg: 'bg-amber-950/40 border border-amber-500/20',
    },
    {
      id: 'lead_magnet' as MarketingAssetType,
      title: 'Free Download Offer',
      simpleTitle: 'Lead magnet',
      desc: 'Copy for a free guide or checklist that gets people to sign up for your list.',
      icon: <BookOpen className="w-4 h-4 text-rose-400" />,
      bg: 'bg-rose-950/40 border border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Start here — plain-English guide */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-display font-bold text-white">New here? Start in 3 steps</h3>
            <ol className="mt-2 space-y-2 text-sm text-slate-200 list-decimal list-inside">
              <li>Read your brand summary and score below — that’s your starting point.</li>
              <li>
                {onNavigateToSeoAgent ? (
                  <>
                    Open <button type="button" onClick={onNavigateToSeoAgent} className="text-emerald-400 hover:underline font-semibold cursor-pointer">SEO Agent</button> to check your website for search issues.
                  </>
                ) : (
                  'Run an SEO check on your website.'
                )}
              </li>
              <li>
                <button type="button" onClick={scrollToCreate} className="text-emerald-400 hover:underline font-semibold cursor-pointer">
                  Create your first marketing piece
                </button>{' '}
                (keywords, blog, social, email, or free download).
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Brand snapshot */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 md:p-8 md:pr-6 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="inline-block px-3 py-1.5 bg-slate-800 text-emerald-400 rounded text-sm font-mono border border-slate-700 uppercase tracking-wider">
                Your brand at a glance
              </div>
              <div className="md:hidden flex flex-col items-center">
                <ReadinessRing grade={readiness.grade} score={readiness.score} strokeColor={strokeColor} size="compact" />
                <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">Score</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-none mb-2">
              {analysis.brandName}
            </h2>
            <p className="text-md md:text-lg font-medium text-slate-400 font-display mb-4">
              &ldquo;{analysis.tagline}&rdquo;
            </p>
            <div className="text-sm md:text-base text-slate-300 leading-relaxed font-sans mb-5">
              {analysis.strategicSummary}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 border-t border-slate-800 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-slate-500 shrink-0" />
                Main goal:{' '}
                <strong className="text-white font-medium">{analysis.inferredGrowthGoal || 'Grow organically'}</strong>
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <Award className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">
                  Your voice: <strong className="text-white font-medium">{analysis.inferredBrandVoice}</strong>
                </span>
              </span>
            </div>
          </div>

          <div className="relative bg-slate-950/80 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 md:min-w-[280px]">
            <div className="p-6 flex flex-col items-center justify-center flex-1 min-h-[260px]">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1 self-start w-full">
                How ready are you?
              </span>
              <p className="text-[10px] text-slate-500 self-start w-full mb-4 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Higher = stronger plan. Not about ad spend.
              </p>

              <ReadinessRing grade={readiness.grade} score={readiness.score} strokeColor={strokeColor} />

              <p className="text-xs font-display font-bold text-white mt-4 text-center">{readiness.headline}</p>

              <div className="w-full mt-5 space-y-2">
                {readiness.subscores.map((sub) => (
                  <div key={sub.label} className="space-y-0.5">
                    <div className="flex justify-between text-[9px] gap-2">
                      <span className="text-slate-500 truncate" title={SIMPLE_SUBSCORES[sub.label] || sub.label}>
                        {SIMPLE_SUBSCORES[sub.label] || sub.label}
                      </span>
                      <span className="text-slate-300 font-bold shrink-0">{sub.value}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sub.value}%`,
                          backgroundColor: gradeRingColor(sub.value),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: <Users className="w-3.5 h-3.5 mx-auto text-emerald-400" />, label: 'Customer types', value: audienceCount },
                  { icon: <Radio className="w-3.5 h-3.5 mx-auto text-amber-400" />, label: 'Channels', value: channelCount },
                  { icon: <Calendar className="w-3.5 h-3.5 mx-auto text-blue-400" />, label: 'Weeks planned', value: planWeeks },
                ].map((stat) => (
                  <div key={stat.label} className="py-2 px-1 rounded-lg bg-slate-950 border border-slate-800">
                    {stat.icon}
                    <p className="text-lg font-black text-white mt-1 leading-none">{stat.value}</p>
                    <p className="text-[8px] font-mono text-slate-500 uppercase mt-0.5 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGrowthStackUi() && brandUrl && (
        <CollapsibleSection
          id="growth-stack-insights"
          title="AI visibility this week"
          subtitle="Citation score from CitePilot and security headers from Aegis Loop"
          defaultOpen
        >
          <GrowthStackInsights brandUrl={brandUrl} compact />
        </CollapsibleSection>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {onNewAudit && (
          <button
            type="button"
            onClick={onNewAudit}
            className="p-4 bg-slate-900 border border-violet-500/30 rounded-xl text-left hover:border-violet-500/50 hover:bg-slate-850 transition cursor-pointer group"
          >
            <Plus className="w-5 h-5 text-violet-400 mb-2" />
            <p className="text-sm font-bold text-white">New brand audit</p>
            <p className="text-[11px] text-slate-400 mt-1">Analyze another site or open a saved run</p>
            <span className="text-[10px] text-violet-400 font-bold mt-2 inline-flex items-center gap-1">
              {savedRunsCount > 0 ? `${savedRunsCount} saved` : 'Start fresh'}
              <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        )}
        {onNavigateToSeoAgent && (
          <button
            type="button"
            id="dashboard-seo-agent-btn"
            onClick={onNavigateToSeoAgent}
            className="p-4 bg-slate-900 border border-teal-500/30 rounded-xl text-left hover:border-teal-500/50 hover:bg-slate-850 transition cursor-pointer group"
          >
            <Search className="w-5 h-5 text-teal-400 mb-2" />
            <p className="text-sm font-bold text-white">Check my website SEO</p>
            <p className="text-[11px] text-slate-400 mt-1">Find search problems and keyword gaps</p>
            <span className="text-[10px] text-teal-400 font-bold mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Open SEO Agent <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={scrollToCreate}
          className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl text-left hover:border-emerald-500/50 hover:bg-slate-850 transition cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-bold text-white">Create marketing content</p>
          <p className="text-[11px] text-slate-400 mt-1">Blog, social, emails, keywords & more</p>
          <span className="text-[10px] text-emerald-400 font-bold mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Jump to creators <ChevronRight className="w-3 h-3" />
          </span>
        </button>
        {onExportCampaignBundle && (
          <button
            type="button"
            id="dashboard-export-bundle-btn"
            onClick={onExportCampaignBundle}
            disabled={!hasCachedAssets || isExportingBundle}
            className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-left hover:border-slate-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Package className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-sm font-bold text-white">Download everything</p>
            <p className="text-[11px] text-slate-400 mt-1">ZIP file with all your created content</p>
            <span className="text-[10px] text-amber-400 font-bold mt-2 inline-flex items-center gap-1">
              {isExportingBundle ? 'Packaging…' : hasCachedAssets ? 'Download ZIP' : 'Create content first'}
            </span>
          </button>
        )}
      </div>

      {/* Create content — primary action area */}
      <div ref={createSectionRef} className="space-y-4 scroll-mt-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Create marketing content
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            Pick one — AI writes it for you. You can edit everything after.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetPrototypes.map((asset) => {
            const isGenerating = generatingType === asset.id;
            return (
              <div
                key={asset.id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${asset.bg}`}>{asset.icon}</div>
                    <div>
                      <h4 className="text-base font-display font-extrabold text-white">{asset.simpleTitle}</h4>
                      <p className="text-sm text-slate-400">{asset.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{asset.desc}</p>
                </div>

                <button
                  id={`launcher-${asset.id}`}
                  onClick={() => onGenerateAsset(asset.id)}
                  disabled={!!generatingType}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center justify-between disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer active:scale-[0.98] transition"
                >
                  {isGenerating ? (
                    <>
                      <span>Writing…</span>
                      <div className="w-3.5 h-3.5 border-2 border-dashed border-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Create this</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible deep-dive sections */}
      <div className="space-y-3">
        <p className="text-sm text-slate-400 font-mono uppercase tracking-wider px-1">
          More details — tap to expand
        </p>

        <CollapsibleSection
          id="war-room-swot"
          title="What’s working & what to fix"
          subtitle="Your strengths, gaps, and opportunities — in plain English"
          icon={<Target className="w-5 h-5" />}
          defaultOpen
        >
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg mb-4">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Your pitch in one sentence</h4>
            <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{analysis.positioningText}&rdquo;</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3">What you do well</h4>
              <ul className="space-y-2">
                {strengthsList.map((item, idx) => (
                  <li key={idx} className="text-xs text-emerald-100 flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl">
              <h4 className="text-xs font-bold text-amber-400 uppercase mb-3">Things to improve</h4>
              <ul className="space-y-2">
                {weaknessesList.map((item, idx) => (
                  <li key={idx} className="text-xs text-amber-100 flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-xl">
              <h4 className="text-xs font-bold text-blue-400 uppercase mb-3">Chances to grow</h4>
              <ul className="space-y-2">
                {opportunitiesList.map((item, idx) => (
                  <li key={idx} className="text-xs text-blue-100 flex items-start gap-1.5">
                    <span className="text-blue-400 shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="war-room-channels"
          title="Where to find customers"
          subtitle="The best places to reach people and what to do on each"
          icon={<TrendingUp className="w-5 h-5" />}
        >
          <div className="space-y-4">
            {(analysis.recommendedChannels || []).map((ch, idx) => (
              <div key={idx} className="pb-3 last:pb-0 last:border-0 border-b border-slate-800">
                <div className="flex justify-between items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{ch.channel}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      ch.priority === 'High'
                        ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {ch.priority === 'High' ? 'Do this first' : 'Also try'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ch.strategy}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="war-room-audience"
          title="Who you’re talking to"
          subtitle="Your ideal customers — their problems and what convinces them"
          icon={<Users className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(analysis.targetAudience || []).map((seg, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Customer group {idx + 1}</span>
                  <h4 className="text-sm font-bold text-white mt-1">{seg.segmentName}</h4>
                  <p className="text-xs text-slate-400 italic mt-1">&ldquo;{seg.persona}&rdquo;</p>
                </div>
                <div>
                  <h5 className="text-[10px] text-slate-500 uppercase mb-1.5">Their problems</h5>
                  <ul className="space-y-1">
                    {(seg.painPoints || []).map((p, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-300 flex gap-1.5">
                        <span className="text-rose-400 shrink-0">✕</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-[10px] text-slate-500 uppercase mb-1.5">How to win them over</h5>
                  <ul className="space-y-1">
                    {(seg.leveragePoints || []).map((lev, lIdx) => (
                      <li key={lIdx} className="text-xs text-slate-300 flex gap-1.5">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        {lev}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="war-room-plan"
          title="Your 4-week action plan"
          subtitle="Week-by-week tasks so you know exactly what to do next"
          icon={<Calendar className="w-5 h-5" />}
        >
          {onNavigateToCalendar && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Open interactive calendar
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(analysis.thirtyDayActionPlan || []).map((plan, idx) => (
              <div
                key={idx}
                className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden"
              >
                <span className="absolute top-2 right-3 text-5xl font-black text-slate-800/30 select-none">
                  {idx + 1}
                </span>
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500">{plan.week}</span>
                  <h4 className="text-sm font-bold text-white">{plan.focus}</h4>
                  <ul className="space-y-1.5 mt-2">
                    {(plan.tasks || []).map((t, tIdx) => (
                      <li key={tIdx} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-slate-500 shrink-0">{tIdx + 1}.</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-emerald-400 pt-2 border-t border-slate-800 mt-2">
                    <span className="text-slate-500 block text-[9px] uppercase mb-0.5">Expected result</span>
                    {plan.expectedOutcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {(onExportCampaignBundle || onNavigateToHistory) && (
          <CollapsibleSection
            id="war-room-export"
            title="Save & share your work"
            subtitle="Download a ZIP or view your campaign history"
            icon={<Package className="w-5 h-5" />}
          >
            <div className="flex flex-wrap gap-2">
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="text-xs font-bold px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  View campaign history
                </button>
              )}
              {onExportCampaignBundle && (
                <button
                  type="button"
                  onClick={onExportCampaignBundle}
                  disabled={!hasCachedAssets || isExportingBundle}
                  className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  {isExportingBundle ? 'Packaging ZIP…' : 'Download campaign ZIP'}
                </button>
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Recent work */}
      {assetHistory && Object.keys(assetHistory).length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Your recent work
              </h3>
              <p className="text-xs text-slate-400">Stuff you already created — jump back in anytime</p>
            </div>
            {onNavigateToHistory && (
              <button
                type="button"
                onClick={onNavigateToHistory}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer shrink-0"
              >
                See all →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(assetHistory)
              .flatMap(([type, list]) => list.map((item) => ({ type: type as MarketingAssetType, ...item })))
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 3)
              .map((item, idx) => {
                const typeLabels: Record<MarketingAssetType, string> = {
                  seo_keywords: 'Keywords',
                  blog_post: 'Blog',
                  social_posts: 'Social',
                  email_sequence: 'Emails',
                  lead_magnet: 'Free download',
                };
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex justify-between text-[9px] text-slate-500 mb-2">
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-bold uppercase border border-slate-800">
                        {typeLabels[item.type]}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{item.asset.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.summary}</p>
                    {onNavigateToHistory && (
                      <button
                        type="button"
                        onClick={onNavigateToHistory}
                        className="w-full mt-3 py-1.5 text-[10px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 cursor-pointer"
                      >
                        Open in history
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
