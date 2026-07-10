/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target } from 'lucide-react';
import { GeneratedAsset } from '../../types';

interface SeoChecklistPanelProps {
  localAssetContent: string;
  asset: GeneratedAsset;
}

export default function SeoChecklistPanel({ localAssetContent, asset }: SeoChecklistPanelProps) {
  const text = localAssetContent || '';
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const descLength = asset.summary ? asset.summary.length : 0;
  const isDescOptimal = descLength >= 110 && descLength <= 170;
  const titleLength = asset.title ? asset.title.length : 0;
  const isTitleOptimal = titleLength >= 30 && titleLength <= 65;
  const stopWords = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'is', 'for', 'that', 'with', 'on', 'this', 'our', 'your',
    'we', 'are', 'you', 'it', 'us', 'an', 'or', 'at', 'as', 'by', 'be',
  ]);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });
  const densityList = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, freq]) => ({
      word,
      count: freq,
      density: parseFloat(((freq / Math.max(1, wordCount)) * 100).toFixed(1)),
    }));
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  let readabilityRange = 'Approachable & Conversational';
  let readabilityScore = 85;
  if (avgSentenceLength > 18) {
    readabilityRange = 'Technical / Advanced (Academic)';
    readabilityScore = 45;
  } else if (avgSentenceLength > 14) {
    readabilityRange = 'Professional & Informative';
    readabilityScore = 65;
  }

  return (
    <div className="w-full bg-slate-950/40 p-6 space-y-4 min-w-0 border-t border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-805 pb-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          SEO Copy Analyzer
        </span>
        <span className="text-[10px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded border border-slate-705 font-mono">
          Live
        </span>
      </div>
      <div className="space-y-4">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Title Tag Length</span>
            {isTitleOptimal ? (
              <span className="text-[10px] font-bold text-emerald-400">✓ Optimal</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-500">⚠ Action Needed</span>
            )}
          </div>
          <p className="text-xs text-white">
            Current: <strong className="font-mono text-xs">{titleLength} chars</strong>
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Meta Link Summary</span>
            {isDescOptimal ? (
              <span className="text-[10px] font-bold text-emerald-400">✓ Optimal</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-500">⚠ Action Needed</span>
            )}
          </div>
          <p className="text-xs text-white">
            Current: <strong className="font-mono text-xs">{descLength} chars</strong>
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Estimated Readability</span>
          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-900">
            <p className="text-[11px] font-semibold text-white">{readabilityRange}</p>
            <span className="text-xs font-mono font-bold text-emerald-400">{readabilityScore} / 100</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Publication Checklist</span>
          <label className="flex items-center gap-2 bg-slate-900/40 p-2 rounded border border-slate-850 text-[11px] text-slate-300">
            <input type="checkbox" defaultChecked={wordCount > 150} readOnly className="accent-emerald-500" />
            <span>Word count target ({wordCount} words)</span>
          </label>
        </div>
        {densityList.length > 0 && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Top keywords</span>
            {densityList.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>{item.word}</span>
                <span>{item.density}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
