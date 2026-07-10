/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { computeWordDiff } from '../../utils/wordDiff';
import { GeneratedAsset } from '../../types';

export interface HistoryEntry {
  timestamp: string;
  summary: string;
  asset: GeneratedAsset;
}

interface VersionCompareDiffProps {
  history: HistoryEntry[];
  compareLeftIdx: number;
  compareRightIdx: number;
  compareDiffViewMode: 'side' | 'inline';
}

export default function VersionCompareDiff({
  history,
  compareLeftIdx,
  compareRightIdx,
  compareDiffViewMode,
}: VersionCompareDiffProps) {
  if (compareLeftIdx === compareRightIdx) {
    return (
      <div className="text-center py-8 text-slate-500 text-xs italic">
        Select two different versions above to see what changed.
      </div>
    );
  }

  const leftText = history[compareLeftIdx]?.asset?.content || '';
  const rightText = history[compareRightIdx]?.asset?.content || '';
  const diffs = computeWordDiff(leftText, rightText);
  const leftWords = leftText.split(/\s+/).filter(Boolean).length;
  const rightWords = rightText.split(/\s+/).filter(Boolean).length;

  if (compareDiffViewMode === 'inline') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 text-[9px] font-mono text-slate-500 uppercase">
          <span>Left: {leftWords} words</span>
          <span>Right: {rightWords} words</span>
          <span className="text-amber-500/90">
            Δ {rightWords - leftWords >= 0 ? '+' : ''}
            {rightWords - leftWords} words
          </span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-sans text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          <div className="border-b border-slate-801/50 pb-2 mb-3 flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase select-none">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-rose-600 rounded" />
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded" />
              <span>Added</span>
            </div>
          </div>
          <div>
            {diffs.map((part, pIdx) => {
              if (part.type === 'added') {
                return (
                  <span
                    key={pIdx}
                    className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 px-1 rounded mx-0.5 font-semibold"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === 'removed') {
                return (
                  <span
                    key={pIdx}
                    className="bg-rose-950/60 text-rose-400 line-through px-1 rounded mx-0.5 decoration-rose-500/80"
                  >
                    {part.value}
                  </span>
                );
              }
              return <span key={pIdx}>{part.value}</span>;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-[9px] font-mono text-slate-500 uppercase">
        <span>
          Left: {leftWords} words · {leftText.length} chars
        </span>
        <span>
          Right: {rightWords} words · {rightText.length} chars
        </span>
        <span className="text-amber-500/90">
          Δ {rightWords - leftWords >= 0 ? '+' : ''}
          {rightWords - leftWords} words
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 flex flex-col min-h-[180px]">
          <div className="flex justify-between items-center border-b border-slate-801 pb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
              Version {compareLeftIdx + 1}
            </span>
            <span className="text-[9px] text-slate-500 truncate max-w-[140px]">
              {history[compareLeftIdx]?.summary?.substring(0, 40) || 'Earlier draft'}
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap flex-1 max-h-[280px] overflow-y-auto">
            {diffs.map((part, pIdx) => {
              if (part.type === 'removed') {
                return (
                  <span
                    key={pIdx}
                    className="bg-rose-950/50 text-rose-400 line-through px-1 rounded mx-0.5 decoration-rose-600"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === 'added') return null;
              return <span key={pIdx}>{part.value}</span>;
            })}
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 flex flex-col min-h-[180px]">
          <div className="flex justify-between items-center border-b border-slate-801 pb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
              Version {compareRightIdx + 1}
            </span>
            <span className="text-[9px] text-slate-500 truncate max-w-[140px]">
              {history[compareRightIdx]?.summary?.substring(0, 40) || 'Later draft'}
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap flex-1 max-h-[280px] overflow-y-auto">
            {diffs.map((part, pIdx) => {
              if (part.type === 'added') {
                return (
                  <span
                    key={pIdx}
                    className="bg-emerald-950/50 text-emerald-300 font-semibold px-1 rounded mx-0.5"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === 'removed') return null;
              return <span key={pIdx}>{part.value}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
