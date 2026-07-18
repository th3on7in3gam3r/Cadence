/**
 * Shared metadata bar under Campaign Studio image previews.
 */

import { Eye } from 'lucide-react';
import type { MarketingAssetType } from '../../types';

const RATIO_LABELS: Record<MarketingAssetType, string> = {
  blog_post: '16:9 Banner',
  social_posts: '1.91:1 Social card',
  email_sequence: '16:9 Header',
  lead_magnet: '1:1 Square',
  seo_keywords: '16:9 Banner',
};

interface StudioImageMetaBarProps {
  assetType: MarketingAssetType;
  generatedImageUrl: string | null;
  inspectUrl?: string | null;
  showTitleOverlay?: boolean;
  onTitleOverlayChange?: (checked: boolean) => void;
  className?: string;
}

export default function StudioImageMetaBar({
  assetType,
  generatedImageUrl,
  inspectUrl,
  showTitleOverlay,
  onTitleOverlayChange,
  className = '',
}: StudioImageMetaBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between text-[10px] text-slate-500 bg-slate-950/40 px-3 py-2 border border-slate-850/60 rounded-xl gap-2 font-mono ${className}`}
    >
      <div className="flex items-center gap-2">
        <span>
          Ratio: <strong>{RATIO_LABELS[assetType]}</strong>
        </span>
        <span className="text-slate-800">|</span>
        <span>
          Engine: <strong>{generatedImageUrl ? 'Imagen (generated)' : 'Awaiting Imagen generation'}</strong>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {generatedImageUrl && (
          <a
            href={generatedImageUrl}
            download={`${assetType}-hero.png`}
            className="text-emerald-400 hover:text-emerald-300 font-bold"
          >
            Download image
          </a>
        )}
        {onTitleOverlayChange && (
          <>
            <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-250">
              <input
                type="checkbox"
                checked={!!showTitleOverlay}
                onChange={(e) => onTitleOverlayChange(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/50 accent-emerald-500"
              />
              <span>Title Overlay</span>
            </label>
            <span className="text-slate-800">|</span>
          </>
        )}
        {inspectUrl && (
          <a
            href={inspectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-350 font-bold transition flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            <span>Inspect raw image</span>
          </a>
        )}
      </div>
    </div>
  );
}
