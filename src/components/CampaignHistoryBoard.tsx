/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Search, Filter, Clock, FileText, Sparkles, RotateCcw,
  ChevronRight, Layers,
} from 'lucide-react';
import { MarketingAssetType, GeneratedAsset } from '../types';
import { buildCampaignTimeline, getFriendlyAssetType } from '../utils/campaignTimeline';

interface CampaignHistoryBoardProps {
  onBackToDashboard: () => void;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number; tags?: string[] }[]>;
  onSelectAsset: (type: MarketingAssetType) => void;
  onExportBundle?: () => void;
  isExporting?: boolean;
}

const EVENT_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  generated: { dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Generated' },
  refined: { dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25', label: 'Refined' },
  reverted: { dot: 'bg-sky-500', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25', label: 'Reverted' },
  saved: { dot: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-300 border-slate-600', label: 'Saved' },
};

export default function CampaignHistoryBoard({
  onBackToDashboard,
  cachedAssets,
  assetHistory,
  onSelectAsset,
  onExportBundle,
  isExporting,
}: CampaignHistoryBoardProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const timeline = useMemo(
    () => buildCampaignTimeline(assetHistory, cachedAssets),
    [assetHistory, cachedAssets]
  );

  const filtered = useMemo(() => {
    return timeline.filter((e) => {
      if (filterType !== 'all' && e.assetType !== filterType) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        getFriendlyAssetType(e.assetType).toLowerCase().includes(q)
      );
    });
  }, [timeline, search, filterType]);

  const stats = useMemo(() => {
    const types = new Set(timeline.map((e) => e.assetType));
    const words = timeline.reduce((a, e) => a + e.wordCount, 0);
    return { events: timeline.length, assetTypes: types.size, words };
  }, [timeline]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in" id="campaign-history-board">
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
              <Layers className="w-5 h-5 text-amber-500" />
              Unified Campaign History
            </h2>
            <p className="text-sm text-slate-400 mt-0.5 font-sans">
              Timeline of every generated resource across your workspace.
            </p>
          </div>
        </div>
        {onExportBundle && (
          <button
            type="button"
            onClick={onExportBundle}
            disabled={isExporting || Object.keys(cachedAssets).length === 0}
            className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg cursor-pointer flex items-center gap-2"
          >
            {isExporting ? 'Packaging…' : '📁 Export campaign ZIP'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Timeline events', value: stats.events },
          { label: 'Asset types', value: stats.assetTypes },
          { label: 'Words tracked', value: stats.words.toLocaleString() },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-lg"
          >
            <span className="text-2xl font-black text-white block">{s.value}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, summaries, asset types…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All assets</option>
            {(['seo_keywords', 'blog_post', 'social_posts', 'email_sequence', 'lead_magnet'] as MarketingAssetType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {getFriendlyAssetType(t)}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No campaign events yet. Generate assets from the dashboard.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8">
          <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/60 via-amber-500/40 to-slate-800" />

          <div className="space-y-4">
            {filtered.map((event) => {
              const style = EVENT_STYLES[event.eventType] || EVENT_STYLES.refined;
              return (
                <article
                  key={event.id}
                  className="relative pl-6 sm:pl-8 group"
                >
                  <span
                    className={`absolute left-0 sm:left-0.5 top-5 w-3 h-3 rounded-full border-2 border-slate-950 ${style.dot} shadow-lg z-10`}
                  />

                  <div
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer hover:border-slate-600 ${
                      event.isActive
                        ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/35 shadow-emerald-900/20 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-850/80'
                    }`}
                    onClick={() => onSelectAsset(event.assetType)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectAsset(event.assetType)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{getFriendlyAssetType(event.assetType)}</span>
                        {event.isActive && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Active draft
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.timestamp}
                      </span>
                    </div>

                    <h3 className="text-sm font-display font-bold text-white group-hover:text-emerald-100 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-sans">{event.summary}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {event.wordCount} words
                      </span>
                      {event.toneIntensity != null && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Tone {event.toneIntensity}/10
                        </span>
                      )}
                      {event.tags?.map((tag) => (
                        <span key={tag} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                          {tag}
                        </span>
                      ))}
                      <span className="ml-auto flex items-center gap-1 text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Open workspace
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
        <RotateCcw className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          This board aggregates version history from all asset types. Per-asset diffs and archives remain in the
          workspace Version History panel.
        </p>
      </div>
    </div>
  );
}
