/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Factual metrics derived from draft content only — no projected analytics.
 */

import type { GeneratedAsset, MarketingAssetType } from '../types';

export interface AssetContentMetricRow {
  label: string;
  value: string;
}

export interface AssetContentMetrics {
  headline: string;
  headlineValue: string;
  completenessScore: number;
  details: AssetContentMetricRow[];
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function countKeywordLines(content: string): number {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#')).length;
}

/** 0–100 based on whether required fields exist — not performance forecasting. */
export function contentCompletenessScore(
  assetType: MarketingAssetType,
  content: string,
  asset: Pick<GeneratedAsset, 'title' | 'summary' | 'taglineOrCTA'>,
): number {
  let score = 0;
  if (asset.title?.trim()) score += 20;
  if (asset.summary?.trim()) score += 20;
  if (asset.taglineOrCTA?.trim()) score += 15;
  const words = wordCount(content);
  const minWords: Record<MarketingAssetType, number> = {
    seo_keywords: 40,
    blog_post: 300,
    social_posts: 80,
    email_sequence: 120,
    lead_magnet: 200,
  };
  if (words >= minWords[assetType]) score += 30;
  else if (words > 0) score += Math.round((words / minWords[assetType]) * 30);
  if (content.trim()) score += 15;
  return Math.min(100, score);
}

export function getAssetContentMetrics(
  assetType: MarketingAssetType,
  content: string,
  asset: Pick<GeneratedAsset, 'title' | 'summary' | 'taglineOrCTA'>,
): AssetContentMetrics {
  const words = wordCount(content);
  const chars = content.length;
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const readMinutes = Math.max(1, Math.round(words / 220));
  const completeness = contentCompletenessScore(assetType, content, asset);

  const baseDetails: AssetContentMetricRow[] = [
    { label: 'Word count', value: words.toLocaleString() },
    { label: 'Characters', value: chars.toLocaleString() },
    { label: 'Paragraphs', value: String(paragraphs) },
  ];

  switch (assetType) {
    case 'seo_keywords':
      return {
        headline: 'Keyword lines',
        headlineValue: String(countKeywordLines(content)),
        completenessScore: completeness,
        details: [
          ...baseDetails,
          { label: 'Has title', value: asset.title?.trim() ? 'Yes' : 'No' },
          { label: 'Has CTA', value: asset.taglineOrCTA?.trim() ? 'Yes' : 'No' },
        ],
      };
    case 'blog_post':
      return {
        headline: 'Est. read time',
        headlineValue: `${readMinutes} min`,
        completenessScore: completeness,
        details: [
          ...baseDetails,
          { label: 'Has meta summary', value: asset.summary?.trim() ? 'Yes' : 'No' },
        ],
      };
    case 'social_posts':
      return {
        headline: 'Word count',
        headlineValue: words.toLocaleString(),
        completenessScore: completeness,
        details: [
          ...baseDetails,
          { label: 'Has hook / CTA', value: asset.taglineOrCTA?.trim() ? 'Yes' : 'No' },
        ],
      };
    case 'email_sequence':
      return {
        headline: 'Emails detected',
        headlineValue: String(
          Math.max(1, (content.match(/email\s*\d/gi) || []).length || (content.trim() ? 1 : 0)),
        ),
        completenessScore: completeness,
        details: [
          ...baseDetails,
          { label: 'Est. read time (full sequence)', value: `${readMinutes} min` },
        ],
      };
    case 'lead_magnet':
      return {
        headline: 'Word count',
        headlineValue: words.toLocaleString(),
        completenessScore: completeness,
        details: [
          ...baseDetails,
          { label: 'Has offer CTA', value: asset.taglineOrCTA?.trim() ? 'Yes' : 'No' },
        ],
      };
    default:
      return {
        headline: 'Word count',
        headlineValue: words.toLocaleString(),
        completenessScore: completeness,
        details: baseDetails,
      };
  }
}
