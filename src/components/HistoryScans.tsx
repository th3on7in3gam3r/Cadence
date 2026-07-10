/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  History, Search, Filter, RefreshCw, Calendar, 
  ArrowLeft, FileText, ChevronRight, BarChart3, 
  Trash2, FileDown, CheckCircle, Clock, ExternalLink 
} from 'lucide-react';
import { MarketingAssetType, GeneratedAsset } from '../types';

interface ScannedHistoryItem {
  id: string;
  type: MarketingAssetType;
  timestamp: string;
  summary: string;
  asset: GeneratedAsset;
  toneIntensity?: number;
  wordCount: number;
}

interface HistoryScansProps {
  onBackToDashboard: () => void;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number }[]>;
  onRevertAsset: (type: MarketingAssetType, asset: GeneratedAsset) => void;
  onSelectAssetView: (type: MarketingAssetType) => void;
}

export default function HistoryScans({ 
  onBackToDashboard, 
  cachedAssets, 
  assetHistory,
  onRevertAsset,
  onSelectAssetView
}: HistoryScansProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewedAsset, setViewedAsset] = useState<ScannedHistoryItem | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Flatten and parse complete history collection
  const flattenedHistory = useMemo(() => {
    const list: ScannedHistoryItem[] = [];
    Object.entries(assetHistory).forEach(([cat, items]) => {
      items.forEach((item, index) => {
        const text = item.asset.content || '';
        const words = text.split(/\s+/).filter(Boolean).length;
        list.push({
          id: `${cat}-${index}-${item.timestamp}`,
          type: cat as MarketingAssetType,
          timestamp: item.timestamp,
          summary: item.summary,
          asset: item.asset,
          toneIntensity: item.toneIntensity || 75,
          wordCount: words
        });
      });
    });
    // Sort chronologically (most recent on top assuming last in list is latest, or by timestamp formatting structure)
    return list.reverse();
  }, [assetHistory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: flattenedHistory.length };
    flattenedHistory.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [flattenedHistory]);

  const filteredHistory = useMemo(() => {
    return flattenedHistory.filter(item => {
      const matchCategory = selectedCategoryFilter === 'all' || item.type === selectedCategoryFilter;
      const lowerQuery = searchQuery.toLowerCase();
      const matchSearch = 
        item.asset.title.toLowerCase().includes(lowerQuery) ||
        item.summary.toLowerCase().includes(lowerQuery) ||
        item.asset.content.toLowerCase().includes(lowerQuery);
      return matchCategory && matchSearch;
    });
  }, [flattenedHistory, selectedCategoryFilter, searchQuery]);

  // Aggregate stats calculate
  const totalScans = flattenedHistory.length;
  const totalWordsGenerated = useMemo(() => {
    return flattenedHistory.reduce((acc, curr) => acc + curr.wordCount, 0);
  }, [flattenedHistory]);

  const handleCopyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getFriendlyTypeName = (type: MarketingAssetType) => {
    switch (type) {
      case 'seo_keywords': return 'SEO & GEO Keywords Hub';
      case 'blog_post': return 'SEO Authority Blog Draft';
      case 'social_posts': return 'Authority Social Bundle';
      case 'email_sequence': return '3-Stage Nurture Sequence';
      case 'lead_magnet': return 'Lead Magnet Blueprint';
      default: return type;
    }
  };

  const categoryPresets = [
    { value: 'all', label: 'All Scans' },
    { value: 'seo_keywords', label: 'SEO/GEO Hub' },
    { value: 'blog_post', label: 'Blog Posts' },
    { value: 'social_posts', label: 'Social Copy' },
    { value: 'email_sequence', label: 'Email Sequence' },
    { value: 'lead_magnet', label: 'Lead Magnets' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="history-scans-view">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            CMO Campaign History & Document Scan Audit
          </h2>
          <p className="text-[11px] text-slate-400 font-sans">Compare previously compiled marketing copy, retrieve historical performance reviews, and restore optimal configurations</p>
        </div>
        <button
          type="button"
          id="scans-back-to-dash-btn"
          onClick={onBackToDashboard}
          className="text-xs font-mono font-medium border border-slate-800 hover:border-slate-705 px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-1 shadow-md select-none">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase block">Total Scans Performed</span>
          <span className="text-2xl font-display font-black text-white block">
            {totalScans} <span className="text-xs font-mono text-emerald-400 font-bold">Files</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-1 shadow-md select-none">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase block">Calculated Word Volume</span>
          <span className="text-2xl font-display font-black text-white block">
            {totalWordsGenerated.toLocaleString()} <span className="text-xs font-mono text-amber-400 font-bold">Words</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-1 shadow-md select-none">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase block">Active Campaigns</span>
          <span className="text-2xl font-display font-black text-emerald-450 block">
            {Object.keys(cachedAssets).length} <span className="text-xs font-mono text-slate-450 font-medium">/ 5 Departments</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-1 shadow-md select-none">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase block">Auditing Standard</span>
          <span className="text-xs font-mono text-white pt-1 block leading-tight flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SOC-2 Compliant Sandbox
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Search & History List (2 cols on desk or full) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md">
            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
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
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-mono text-slate-400">Pivoting scans repository</span>
              </div>
            </div>

            {/* Pivot list filters */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {categoryPresets.map((preset) => {
                const count = categoryCounts[preset.value] || 0;
                const isSelected = selectedCategoryFilter === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(preset.value);
                      setViewedAsset(null); // Clear active inline view
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-medium font-sans flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-white font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-350 hover:text-white font-semibold'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={`text-[8px] font-mono px-1 rounded ${isSelected ? 'bg-slate-950 text-amber-500 font-bold' : 'bg-slate-850 text-slate-450'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table list/ Cards represent scan results */}
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-2xl select-none">
                <Clock className="w-8 h-8 text-slate-650 mx-auto mb-3" />
                <h4 className="text-sm font-display font-medium text-slate-300">No scanned historical drafts match your filters</h4>
                <p className="text-xs text-slate-500 mt-1">Try widening your keyphrase query, or generate new copy from the dashboard.</p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isActiveViewInWorkspace = viewedAsset?.id === item.id;
                return (
                  <div 
                    key={item.id}
                    className={`bg-slate-900 rounded-xl border p-4 hover:border-slate-700 transition-all shadow-sm ${
                      isActiveViewInWorkspace ? 'ring-1 ring-amber-500 border-amber-500' : 'border-slate-850'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 select-none">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-slate-950 px-2.5 py-0.5 rounded text-white border border-slate-850 font-mono font-semibold uppercase">
                          {getFriendlyTypeName(item.type)}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {item.timestamp}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-450">
                        <span>Intensity:</span>
                        <span className="text-amber-500 font-bold">{item.toneIntensity}%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-display font-bold text-white capitalize leading-snug">{item.asset.title}</h4>
                      <p className="text-xs text-slate-350 leading-relaxed font-sans">{item.summary}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-850 select-none">
                      <span className="text-[9px] font-mono text-slate-550 block">Length: {item.wordCount} words</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id={`history-read-btn-${item.id}`}
                          onClick={() => setViewedAsset(item)}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] font-sans font-bold hover:text-white rounded transition-colors cursor-pointer"
                        >
                          Read Draft Body
                        </button>

                        <button
                          type="button"
                          id={`history-restore-btn-${item.id}`}
                          onClick={() => {
                            onRevertAsset(item.type, item.asset);
                            onSelectAssetView(item.type);
                          }}
                          className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-600 text-white border border-emerald-800 text-[10px] font-sans font-bold rounded transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-white" />
                          <span>Restore Draft</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed preview and inspections panel */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-xl sticky top-20 min-h-[480px] flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4 select-none">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Inlined Scanner Inspector
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Read historical draft assets in real time without reloading active workspace settings</p>
            </div>

            {viewedAsset ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-1 select-none">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Selected historical node</span>
                  <div className="text-white font-bold text-xs truncate leading-snug">{viewedAsset.asset.title}</div>
                  <div className="text-[10px] text-slate-400">{getFriendlyTypeName(viewedAsset.type)}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-100 uppercase select-none block">Objective / CMO Notes</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-slate-350 italic font-medium leading-relaxed leading-normal">
                    "{viewedAsset.asset.summary}"
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-105 uppercase select-none block">Draft Content Sandbox</span>
                  <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-205 leading-relaxed whitespace-pre-wrap">
                    {viewedAsset.asset.content}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-105 uppercase select-none block">Tagline or CTA Trigger</span>
                  <div className="bg-emerald-950/20 border border-emerald-500/25 p-2 rounded text-emerald-300 font-bold font-sans">
                    {viewedAsset.asset.taglineOrCTA}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 select-none">
                <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <span className="text-[11px] font-medium text-slate-405 block">No live audit node focused</span>
                <span className="text-[10px] text-slate-550 block mt-0.5">Press "Read Draft Body" in any log card to scan item details immediately.</span>
              </div>
            )}
          </div>

          {viewedAsset && (
            <div className="border-t border-slate-850 pt-3 mt-4 flex items-center justify-between gap-2 select-none">
              <span className="text-[9px] font-mono text-slate-550 block">Ready to restore</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(viewedAsset.asset.content, viewedAsset.id)}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white rounded flex items-center gap-1 cursor-pointer"
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
                  onClick={() => {
                    onRevertAsset(viewedAsset.type, viewedAsset.asset);
                    onSelectAssetView(viewedAsset.type);
                  }}
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
