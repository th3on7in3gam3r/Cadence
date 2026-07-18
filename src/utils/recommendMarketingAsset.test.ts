/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { SeoScoreSnapshot, WebsiteAnalysis } from '../types';
import type { CampaignReadinessResult } from './campaignReadiness';
import { recommendMarketingAsset } from './recommendMarketingAsset';

const baseAnalysis: WebsiteAnalysis = {
  brandName: 'Test Co',
  tagline: 'Test tagline',
  inferredBrandVoice: 'Professional',
  colors: { primary: '#000', accent: '#fff', bgStyle: 'dark' },
  strategicSummary: 'A long enough strategic summary for scoring purposes in the test harness.',
  targetAudience: [{ segmentName: 'SMB', persona: 'Owner', painPoints: [], leveragePoints: [] }],
  strengths: ['Clear positioning'],
  weaknesses: [],
  opportunities: [],
  positioningText: 'We help small businesses grow with clear messaging and strong offers.',
  thirtyDayActionPlan: [{ week: 'Week 1', focus: 'Launch', tasks: ['Post on LinkedIn'], expectedOutcome: 'Reach' }],
  recommendedChannels: [{ channel: 'LinkedIn', priority: 'High', strategy: 'Post weekly' }],
};

const baseReadiness: CampaignReadinessResult = {
  score: 72,
  grade: 'B',
  headline: 'Good start',
  subscores: [
    { label: 'Audience clarity', value: 70 },
    { label: 'Channel fit', value: 70 },
    { label: 'Strategic depth', value: 70 },
    { label: 'Execution ready', value: 70 },
  ],
};

function readinessWith(
  overrides: Partial<Record<string, number>>,
): CampaignReadinessResult {
  return {
    ...baseReadiness,
    subscores: baseReadiness.subscores.map((s) => ({
      ...s,
      value: overrides[s.label] ?? s.value,
    })),
  };
}

function seoSnapshot(overallScore: number, keywordScore = overallScore): SeoScoreSnapshot {
  return {
    date: new Date().toISOString(),
    overallScore,
    technicalScore: overallScore,
    contentScore: overallScore,
    keywordScore,
  };
}

describe('recommendMarketingAsset', () => {
  it('recommends keyword list when SEO scores are low', () => {
    const result = recommendMarketingAsset(baseAnalysis, baseReadiness, [seoSnapshot(58, 50)]);
    expect(result?.type).toBe('seo_keywords');
    expect(result?.reason).toMatch(/SEO/i);
  });

  it('recommends blog post when strategic depth is the lowest subscore', () => {
    const readiness = readinessWith({
      'Audience clarity': 85,
      'Channel fit': 80,
      'Strategic depth': 45,
      'Execution ready': 78,
    });
    const result = recommendMarketingAsset(
      { ...baseAnalysis, inferredGrowthGoal: 'Brand awareness' },
      readiness,
      [seoSnapshot(88, 90)],
    );
    expect(result?.type).toBe('blog_post');
  });

  it('recommends social posts when channel fit is lowest and social channel is high priority', () => {
    const readiness = readinessWith({
      'Audience clarity': 85,
      'Channel fit': 40,
      'Strategic depth': 75,
      'Execution ready': 78,
    });
    const result = recommendMarketingAsset(
      {
        ...baseAnalysis,
        recommendedChannels: [{ channel: 'LinkedIn', priority: 'High', strategy: 'Daily posts' }],
      },
      readiness,
      [seoSnapshot(88, 90)],
    );
    expect(result?.type).toBe('social_posts');
  });

  it('recommends lead magnet when audience clarity is lowest', () => {
    const readiness = readinessWith({
      'Audience clarity': 42,
      'Channel fit': 80,
      'Strategic depth': 75,
      'Execution ready': 78,
    });
    const result = recommendMarketingAsset(baseAnalysis, readiness, [seoSnapshot(88, 90)]);
    expect(result?.type).toBe('lead_magnet');
  });

  it('returns null when no signals produce a score', () => {
    const emptyAnalysis: WebsiteAnalysis = {
      ...baseAnalysis,
      inferredGrowthGoal: undefined,
      recommendedChannels: [],
      weaknesses: [],
      opportunities: [],
      thirtyDayActionPlan: [],
    };
    const flatReadiness: CampaignReadinessResult = {
      score: 70,
      grade: 'B',
      headline: 'Ok',
      subscores: [
        { label: 'Audience clarity', value: 70 },
        { label: 'Channel fit', value: 70 },
        { label: 'Strategic depth', value: 70 },
        { label: 'Execution ready', value: 70 },
      ],
    };
    const result = recommendMarketingAsset(emptyAnalysis, flatReadiness, []);
    expect(result).toBeNull();
  });

  it('tie-breaks toward SEO keywords when SEO history is weak', () => {
    const readiness = readinessWith({
      'Audience clarity': 50,
      'Channel fit': 50,
      'Strategic depth': 50,
      'Execution ready': 50,
    });
    const result = recommendMarketingAsset(baseAnalysis, readiness, [seoSnapshot(60, 55)]);
    expect(result?.type).toBe('seo_keywords');
  });
});
