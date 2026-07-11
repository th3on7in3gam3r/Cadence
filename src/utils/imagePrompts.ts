/**
 * Per-asset image prompts for Campaign Studio visuals.
 */

import type { GeneratedAsset, MarketingAssetType } from '../types';

const STORAGE_KEY = 'ai_cmo_image_prompts_by_asset';

export function buildDefaultImagePrompt(
  assetType: MarketingAssetType,
  asset: GeneratedAsset,
  brandName: string,
): string {
  const title = asset.title?.trim() || brandName || 'Campaign';
  const summary = asset.summary?.trim();

  switch (assetType) {
    case 'blog_post':
      return title;
    case 'social_posts':
      return `Social promo graphic for ${brandName}: ${title}`;
    case 'email_sequence':
      return `Email header visual for ${brandName} — ${title}`;
    case 'lead_magnet':
      return `Lead magnet cover for ${brandName}: ${title}${summary ? ` — ${summary.slice(0, 80)}` : ''}`;
    case 'seo_keywords':
      return `SEO & search visibility graphic for ${brandName}: ${title}`;
    default:
      return title;
  }
}

export function loadImagePrompt(assetType: MarketingAssetType): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Partial<Record<MarketingAssetType, string>>;
    return map[assetType]?.trim() || null;
  } catch {
    return null;
  }
}

export function saveImagePrompt(assetType: MarketingAssetType, prompt: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[assetType] = prompt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getStudioImageUrl(
  assetType: MarketingAssetType,
  artisticTheme: string,
  imagenSeed: number,
  prompt: string,
): string {
  const encoded = encodeURIComponent(prompt || 'marketing');
  if (assetType === 'social_posts') {
    return `https://picsum.photos/seed/imagen-social-${artisticTheme}-${imagenSeed}-${encoded}/800/420`;
  }
  if (assetType === 'lead_magnet') {
    return `https://picsum.photos/seed/imagen-lead-${artisticTheme}-${imagenSeed}-${encoded}/900/900`;
  }
  return `https://picsum.photos/seed/imagen-${assetType}-${artisticTheme}-${imagenSeed}-${encoded}/1200/675`;
}

const GENERATED_IMAGES_KEY = 'ai_cmo_generated_images_by_asset';

export function loadGeneratedImageUrl(assetType: MarketingAssetType): string | null {
  try {
    const raw = localStorage.getItem(GENERATED_IMAGES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Partial<Record<MarketingAssetType, string>>;
    return map[assetType]?.trim() || null;
  } catch {
    return null;
  }
}

export function saveGeneratedImageUrl(assetType: MarketingAssetType, imageDataUrl: string): void {
  try {
    const raw = localStorage.getItem(GENERATED_IMAGES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[assetType] = imageDataUrl;
    localStorage.setItem(GENERATED_IMAGES_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

/** Prefer a real Imagen result; otherwise show the placeholder preview. */
export function resolveStudioImageUrl(input: {
  generatedUrl?: string | null;
  assetType: MarketingAssetType;
  artisticTheme: string;
  imagenSeed: number;
  prompt: string;
}): string {
  if (input.generatedUrl?.trim()) return input.generatedUrl.trim();
  return getStudioImageUrl(
    input.assetType,
    input.artisticTheme,
    input.imagenSeed,
    input.prompt,
  );
}

export function isGeneratedImageUrl(url: string): boolean {
  return url.startsWith('data:image/');
}

export function getStudioLabels(assetType: MarketingAssetType): { suite: string; panel: string } {
  const labels: Record<MarketingAssetType, { suite: string; panel: string }> = {
    blog_post: {
      suite: 'Featured Blog Banner Engine',
      panel: 'Blog cover — 16:9 landscape',
    },
    social_posts: {
      suite: 'Social Graphic Channel Card Studio',
      panel: 'Social card — platform layouts',
    },
    email_sequence: {
      suite: 'Email Header Visual Studio',
      panel: 'Email hero — 16:9 header',
    },
    lead_magnet: {
      suite: 'Lead Magnet Cover Studio',
      panel: 'Download cover — square 1:1',
    },
    seo_keywords: {
      suite: 'SEO Campaign Visual Studio',
      panel: 'Keywords hub — 16:9 banner',
    },
  };
  return labels[assetType];
}
