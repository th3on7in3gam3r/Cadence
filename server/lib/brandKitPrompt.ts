/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BrandKitInput {
  voiceRules?: string;
  bannedPhrases?: string[];
  boilerplateCta?: string;
  legalFooter?: string;
  logoColors?: { primary?: string; accent?: string; secondary?: string };
}

export function formatBrandKitBlock(brandKit?: BrandKitInput | null): string {
  if (!brandKit) return '';
  const parts: string[] = ['\nBrand kit (must follow):'];
  if (brandKit.voiceRules?.trim()) parts.push(`- Voice: ${brandKit.voiceRules.trim()}`);
  if (brandKit.bannedPhrases?.length) {
    parts.push(`- Never use: ${brandKit.bannedPhrases.join(', ')}`);
  }
  if (brandKit.boilerplateCta?.trim()) parts.push(`- Default CTA: ${brandKit.boilerplateCta.trim()}`);
  if (brandKit.legalFooter?.trim()) parts.push(`- Legal footer when relevant: ${brandKit.legalFooter.trim()}`);
  if (brandKit.logoColors) {
    parts.push(
      `- Colors: primary ${brandKit.logoColors.primary || 'n/a'}, accent ${brandKit.logoColors.accent || 'n/a'}`
    );
  }
  return parts.length > 1 ? parts.join('\n') : '';
}
