/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebsiteAnalysis } from '../types';

export interface CampaignReadinessResult {
  score: number;
  grade: string;
  headline: string;
  subscores: { label: string; value: number }[];
}

export function computeCampaignReadiness(analysis: WebsiteAnalysis): CampaignReadinessResult {
  const strengths = analysis.strengths?.length ?? 0;
  const weaknesses = analysis.weaknesses?.length ?? 0;
  const opportunities = analysis.opportunities?.length ?? 0;
  const audiences = analysis.targetAudience?.length ?? 0;
  const channels = analysis.recommendedChannels?.length ?? 0;
  const highPriorityChannels =
    analysis.recommendedChannels?.filter((c) => c.priority?.toLowerCase() === 'high').length ?? 0;
  const planWeeks = analysis.thirtyDayActionPlan?.length ?? 0;
  const hasPositioning = (analysis.positioningText?.trim().length ?? 0) > 40;
  const hasSummary = (analysis.strategicSummary?.trim().length ?? 0) > 80;

  const audienceClarity = Math.min(100, 45 + audiences * 18);
  const channelFit = Math.min(100, 40 + channels * 12 + highPriorityChannels * 8);
  const strategicDepth = Math.min(
    100,
    35 + strengths * 8 - weaknesses * 5 + opportunities * 6 + (hasPositioning ? 12 : 0) + (hasSummary ? 10 : 0)
  );
  const executionReady = Math.min(100, 30 + planWeeks * 15 + highPriorityChannels * 5);

  const score = Math.round(
    Math.min(98, Math.max(38, (audienceClarity + channelFit + strategicDepth + executionReady) / 4))
  );

  const grade =
    score >= 92
      ? 'A'
      : score >= 85
        ? 'A-'
        : score >= 78
          ? 'B+'
          : score >= 72
            ? 'B'
            : score >= 65
              ? 'B-'
              : score >= 58
                ? 'C+'
                : score >= 50
                  ? 'C'
                  : 'C-';

  const headline =
    score >= 85
      ? 'You’re in great shape — keep going!'
      : score >= 72
        ? 'Good start — a few tweaks will help'
        : score >= 58
          ? 'Decent base — focus on the gaps below'
          : 'Let’s build the basics first';

  return {
    score,
    grade,
    headline,
    subscores: [
      { label: 'Audience clarity', value: audienceClarity },
      { label: 'Channel fit', value: channelFit },
      { label: 'Strategic depth', value: strategicDepth },
      { label: 'Execution ready', value: executionReady },
    ],
  };
}

export function gradeAccentClass(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-teal-400';
  return 'text-amber-400';
}

export function gradeRingColor(score: number): string {
  if (score >= 85) return '#34d399';
  if (score >= 72) return '#2dd4bf';
  if (score >= 58) return '#fbbf24';
  return '#fb7185';
}
