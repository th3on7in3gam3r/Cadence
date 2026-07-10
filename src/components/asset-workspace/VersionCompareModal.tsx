/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VersionCompareDiff, { HistoryEntry } from './VersionCompareDiff';
import { GeneratedAsset } from '../../types';

interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  compareLeftIdx: number;
  compareRightIdx: number;
  compareDiffViewMode: 'side' | 'inline';
  setCompareLeftIdx: (idx: number) => void;
  setCompareRightIdx: (idx: number) => void;
  setCompareDiffViewMode: (mode: 'side' | 'inline') => void;
  onRevertAsset: (asset: GeneratedAsset) => void;
}

export default function VersionCompareModal({
  isOpen,
  onClose,
  history,
  compareLeftIdx,
  compareRightIdx,
  compareDiffViewMode,
  setCompareLeftIdx,
  setCompareRightIdx,
  setCompareDiffViewMode,
  onRevertAsset,
}: VersionCompareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-all">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>⚖️</span>
              Refinement Copy Diff Analyzer
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visualize modification differences between any two draft versions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded transition-colors cursor-pointer font-bold border border-slate-805"
          >
            ✕ Close
          </button>
        </div>
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1 font-bold">Base draft</span>
              <select
                value={compareLeftIdx}
                onChange={(e) => setCompareLeftIdx(Number(e.target.value))}
                className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[280px] font-sans"
              >
                {(history || []).map((record, idx) => (
                  <option key={idx} value={idx}>
                    Draft #{idx + 1} ({record.timestamp})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1 font-bold">Compare draft</span>
              <select
                value={compareRightIdx}
                onChange={(e) => setCompareRightIdx(Number(e.target.value))}
                className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[280px] font-sans"
              >
                {(history || []).map((record, idx) => (
                  <option key={idx} value={idx}>
                    Draft #{idx + 1} ({record.timestamp})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex bg-slate-950 p-1 rounded border border-slate-850 text-[11px]">
            <button
              type="button"
              onClick={() => setCompareDiffViewMode('inline')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                compareDiffViewMode === 'inline' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              Inline
            </button>
            <button
              type="button"
              onClick={() => setCompareDiffViewMode('side')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                compareDiffViewMode === 'side' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              Side-by-side
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-950/20 flex-1 min-h-[300px]">
          <VersionCompareDiff
            history={history}
            compareLeftIdx={compareLeftIdx}
            compareRightIdx={compareRightIdx}
            compareDiffViewMode={compareDiffViewMode}
          />
        </div>
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white px-4 py-2 rounded text-xs">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const targetAsset = history[compareRightIdx]?.asset;
              if (targetAsset) {
                onRevertAsset(targetAsset);
                onClose();
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer"
          >
            Restore right version to workspace
          </button>
        </div>
      </div>
    </div>
  );
}
