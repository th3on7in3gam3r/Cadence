/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import {
  GeneratedAsset,
  MarketingAssetType,
  WebsiteAnalysis,
  AssetHistoryEntry,
  CampaignImageExportMeta,
} from '../types';

const ASSET_LABELS: Record<MarketingAssetType, string> = {
  seo_keywords: 'seo-keywords',
  blog_post: 'blog-post',
  social_posts: 'social-posts',
  email_sequence: 'email-sequence',
  lead_magnet: 'lead-magnet',
};

export interface CampaignBundleInput {
  brandAnalysis: WebsiteAnalysis | null;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>;
  images?: CampaignImageExportMeta[];
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || 'image/jpeg';
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { base64: btoa(binary), mime };
  } catch {
    return null;
  }
}

export async function buildCampaignBundleZip(input: CampaignBundleInput): Promise<Blob> {
  const zip = new JSZip();
  const manifest: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    brandName: input.brandAnalysis?.brandName ?? 'Campaign',
    assetTypes: Object.keys(input.cachedAssets),
  };

  if (input.brandAnalysis) {
    zip.file('brand-brief.json', JSON.stringify(input.brandAnalysis, null, 2));
  }

  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const [type, asset] of Object.entries(input.cachedAssets) as [MarketingAssetType, GeneratedAsset][]) {
      const slug = ASSET_LABELS[type];
      assetsFolder.file(`${slug}.md`, asset.content || '');
      assetsFolder.file(`${slug}-meta.json`, JSON.stringify({
        type,
        title: asset.title,
        summary: asset.summary,
        taglineOrCTA: asset.taglineOrCTA,
        seoInstructions: asset.seoInstructions,
      }, null, 2));
    }
  }

  const historyFolder = zip.folder('history');
  if (historyFolder) {
    for (const [type, entries] of Object.entries(input.assetHistory) as [MarketingAssetType, AssetHistoryEntry[]][]) {
      if (!entries?.length) continue;
      const slug = ASSET_LABELS[type];
      const typeFolder = historyFolder.folder(slug);
      if (!typeFolder) continue;
      entries.forEach((entry, idx) => {
        typeFolder.file(`v${idx + 1}-${entry.timestamp.replace(/[:/\\]/g, '-')}.md`, entry.asset.content || '');
        typeFolder.file(`v${idx + 1}-meta.json`, JSON.stringify({
          summary: entry.summary,
          timestamp: entry.timestamp,
          toneIntensity: entry.toneIntensity,
          tags: entry.tags,
        }, null, 2));
      });
    }
  }

  const imagesFolder = zip.folder('images');
  const imageManifest: { label: string; url: string; file?: string }[] = [];

  if (imagesFolder && input.images?.length) {
    for (let i = 0; i < input.images.length; i++) {
      const img = input.images[i];
      imageManifest.push({ label: img.label, url: img.url });
      const fetched = await fetchImageAsBase64(img.url);
      if (fetched) {
        const ext = fetched.mime.includes('png') ? 'png' : 'jpg';
        const filename = `${ASSET_LABELS[img.assetType]}-${i + 1}.${ext}`;
        imagesFolder.file(filename, fetched.base64, { base64: true });
        imageManifest[imageManifest.length - 1].file = `images/${filename}`;
      } else {
        imagesFolder.file(`${ASSET_LABELS[img.assetType]}-${i + 1}-url.txt`, img.url);
      }
    }
  }

  manifest.images = imageManifest;
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('README.md', `# Campaign Export\n\nExported: ${manifest.exportedAt}\n\n## Contents\n- \`brand-brief.json\` — strategic analysis\n- \`assets/*.md\` — current copy per deliverable\n- \`assets/*-meta.json\` — titles, CTAs, SEO notes\n- \`history/\` — version snapshots\n- \`images/\` — Imagen / visual assets (base64 when fetch succeeded)\n`);

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export function downloadCampaignBundle(blob: Blob, brandName: string) {
  const slug = (brandName || 'campaign').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-cmo-${slug}-${date}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildDefaultCampaignImages(
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>,
  artisticTheme: string,
  imagenSeed: number,
  customImagePrompt: string
): CampaignImageExportMeta[] {
  const images: CampaignImageExportMeta[] = [];
  const prompt = encodeURIComponent(customImagePrompt || 'marketing');

  if (cachedAssets.blog_post) {
    images.push({
      assetType: 'blog_post',
      label: 'Blog featured banner',
      url: `https://picsum.photos/seed/imagen-${artisticTheme}-${imagenSeed}-${prompt}/1200/675`,
      artisticTheme,
      prompt: customImagePrompt,
    });
  }
  if (cachedAssets.social_posts) {
    images.push({
      assetType: 'social_posts',
      label: 'Social graphic',
      url: `https://picsum.photos/seed/social-${artisticTheme}-${imagenSeed}-${prompt}/1080/1080`,
      artisticTheme,
      prompt: customImagePrompt,
    });
  }
  return images;
}
