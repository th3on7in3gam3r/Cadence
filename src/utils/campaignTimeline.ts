/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CampaignTimelineEvent,
  MarketingAssetType,
  GeneratedAsset,
  AssetHistoryEntry,
} from '../types';

const TYPE_LABELS: Record<MarketingAssetType, string> = {
  seo_keywords: 'SEO Keywords',
  blog_post: 'Blog Post',
  social_posts: 'Social Bundle',
  email_sequence: 'Email Sequence',
  lead_magnet: 'Lead Magnet',
};

export function parseSortKey(timestamp: string, index: number): number {
  const parsed = Date.parse(timestamp);
  if (!Number.isNaN(parsed)) return parsed;
  return Date.now() - index * 60000;
}

export function buildCampaignTimeline(
  assetHistory: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>,
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>
): CampaignTimelineEvent[] {
  const events: CampaignTimelineEvent[] = [];

  for (const [type, entries] of Object.entries(assetHistory) as [MarketingAssetType, AssetHistoryEntry[]][]) {
    if (!entries?.length) continue;
    entries.forEach((entry, index) => {
      const content = entry.asset?.content || '';
      const words = content.split(/\s+/).filter(Boolean).length;
      const isLatest = index === entries.length - 1;
      const activeAsset = cachedAssets[type];
      const isActive =
        isLatest &&
        !!activeAsset &&
        activeAsset.content === entry.asset.content;

      let eventType: CampaignTimelineEvent['eventType'] = index === 0 ? 'generated' : 'refined';
      if (entry.summary?.toLowerCase().includes('revert')) eventType = 'reverted';

      events.push({
        id: `${type}-${index}-${entry.timestamp}`,
        assetType: type,
        eventType,
        timestamp: entry.timestamp,
        sortKey: parseSortKey(entry.createdDateStr || entry.timestamp, index),
        summary: entry.summary || `${TYPE_LABELS[type]} v${index + 1}`,
        title: entry.asset?.title || TYPE_LABELS[type],
        wordCount: words,
        toneIntensity: entry.toneIntensity,
        tags: entry.tags,
        isActive,
      });
    });
  }

  return events.sort((a, b) => b.sortKey - a.sortKey);
}

export function getFriendlyAssetType(type: MarketingAssetType): string {
  return TYPE_LABELS[type];
}
