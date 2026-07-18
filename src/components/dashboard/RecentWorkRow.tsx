/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BookOpen, Chrome, Clock, FileText, Mail, Plus, Search } from 'lucide-react';
import type { MarketingAssetType } from '../../types';
import type { AssetRecommendation } from '../../utils/recommendMarketingAsset';

const SLOT_COUNT = 4;

const TYPE_LABELS: Record<MarketingAssetType, string> = {
  seo_keywords: 'Keywords',
  blog_post: 'Blog',
  social_posts: 'Social',
  email_sequence: 'Emails',
  lead_magnet: 'Free download',
};

const CREATE_SUGGESTIONS: {
  type: MarketingAssetType;
  simpleTitle: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'seo_keywords',
    simpleTitle: 'keyword list',
    desc: 'Words people search for so Google and AI can find you.',
    icon: <Search className="w-4 h-4 text-slate-500" />,
  },
  {
    type: 'blog_post',
    simpleTitle: 'blog post',
    desc: 'A full article that helps you show up in search results.',
    icon: <FileText className="w-4 h-4 text-slate-500" />,
  },
  {
    type: 'social_posts',
    simpleTitle: 'social posts',
    desc: 'Ready-to-post content for LinkedIn, X, and more.',
    icon: <Chrome className="w-4 h-4 text-slate-500" />,
  },
  {
    type: 'email_sequence',
    simpleTitle: 'email series',
    desc: 'Welcome emails that nurture new subscribers.',
    icon: <Mail className="w-4 h-4 text-slate-500" />,
  },
  {
    type: 'lead_magnet',
    simpleTitle: 'lead magnet',
    desc: 'A free guide or checklist to grow your email list.',
    icon: <BookOpen className="w-4 h-4 text-slate-500" />,
  },
];

interface HistoryEntry {
  type: MarketingAssetType;
  timestamp: string;
  summary: string;
  asset: { title: string };
}

interface RecentWorkRowProps {
  assetHistory?: Partial<
    Record<MarketingAssetType, { timestamp: string; summary: string; asset: { title: string } }[]>
  >;
  recommendation?: AssetRecommendation | null;
  onGenerateAsset: (type: MarketingAssetType) => void;
  onNavigateToHistory?: () => void;
}

function typesWithHistory(
  assetHistory?: RecentWorkRowProps['assetHistory'],
): Set<MarketingAssetType> {
  const types = new Set<MarketingAssetType>();
  if (!assetHistory) return types;
  for (const type of Object.keys(assetHistory) as MarketingAssetType[]) {
    if ((assetHistory[type]?.length ?? 0) > 0) types.add(type);
  }
  return types;
}

function placeholderTypes(
  count: number,
  assetHistory: RecentWorkRowProps['assetHistory'],
  recommendation?: AssetRecommendation | null,
): MarketingAssetType[] {
  const existing = typesWithHistory(assetHistory);
  const order: MarketingAssetType[] = [];
  if (recommendation?.type && !existing.has(recommendation.type)) {
    order.push(recommendation.type);
  }
  for (const s of CREATE_SUGGESTIONS) {
    if (!existing.has(s.type) && !order.includes(s.type)) {
      order.push(s.type);
    }
  }
  return order.slice(0, count);
}

export default function RecentWorkRow({
  assetHistory,
  recommendation,
  onGenerateAsset,
  onNavigateToHistory,
}: RecentWorkRowProps) {
  const recentItems = useMemo((): HistoryEntry[] => {
    if (!assetHistory) return [];
    return Object.entries(assetHistory)
      .flatMap(([type, list]) =>
        (list || []).map((item) => ({ type: type as MarketingAssetType, ...item })),
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, SLOT_COUNT);
  }, [assetHistory]);

  const placeholderCount = Math.max(0, SLOT_COUNT - recentItems.length);
  const placeholders = placeholderTypes(placeholderCount, assetHistory, recommendation);

  return (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recentItems.map((item, idx) => (
          <div key={`${item.type}-${item.timestamp}-${idx}`} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
            <div className="flex justify-between text-[9px] text-slate-500 mb-2 gap-2">
              <span className="bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-bold uppercase border border-slate-800 shrink-0">
                {TYPE_LABELS[item.type]}
              </span>
              <span className="truncate">{item.timestamp}</span>
            </div>
            <h4 className="text-xs font-bold text-white truncate">{item.asset.title}</h4>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 flex-1">{item.summary}</p>
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
        ))}

        {placeholders.map((type) => {
          const suggestion = CREATE_SUGGESTIONS.find((s) => s.type === type);
          if (!suggestion) return null;
          const isRecommended = recommendation?.type === type;
          return (
            <button
              key={`placeholder-${type}`}
              type="button"
              onClick={() => onGenerateAsset(type)}
              className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-4 text-left hover:border-emerald-500/40 hover:bg-slate-900 transition cursor-pointer flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">{suggestion.icon}</div>
                {isRecommended && (
                  <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                    Recommended
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-300 capitalize">Create a {suggestion.simpleTitle}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 flex-1">{suggestion.desc}</p>
              <span className="w-full mt-3 py-1.5 text-[10px] text-emerald-400 font-bold bg-slate-950 rounded border border-slate-800 inline-flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" />
                Create this
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
