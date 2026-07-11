/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';
import type { MarketingAssetType } from '../types';

export interface GenerateStudioImageResult {
  imageDataUrl: string;
  mimeType: string;
  model: string;
  enhancedPrompt?: string;
}

export async function generateStudioImage(input: {
  prompt: string;
  assetType: MarketingAssetType;
  artisticTheme?: string;
}): Promise<GenerateStudioImageResult> {
  const res = await apiFetch('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Image generation failed.');
  }

  return res.json();
}
