/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MarketingAssetType } from '../types';

export const DASHBOARD_ONBOARDING_DISMISS_KEY = 'ai_cmo_dashboard_onboarding_dismissed';

export interface DashboardOnboardingSteps {
  reviewedBrand: boolean;
  ranSeoCheck: boolean;
  createdAsset: boolean;
}

export function isDashboardOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(DASHBOARD_ONBOARDING_DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissDashboardOnboarding(): void {
  localStorage.setItem(DASHBOARD_ONBOARDING_DISMISS_KEY, 'true');
}

export function hasCreatedMarketingAsset(
  assetHistory?: Partial<Record<MarketingAssetType, unknown[]>>,
  hasCachedAssets?: boolean,
): boolean {
  if (hasCachedAssets) return true;
  return Object.values(assetHistory ?? {}).some((entries) => (entries?.length ?? 0) > 0);
}

export function allOnboardingStepsComplete(steps: DashboardOnboardingSteps): boolean {
  return steps.reviewedBrand && steps.ranSeoCheck && steps.createdAsset;
}
