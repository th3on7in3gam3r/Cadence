/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Public product brand (2026 rebrand from AI CMO).
 * Internal IDs remain `ai_cmo` in APIs, bundles, and storage.
 */

export const PRODUCT_NAME = 'Cadence';

export const PRODUCT_TAGLINE = 'Marketing command center';

export const PRODUCT_SUBTITLE = 'Strategy, SEO & content — on cadence';

export const STUDIO_PARENT = 'Bible Funland Studio';

export const PRODUCTION_ORIGIN = 'https://growth.biblefunland.com';

export function productPublicOrigin(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
    return String(import.meta.env.VITE_APP_URL).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return PRODUCTION_ORIGIN;
}

/** When false (default), hide studio bundles, product switcher, and cross-app upsells. */
export function showGrowthStackUi(): boolean {
  return import.meta.env.VITE_SHOW_GROWTH_STACK === 'true';
}
