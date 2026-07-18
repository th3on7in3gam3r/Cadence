/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MarketingAssetType, SeoScoreSnapshot, WebsiteAnalysis } from '../types';
import type { CampaignReadinessResult } from './campaignReadiness';

export interface AssetRecommendation {
  type: MarketingAssetType;
  reason: string;
}

const SEO_TEXT = /seo|search|keyword/i;
const SOCIAL_TEXT = /social|linkedin|twitter|\bx\b/i;
const CONVERSION_GOAL = /conversion|e-?commerce|sales/i;
const SEO_GOAL = /seo|traffic|search/i;

const REASONS: Record<MarketingAssetType, string> = {
  seo_keywords: 'Your SEO scores suggest starting with a keyword plan',
  blog_post: 'Strengthen your messaging with a blog article',
  social_posts: 'Your channel plan points to social content next',
  email_sequence: 'Turn your plan into an email nurture series',
  lead_magnet: 'Clarify your audience with a lead magnet offer',
};

function scoreMap(): Record<MarketingAssetType, number> {
  return {
    seo_keywords: 0,
    blog_post: 0,
    social_posts: 0,
    email_sequence: 0,
    lead_magnet: 0,
  };
}

function addScore(
  scores: Record<MarketingAssetType, number>,
  type: MarketingAssetType,
  points: number,
): void {
  scores[type] += points;
}

function combinedText(analysis: WebsiteAnalysis): string {
  return [...(analysis.weaknesses || []), ...(analysis.opportunities || [])].join(' ');
}

function hasSocialChannel(analysis: WebsiteAnalysis): boolean {
  return (analysis.recommendedChannels || []).some((ch) => SOCIAL_TEXT.test(ch.channel));
}

function hasHighPrioritySocialChannel(analysis: WebsiteAnalysis): boolean {
  return (analysis.recommendedChannels || []).some(
    (ch) => ch.priority?.toLowerCase() === 'high' && SOCIAL_TEXT.test(ch.channel),
  );
}

function lowestSubscoreLabel(readiness: CampaignReadinessResult): string | null {
  if (!readiness.subscores.length) return null;
  const values = readiness.subscores.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return null;

  const sorted = [...readiness.subscores].sort((a, b) => a.value - b.value);
  return sorted[0]?.label ?? null;
}

function pickWinner(
  scores: Record<MarketingAssetType, number>,
  seoHistory?: SeoScoreSnapshot[],
): MarketingAssetType | null {
  const entries = Object.entries(scores) as [MarketingAssetType, number][];
  const max = Math.max(...entries.map(([, v]) => v));
  if (max <= 0) return null;

  const winners = entries.filter(([, v]) => v === max).map(([type]) => type);
  if (winners.length === 1) return winners[0];

  const latest = seoHistory?.[seoHistory.length - 1];
  const seoWeak =
    latest != null && (latest.overallScore < 72 || latest.keywordScore < 65);
  if (seoWeak && winners.includes('seo_keywords')) return 'seo_keywords';

  const order: MarketingAssetType[] = [
    'seo_keywords',
    'blog_post',
    'social_posts',
    'email_sequence',
    'lead_magnet',
  ];
  return order.find((type) => winners.includes(type)) ?? winners[0];
}

export function recommendMarketingAsset(
  analysis: WebsiteAnalysis,
  readiness: CampaignReadinessResult,
  seoHistory?: SeoScoreSnapshot[],
): AssetRecommendation | null {
  const scores = scoreMap();
  const latestSeo = seoHistory?.[seoHistory.length - 1];

  if (latestSeo && (latestSeo.overallScore < 72 || latestSeo.keywordScore < 65)) {
    addScore(scores, 'seo_keywords', 3);
  }

  const goal = analysis.inferredGrowthGoal || '';
  if (SEO_GOAL.test(goal)) {
    addScore(scores, 'seo_keywords', 2);
  }
  if (CONVERSION_GOAL.test(goal)) {
    addScore(scores, 'lead_magnet', 1);
  }

  if (SEO_TEXT.test(combinedText(analysis))) {
    addScore(scores, 'seo_keywords', 1);
  }

  const lowest = lowestSubscoreLabel(readiness);
  if (lowest === 'Audience clarity') {
    addScore(scores, 'lead_magnet', 2);
  } else if (lowest === 'Strategic depth') {
    addScore(scores, 'blog_post', 2);
  } else if (lowest === 'Execution ready') {
    addScore(scores, 'email_sequence', 2);
  } else if (lowest === 'Channel fit') {
    if (hasSocialChannel(analysis)) {
      addScore(scores, 'social_posts', 2);
    } else {
      addScore(scores, 'email_sequence', 2);
    }
  }

  if (hasHighPrioritySocialChannel(analysis)) {
    addScore(scores, 'social_posts', 1);
  }

  const type = pickWinner(scores, seoHistory);
  if (!type) return null;

  return { type, reason: REASONS[type] };
}
