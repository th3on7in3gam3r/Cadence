/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, RotateCcw, Trash2, Globe, Clock, Search } from 'lucide-react';
import { CampaignRun } from '../types';
import { PRODUCT_NAME } from '../lib/brand';

interface NewRunModalProps {
  open: boolean;
  onClose: () => void;
  runs: CampaignRun[];
  currentBrandName?: string;
  defaultUrl?: string;
  isLoading?: boolean;
  onStartBrandAudit: (url: string, saveCurrent: boolean) => void;
  onRestoreRun: (runId: string) => void;
  onDeleteRun: (runId: string) => void;
}

export default function NewRunModal({
  open,
  onClose,
  runs,
  currentBrandName,
  defaultUrl = '',
  isLoading,
  onStartBrandAudit,
  onRestoreRun,
  onDeleteRun,
}: NewRunModalProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [saveCurrent, setSaveCurrent] = useState(true);
  const [tab, setTab] = useState<'new' | 'saved'>('new');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onStartBrandAudit(url.trim(), saveCurrent && !!currentBrandName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="new-run-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 id="new-run-title" className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            New audit or run
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-800">
          {(['new', 'saved'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold cursor-pointer ${
                tab === t ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500'
              }`}
            >
              {t === 'new' ? 'Start new brand audit' : `Saved runs (${runs.length})`}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Analyze a new website. {PRODUCT_NAME} will build a fresh strategy, dashboard, and content workspace.
              </p>
              <div>
                <label htmlFor="new-run-url" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Website URL
                </label>
                <input
                  id="new-run-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              {currentBrandName && (
                <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveCurrent}
                    onChange={(e) => setSaveCurrent(e.target.checked)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <span>
                    Save current run <strong className="text-slate-200">{currentBrandName}</strong> before starting
                    (includes SEO audit if you ran one)
                  </span>
                </label>
              )}
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Run brand audit
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {runs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No saved runs yet. Start a new audit and check “save current” to keep prior work.</p>
              ) : (
                runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{run.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{run.brandUrl}</p>
                      <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(run.updatedAt).toLocaleString()}
                        {run.seoAudit && (
                          <span className="text-teal-500 ml-2">· SEO {run.seoAudit.overallScore}%</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestoreRun(run.id)}
                      className="px-2.5 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRun(run.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                      title="Delete saved run"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
