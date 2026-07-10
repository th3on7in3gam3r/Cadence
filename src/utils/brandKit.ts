/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrandKit } from '../types';

const KEY = 'ai_cmo_brand_kit';

export const defaultBrandKit: BrandKit = {
  voiceRules: '',
  bannedPhrases: [],
  boilerplateCta: '',
  legalFooter: '',
  logoColors: { primary: '#10b981', accent: '#6366f1' },
};

export function loadBrandKit(): BrandKit {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultBrandKit, ...JSON.parse(raw) } : { ...defaultBrandKit };
  } catch {
    return { ...defaultBrandKit };
  }
}

export function saveBrandKit(kit: BrandKit): void {
  localStorage.setItem(KEY, JSON.stringify(kit));
  window.dispatchEvent(new Event('brand_kit_updated'));
}

export function formatBrandKitForApi(kit: BrandKit): string {
  const parts: string[] = [];
  if (kit.voiceRules.trim()) parts.push(`Voice rules: ${kit.voiceRules.trim()}`);
  if (kit.bannedPhrases.length) parts.push(`Never use these phrases: ${kit.bannedPhrases.join(', ')}`);
  if (kit.boilerplateCta.trim()) parts.push(`Default CTA: ${kit.boilerplateCta.trim()}`);
  if (kit.legalFooter.trim()) parts.push(`Legal footer (append when relevant): ${kit.legalFooter.trim()}`);
  parts.push(`Brand colors — primary: ${kit.logoColors.primary}, accent: ${kit.logoColors.accent}`);
  return parts.join('\n');
}
