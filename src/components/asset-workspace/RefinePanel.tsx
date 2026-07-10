/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Settings, RefreshCw } from 'lucide-react';
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
}: RefinePanelProps) {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isRefining]);

  const handlePolish = (prompt: string) => {
    applyQuickPolish(prompt);
    setTimeout(() => feedbackInputRef.current?.focus(), 0);
  };

  return (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg flex flex-col h-[550px] overflow-hidden">
            {/* Collapsible Chat Top */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Refine with CMO Office
                </h4>
                <p className="text-[10px] text-slate-450 font-sans">Dynamic peer reviews & revisions</p>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-950/50 text-xs">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto items-end animate-fade-in' : 'mr-auto items-start'
                  }`}
                >
                  <div className={`p-3 rounded-lg leading-normal ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono tracking-tighter">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isRefining && (
                <div className="flex items-center gap-2 py-2 text-slate-450 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span className="text-[10px]">Processing rewrite guidelines...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Granular Control: Tone Intensity Slider (1-10) */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Settings className="w-3 h-3 text-emerald-400" />
                  Tone Change Intensity: <span className="text-emerald-400 font-bold">{toneIntensity} / 10</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono italic">
                  {toneIntensity <= 3 ? 'Subtle Adjust' : toneIntensity <= 7 ? 'Balanced Reform' : 'Full Rewrite'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 select-none">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={toneIntensity}
                  onChange={(e) => setToneIntensity(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] font-mono text-slate-500 select-none">10</span>
              </div>
            </div>

            {/* Voice Tone Quick-Select Presets (Updates intensity and triggers re-draft) */}
            <div className="p-3 bg-slate-900/50 border-t border-slate-850 space-y-2">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">
                Voice Tone Presets (Updates & Re-drafts):
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-sans">
                {tonePresets.map((preset, index) => (
                  <div key={index} className="relative group/preset">
                    <button
                      type="button"
                      id={`tone-preset-btn-${index}`}
                      onClick={() => {
                        setToneIntensity(preset.value);
                        submitFeedback(preset.feedback, preset.value);
                      }}
                      disabled={isRefining}
                      className="w-full text-[10px] py-1.5 px-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:border-slate-750 text-slate-200 hover:text-white rounded text-left transition-all cursor-pointer font-medium disabled:opacity-50 truncate flex items-center justify-between active:scale-95 select-none"
                    >
                      <span>{preset.label}</span>
                      <span className="text-[8px] font-mono font-bold text-slate-500 bg-slate-900 px-1 rounded-sm">Lvl {preset.value}</span>
                    </button>

                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/preset:block w-56 bg-slate-950 border border-slate-800 text-slate-300 p-2.5 rounded-lg text-[10px] shadow-2xl leading-relaxed z-50 font-normal pointer-events-none transition-all">
                      <div className="text-emerald-400 font-mono font-bold text-[9px] mb-1 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        Structure Preview (Lvl {preset.value})
                      </div>
                      <div className="text-slate-300 font-sans leading-relaxed">{preset.structureTooltip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Polish — fills refinement prompt (edit before sending) */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <span className="text-[9px] font-mono font-bold text-amber-500/90 block uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Quick Polish
              </span>
              <p className="text-[9px] text-slate-500 font-sans leading-snug">
                Inserts an optimized AI prompt below—review and edit, then send.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPolishPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`quick-polish-btn-${idx}`}
                    onClick={() => handlePolish(preset.prompt)}
                    disabled={isRefining}
                    className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 hover:text-amber-100 px-2.5 py-1 border border-amber-500/25 rounded transition-all cursor-pointer disabled:opacity-50 font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick recommendation Pills — instant send */}
            <div className="p-3 bg-slate-950/50 border-t border-slate-850 space-y-2">
              <span className="text-[9px] font-mono font-bold text-slate-450 block uppercase">
                One-click revisions:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                {quickPills.map((pill, idx) => (
                  <button
                    key={idx}
                    id={`refinement-pill-${idx}`}
                    onClick={() => submitFeedback(pill.text)}
                    disabled={isRefining}
                    className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-1 border border-slate-850 rounded transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Refinement prompt text area */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                submitFeedback(feedbackInput);
              }} 
              className="p-3 bg-slate-950/40 border-t border-slate-800 flex gap-1.5 items-end"
            >
              <textarea
                ref={feedbackInputRef}
                rows={3}
                placeholder="Describe how to refine this draft, or use Quick Polish above..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submitFeedback(feedbackInput);
                  }
                }}
                disabled={isRefining}
                className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 rounded text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-900 resize-y min-h-[72px] font-sans leading-relaxed"
              />
              <button
                type="submit"
                disabled={isRefining || !feedbackInput.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded cursor-pointer shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

  );
}
