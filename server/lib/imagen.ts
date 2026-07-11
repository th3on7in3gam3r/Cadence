/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, PersonGeneration } from '@google/genai';

const IMAGEN_MODELS = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'] as const;

export function aspectRatioForAsset(assetType: string): string {
  if (assetType === 'lead_magnet') return '1:1';
  if (assetType === 'social_posts') return '16:9';
  return '16:9';
}

function buildPrompt(prompt: string, artisticTheme?: string): string {
  const base = prompt.trim();
  if (!artisticTheme) return base;
  return `${base}\n\nVisual style direction: ${artisticTheme}.`;
}

function needsPeopleInScene(prompt: string): boolean {
  return /\b(person|people|family|parent|child|children|toddler|baby|kid|kids|mother|father|mom|dad)\b/i.test(
    prompt,
  );
}

export async function generateStudioImage(
  ai: GoogleGenAI,
  input: {
    prompt: string;
    assetType: string;
    artisticTheme?: string;
  },
): Promise<{ imageDataUrl: string; mimeType: string; model: string; enhancedPrompt?: string }> {
  const prompt = buildPrompt(input.prompt, input.artisticTheme);
  const aspectRatio = aspectRatioForAsset(input.assetType);
  const config = {
    numberOfImages: 1,
    aspectRatio,
    outputMimeType: 'image/png',
    personGeneration: needsPeopleInScene(prompt)
      ? PersonGeneration.ALLOW_ALL
      : PersonGeneration.ALLOW_ADULT,
  };

  let lastError: Error | null = null;

  for (const model of IMAGEN_MODELS) {
    try {
      const response = await ai.models.generateImages({
        model,
        prompt,
        config,
      });

      const generated = response.generatedImages?.[0];
      if (!generated?.image?.imageBytes) {
        const reason = generated?.raiFilteredReason || 'No image returned from Imagen.';
        throw new Error(reason);
      }

      const mimeType = generated.image.mimeType || 'image/png';
      const imageDataUrl = `data:${mimeType};base64,${generated.image.imageBytes}`;

      return {
        imageDataUrl,
        mimeType,
        model,
        enhancedPrompt: generated.enhancedPrompt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Imagen model ${model} failed:`, lastError.message);
    }
  }

  throw lastError || new Error('Image generation failed.');
}
