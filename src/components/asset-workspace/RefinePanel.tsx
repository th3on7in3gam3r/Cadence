/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Send, Sparkles, Settings, RefreshCw, ChevronDown, Search } from 'lucide-react';
import { ChatMessage } from '../../types';

export interface RefinePanelProps {
  chatHistory: ChatMessage[];
  isRefining: boolean;
  toneIntensity: number;
  setToneIntensity: (v: number) => void;
  feedbackInput: string;
  setFeedbackInput: (v: string) => void;
  submitFeedback: (text: string, overrideIntensity?: number) => void;
  applyQuickPolish: (prompt: string) => void;
  tonePresets: { label: string; value: number; feedback: string; structureTooltip: string }[];
  quickPolishPresets: { label: string; prompt: string }[];
  quickPills: { label: string; text: string }[];
  /** Increment from parent to expand when collapsed (e.g. toolbar "Refine draft") */
  expandToken?: number;
  seoSnapshot?: {
    title: string;
    summary: string;
    seoInstructions: string;
    taglineOrCTA: string;
    wordCount: number;
  };
}

export default function RefinePanel({
  chatHistory,
  isRefining,
  toneIntensity,
  setToneIntensity,
  feedbackInput,
  setFeedbackInput,
  submitFeedback,
  applyQuickPolish,
  tonePresets,
  quickPolishPresets,
  quickPills,
  expandToken = 0,
  seoSnapshot,
}: RefinePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expandToken > 0) setIsOpen(true);
  }, [expandToken]);

  const prevChatLen = useRef(0);
  useEffect(() => {
    const grew = chatHistory.length > prevChatLen.current;
    prevChatLen.current = chatHistory.length;
    if (grew && chatHistory.length > 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatHistory]);

  const handlePolish = (prompt: string) => {
    applyQuickPolish(prompt);
    setTimeout(() => feedbackInputRef.current?.focus(), 0);
  };

  const intensityLabel =
    toneIntensity <= 3 ? 'Subtle adjust' : toneIntensity <= 7 ? 'Balanced reform' : 'Full rewrite';

  return (
    <div
      id="refine-draft-panel"
      className="bg-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-900/80 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-display font-bold text-white">Refine this draft</h4>
            <p className="text-sm text-slate-400">
              {isOpen ? 'Adjust tone, polish copy, or chat with the AI editor' : 'Click to expand refine tools'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isRefining && (
            <span className="inline-flex items-center gap-2 text-sm text-emerald-300 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Rewriting…
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px lg:bg-slate-800">
        {/* Chat column */}
        <div className="bg-slate-900 flex flex-col min-h-[280px] lg:min-h-[420px]">
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[90%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-xl leading-relaxed text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-xs text-slate-500 mt-1">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitFeedback(feedbackInput);
            }}
            className="p-4 border-t border-slate-800 flex gap-2 items-end bg-slate-950/40"
          >
            <textarea
              ref={feedbackInputRef}
              rows={3}
              placeholder="Tell the AI how to improve this draft…"
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submitFeedback(feedbackInput);
                }
              }}
              disabled={isRefining}
              className="flex-1 bg-slate-950 border border-slate-700 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60 resize-y min-h-[88px]"
            />
            <button
              type="submit"
              disabled={isRefining || !feedbackInput.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl cursor-pointer shrink-0 transition-colors"
              title="Send refinement (⌘/Ctrl + Enter)"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Controls column */}
        <div className="bg-slate-900 p-5 flex flex-col gap-5 lg:min-h-[420px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Tone intensity
              </span>
              <span className="text-sm font-bold text-emerald-400">{toneIntensity} / 10</span>
            </div>
            <p className="text-sm text-slate-400">{intensityLabel}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-4">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={toneIntensity}
                onChange={(e) => setToneIntensity(parseInt(e.target.value, 10))}
                className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-slate-500 w-6 text-right">10</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-white block">Voice tone presets</span>
            <p className="text-xs text-slate-500">Click to rewrite at that tone level</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tonePresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  id={`tone-preset-btn-${index}`}
                  onClick={() => {
                    setToneIntensity(preset.value);
                    submitFeedback(preset.feedback, preset.value);
                  }}
                  disabled={isRefining}
                  title={preset.structureTooltip}
                  className="text-left px-4 py-3 bg-slate-950 border border-slate-800 hover:border-emerald-600/40 hover:bg-slate-900 text-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{preset.label}</span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded">
                      Lvl {preset.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{preset.structureTooltip}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Quick polish
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPolishPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`quick-polish-btn-${idx}`}
                  onClick={() => handlePolish(preset.prompt)}
                  disabled={isRefining}
                  className="text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 px-3 py-2 border border-amber-500/30 rounded-lg transition-all cursor-pointer disabled:opacity-50 font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-white block">One-click revisions</span>
            <div className="flex flex-wrap gap-2">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  id={`refinement-pill-${idx}`}
                  onClick={() => submitFeedback(pill.text)}
                  disabled={isRefining}
                  className="text-sm bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-2 border border-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {seoSnapshot && (
            <div className="space-y-3 mt-auto pt-4 border-t border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                  SEO snapshot
                </span>
                <span className="text-xs text-slate-500 shrink-0">{seoSnapshot.wordCount} words</span>
              </div>
              <p className="text-xs text-slate-500">
                Shown below your post when you use <strong className="text-slate-400">Copy WordPress HTML</strong>
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
                {seoSnapshot.summary && (
                  <div>
                    <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-wide mb-1">
                      Meta description
                    </p>
                    <p className="text-slate-300 leading-relaxed">{seoSnapshot.summary}</p>
                  </div>
                )}
                {seoSnapshot.seoInstructions && (
                  <div>
                    <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-wide mb-1">
                      Keywords &amp; strategy
                    </p>
                    <p className="text-slate-400 leading-relaxed whitespace-pre-line line-clamp-5">
                      {seoSnapshot.seoInstructions}
                    </p>
                  </div>
                )}
                {seoSnapshot.taglineOrCTA && (
                  <div>
                    <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-wide mb-1">Primary CTA</p>
                    <p className="text-slate-300 italic">&ldquo;{seoSnapshot.taglineOrCTA}&rdquo;</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  handlePolish(
                    'Optimize this draft for search and readability: improve headline clarity, weave target keywords naturally, strengthen meta-worthy opening lines, and ensure scannable structure with clear subheadings.',
                  )
                }
                disabled={isRefining}
                className="w-full text-sm bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-200 px-3 py-2.5 border border-emerald-500/30 rounded-lg transition-all cursor-pointer disabled:opacity-50 font-semibold"
              >
                Run full SEO pass with AI
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
