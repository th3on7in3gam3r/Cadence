/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  History, Search, Filter, RefreshCw, Calendar,
  ArrowLeft, FileText, ChevronRight, BarChart3,
  FileDown, CheckCircle, Clock, ExternalLink,
} from 'lucide-react';
import { MarketingAssetType, GeneratedAsset } from '../types';
import { parseSortKey } from '../utils/campaignTimeline';

const MIN_SCANS_FOR_STATS = 2;
const SPARSE_HISTORY_THRESHOLD = 4;

type SortBy = 'newest' | 'oldest' | 'words' | 'tone' | 'type';
type DateRange = 'all' | '7d' | '30d';

interface ScannedHistoryItem {
  id: string;
  type: MarketingAssetType;
  timestamp: string;
  createdDateStr?: string;
  summary: string;
  asset: GeneratedAsset;
  toneIntensity?: number;
  wordCount: number;
  sortIndex: number;
}

interface HistoryScansProps {
  onBackToDashboard: () => void;
  onGoToCreate?: () => void;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Record<
    MarketingAssetType,
    {
      timestamp: string;
      summary: string;
      asset: GeneratedAsset;
      toneIntensity?: number;
      createdDateStr?: string;
    }[]
  >;
  onRevertAsset: (type: MarketingAssetType, asset: GeneratedAsset) => void;
  onSelectAssetView: (type: MarketingAssetType) => void;
}

function confirmRestoreDraft(title: string): boolean {
  return window.confirm(
    `Restore "${title}"? This will replace your current active draft for this content type.`,
  );
}

function matchesDateRange(createdDateStr: string | undefined, range: DateRange): boolean {
  if (range === 'all') return true;
  if (!createdDateStr) return true;
  const itemDate = new Date(createdDateStr);
  if (Number.isNaN(itemDate.getTime())) return true;
  const now = new Date();
  const days = range === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return itemDate >= cutoff;
}

export default function HistoryScans({
  onBackToDashboard,
  onGoToCreate,
  cachedAssets,
  assetHistory,
  onRevertAsset,
  onSelectAssetView,
}: HistoryScansProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [viewedAsset, setViewedAsset] = useState<ScannedHistoryItem | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const flattenedHistory = useMemo(() => {
    const list: ScannedHistoryItem[] = [];
    let sortIndex = 0;
    Object.entries(assetHistory).forEach(([cat, items]) => {
      items.forEach((item, index) => {
        const text = item.asset.content || '';
        const words = text.split(/\s+/).filter(Boolean).length;
        list.push({
          id: `${cat}-${index}-${item.timestamp}`,
          type: cat as MarketingAssetType,
          timestamp: item.timestamp,
          createdDateStr: item.createdDateStr,
          summary: item.summary,
          asset: item.asset,
          toneIntensity: item.toneIntensity || 75,
          wordCount: words,
          sortIndex: sortIndex++,
        });
      });
    });
    return list;
  }, [assetHistory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: flattenedHistory.length };
    flattenedHistory.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [flattenedHistory]);

  const filteredHistory = useMemo(() => {
    const filtered = flattenedHistory.filter((item) => {
      const matchCategory = selectedCategoryFilter === 'all' || item.type === selectedCategoryFilter;
      const lowerQuery = searchQuery.toLowerCase();
      const matchSearch =
        item.asset.title.toLowerCase().includes(lowerQuery) ||
        item.summary.toLowerCase().includes(lowerQuery) ||
        item.asset.content.toLowerCase().includes(lowerQuery);
      const matchDate = matchesDateRange(item.createdDateStr, dateRange);
      return matchCategory && matchSearch && matchDate;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (
            parseSortKey(a.createdDateStr || a.timestamp, a.sortIndex) -
            parseSortKey(b.createdDateStr || b.timestamp, b.sortIndex)
          );
        case 'words':
          return b.wordCount - a.wordCount;
        case 'tone':
          return (b.toneIntensity ?? 0) - (a.toneIntensity ?? 0);
        case 'type':
          return getFriendlyTypeName(a.type).localeCompare(getFriendlyTypeName(b.type));
        case 'newest':
        default:
          return (
            parseSortKey(b.createdDateStr || b.timestamp, b.sortIndex) -
            parseSortKey(a.createdDateStr || a.timestamp, a.sortIndex)
          );
      }
    });
    return sorted;
  }, [flattenedHistory, selectedCategoryFilter, searchQuery, sortBy, dateRange]);

  useEffect(() => {
    if (filteredHistory.length === 1) {
      setViewedAsset(filteredHistory[0]);
    }
  }, [filteredHistory]);

  const totalScans = flattenedHistory.length;
  const totalWordsGenerated = useMemo(() => {
    return flattenedHistory.reduce((acc, curr) => acc + curr.wordCount, 0);
  }, [flattenedHistory]);

  const handleCopyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRestore = (item: ScannedHistoryItem) => {
    if (!confirmRestoreDraft(item.asset.title)) return;
    onRevertAsset(item.type, item.asset);
    onSelectAssetView(item.type);
  };

  const categoryPresets = [
    { value: 'all', label: 'All Scans' },
    { value: 'seo_keywords', label: 'SEO/GEO Hub' },
    { value: 'blog_post', label: 'Blog Posts' },
    { value: 'social_posts', label: 'Social Copy' },
    { value: 'email_sequence', label: 'Email Sequence' },
    { value: 'lead_magnet', label: 'Lead Magnets' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="history-scans-view">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none border-b border-slate-800 pb-4">
        <div className="space-y-2">
          <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            CMO Campaign History & Document Scan Audit
          </h2>
          <p className="text-[11px] text-slate-400 font-sans">
            Compare previously compiled marketing copy, retrieve historical performance reviews, and restore optimal configurations
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 border border-slate-800 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SOC-2 Compliant Sandbox
          </span>
        </div>
        <button
          type="button"
          id="scans-back-to-dash-btn"
          onClick={onBackToDashboard}
          className="text-xs font-mono font-medium border border-slate-800 hover:border-slate-700 px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
        >
          ← Back to dashboard
        </button>
      </div>

      {totalScans >= MIN_SCANS_FOR_STATS ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md select-none">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Total Scans Performed</span>
            <span className="text-2xl font-display font-black text-white block">
              {totalScans} <span className="text-xs font-mono text-emerald-400 font-bold">Files</span>
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md select-none">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Calculated Word Volume</span>
            <span className="text-2xl font-display font-black text-white block">
              {totalWordsGenerated.toLocaleString()} <span className="text-xs font-mono text-amber-400 font-bold">Words</span>
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md select-none">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Active Campaigns</span>
            <span className="text-2xl font-display font-black text-emerald-400 block">
              {Object.keys(cachedAssets).length}{' '}
              <span className="text-xs font-mono text-slate-500 font-medium">/ 5 Departments</span>
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 font-sans bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
          {totalScans === 0
            ? 'No drafts saved yet — generate content from the dashboard to start your history.'
            : `${totalScans} draft saved — generate more from the dashboard to see volume stats.`}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md">
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter through past copies, keyword matches, or revisions summaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 pl-9 pr-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  Sort by
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="words">Word count</option>
                    <option value="tone">Tone intensity</option>
                    <option value="type">Content type</option>
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  Date
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] cursor-pointer"
                  >
                    <option value="all">All time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-400">Filter by type</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categoryPresets.map((preset) => {
                const count = categoryCounts[preset.value] || 0;
                const isSelected = selectedCategoryFilter === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(preset.value);
                      setViewedAsset(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-medium font-sans flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-white font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span
                      className={`text-[8px] font-mono px-1 rounded ${
                        isSelected ? 'bg-slate-950 text-amber-500 font-bold' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl select-none">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-display font-medium text-slate-300">No scanned historical drafts match your filters</h4>
                <p className="text-xs text-slate-500 mt-1">Try widening your keyphrase query, or generate new copy from the dashboard.</p>
              </div>
            ) : (
              <>
                {filteredHistory.map((item) => {
                  const isActiveViewInWorkspace = viewedAsset?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-900 rounded-xl border p-4 hover:border-slate-700 transition-all shadow-sm ${
                        isActiveViewInWorkspace ? 'ring-1 ring-amber-500 border-amber-500' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 select-none">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-slate-950 px-2.5 py-0.5 rounded text-white border border-slate-800 font-mono font-semibold uppercase">
                            {getFriendlyTypeName(item.type)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {item.createdDateStr || item.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <span>Intensity:</span>
                          <span className="text-amber-500 font-bold">{item.toneIntensity}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-display font-bold text-white capitalize leading-snug">{item.asset.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.summary}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800 select-none">
                        <span className="text-[9px] font-mono text-slate-500 block">Length: {item.wordCount} words</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id={`history-read-btn-${item.id}`}
                            onClick={() => setViewedAsset(item)}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] font-sans font-bold text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                          >
                            Read Draft Body
                          </button>
                          <button
                            type="button"
                            id={`history-restore-btn-${item.id}`}
                            onClick={() => handleRestore(item)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-800 text-[10px] font-sans font-bold rounded transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3 text-white" />
                            <span>Restore Draft</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredHistory.length > 0 && filteredHistory.length < SPARSE_HISTORY_THRESHOLD && onGoToCreate && (
                  <button
                    type="button"
                    onClick={onGoToCreate}
                    className="w-full p-5 border-2 border-dashed border-slate-700 rounded-xl text-left hover:border-emerald-500/40 hover:bg-slate-900/80 transition-colors cursor-pointer group"
                  >
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white flex items-center gap-2">
                      Create more content to build your history
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Open the content studio on your dashboard and generate another asset.</p>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl sticky top-20 min-h-[480px] flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4 select-none">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Inlined Scanner Inspector
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Preview a saved draft before restoring it to your workspace
              </p>
            </div>

            {viewedAsset ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg space-y-1 select-none">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Selected draft</span>
                  <div className="text-white font-bold text-xs truncate leading-snug">{viewedAsset.asset.title}</div>
                  <div className="text-[10px] text-slate-400">{getFriendlyTypeName(viewedAsset.type)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-300 uppercase select-none block">Objective / CMO Notes</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 italic font-medium leading-relaxed">
                    &ldquo;{viewedAsset.asset.summary}&rdquo;
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-300 uppercase select-none block">Draft Content</span>
                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewedAsset.asset.content}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-300 uppercase select-none block">Tagline or CTA</span>
                  <div className="bg-emerald-950/20 border border-emerald-500/25 p-2 rounded text-emerald-300 font-bold font-sans">
                    {viewedAsset.asset.taglineOrCTA}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 bg-slate-950/50 text-center select-none">
                <div className="hidden lg:flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Your drafts are over here
                </div>
                <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <span className="text-sm font-display font-bold text-slate-300 block">Select a draft to preview</span>
                <span className="text-xs text-slate-400 block mt-2 max-w-[220px] mx-auto leading-relaxed">
                  Click &ldquo;Read Draft Body&rdquo; on any card in the list to inspect it here.
                </span>
              </div>
            )}
          </div>

          {viewedAsset && (
            <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between gap-2 select-none">
              <span className="text-[9px] font-mono text-slate-500 block">Ready to restore</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(viewedAsset.asset.content, viewedAsset.id)}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === viewedAsset.id ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3 h-3 text-slate-400" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(viewedAsset)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <ExternalLink className="w-3 h-3 text-slate-950" />
                  <span>Restore Active</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getFriendlyTypeName(type: MarketingAssetType) {
  switch (type) {
    case 'seo_keywords':
      return 'SEO & GEO Keywords Hub';
    case 'blog_post':
      return 'SEO Authority Blog Draft';
    case 'social_posts':
      return 'Authority Social Bundle';
    case 'email_sequence':
      return '3-Stage Nurture Sequence';
    case 'lead_magnet':
      return 'Lead Magnet Blueprint';
    default:
      return type;
  }
}
