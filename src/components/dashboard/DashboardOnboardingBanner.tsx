/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Check, Sparkles, X } from 'lucide-react';
import type { MarketingAssetType } from '../../types';
import { hasSeoActivity } from '../../utils/campaignRuns';
import {
  allOnboardingStepsComplete,
  dismissDashboardOnboarding,
  hasCreatedMarketingAsset,
  isDashboardOnboardingDismissed,
  type DashboardOnboardingSteps,
} from '../../utils/dashboardOnboarding';

interface DashboardOnboardingBannerProps {
  assetHistory?: Partial<
    Record<MarketingAssetType, { timestamp: string; summary: string; asset: unknown }[]>
  >;
  hasCachedAssets?: boolean;
  onNavigateToSeoAgent?: () => void;
  onOpenHelp?: (section: 'overview' | 'start' | 'post' | 'map') => void;
  onScrollToCreate: () => void;
}

function StepItem({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={`flex items-start gap-2 text-xs leading-relaxed ${done ? 'text-slate-500' : 'text-slate-300'}`}>
      <span
        className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full border ${
          done ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400' : 'border-slate-700 text-transparent'
        }`}
        aria-hidden
      >
        {done && <Check className="w-2.5 h-2.5" />}
      </span>
      <span className={done ? 'line-through decoration-slate-600' : undefined}>{children}</span>
    </li>
  );
}

export default function DashboardOnboardingBanner({
  assetHistory,
  hasCachedAssets,
  onNavigateToSeoAgent,
  onOpenHelp,
  onScrollToCreate,
}: DashboardOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(() => isDashboardOnboardingDismissed());

  const steps: DashboardOnboardingSteps = {
    reviewedBrand: true,
    ranSeoCheck: hasSeoActivity(),
    createdAsset: hasCreatedMarketingAsset(assetHistory, hasCachedAssets),
  };

  const allComplete = allOnboardingStepsComplete(steps);

  if (dismissed || allComplete) return null;

  const completedCount = [steps.reviewedBrand, steps.ranSeoCheck, steps.createdAsset].filter(Boolean).length;

  return (
    <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-xl">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-display font-bold text-white">New here? Start in 3 steps</h3>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {completedCount}/3 done
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenHelp && (
                <button
                  type="button"
                  onClick={() => onOpenHelp('post')}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  How to post a blog
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  dismissDashboardOnboarding();
                  setDismissed(true);
                }}
                className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer rounded"
                aria-label="Dismiss getting started guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ol className="mt-3 space-y-2 list-none">
            <StepItem done={steps.reviewedBrand}>
              Read your brand summary and score below — that&apos;s your starting point.
            </StepItem>
            <StepItem done={steps.ranSeoCheck}>
              {onNavigateToSeoAgent ? (
                <>
                  Open{' '}
                  <button
                    type="button"
                    onClick={onNavigateToSeoAgent}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    SEO Agent
                  </button>{' '}
                  to check your website for search issues.
                </>
              ) : (
                'Run an SEO check on your website.'
              )}
            </StepItem>
            <StepItem done={steps.createdAsset}>
              <button
                type="button"
                onClick={onScrollToCreate}
                className="text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Create your first marketing piece
              </button>{' '}
              (keywords, blog, social, email, or free download).
            </StepItem>
          </ol>
        </div>
      </div>
    </div>
  );
}
