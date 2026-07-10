/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Sparkles, Languages, Zap, MessageSquare, RefreshCw, ChevronRight,
} from 'lucide-react';
import { ChatMessage, CopywriterPersonaId } from '../types';
import { COPYWRITER_PERSONAS, getPersonaById } from '../data/copywriterPersonas';

interface CopywriterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  assetTitle: string;
  currentContent: string;
  isRefining: boolean;
  onRefine: (feedback: string, toneIntensity: number) => Promise<void>;
  computeWordDiff: (a: string, b: string) => { type: 'added' | 'removed' | 'unchanged'; value: string }[];
}

const HOOK_PROMPT =
  'Generate 3 alternate opening hooks for this asset. Label each Hook A, Hook B, Hook C. Keep the rest of the structure intact but lead with the strongest hook variant.';

const TRANSLATE_PROMPT_PREFIX = 'Translate the entire marketing asset below into ';

export default function CopywriterSidebar({
  isOpen,
  onClose,
  assetTitle,
  currentContent,
  isRefining,
  onRefine,
  computeWordDiff,
}: CopywriterSidebarProps) {
  const [personaId, setPersonaId] = useState<CopywriterPersonaId>('conversion_specialist');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toneIntensity, setToneIntensity] = useState(6);
  const [translateLang, setTranslateLang] = useState('Spanish');
  const [preTranslateContent, setPreTranslateContent] = useState<string | null>(null);
  const [showTranslateDiff, setShowTranslateDiff] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const persona = getPersonaById(personaId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRefining]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          text: persona.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, personaId]);

  const wrapWithPersona = (text: string) =>
    `[${persona.name} — ${persona.title}]\n${persona.systemPrompt}\n\nRequest: ${text}`;

  const sendMessage = async (text: string, options?: { isTranslate?: boolean }) => {
    if (!text.trim() || isRefining) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (options?.isTranslate) {
      setPreTranslateContent(currentContent);
    }

    try {
      await onRefine(wrapWithPersona(text), toneIntensity);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        text: options?.isTranslate
          ? `Translation complete. Use the diff panel below to compare before and after.`
          : `Done — I've applied your ${persona.title} perspective. Review the main canvas for updates.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (options?.isTranslate) setShowTranslateDiff(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          text: `Error: ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const diffs =
    preTranslateContent && showTranslateDiff
      ? computeWordDiff(preTranslateContent, currentContent)
      : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-[min(100%,24rem)] sm:w-[min(100%,28rem)] bg-slate-900 border-l border-slate-800 shadow-2xl z-[70] flex flex-col font-sans"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  AI Copywriter
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[240px]">{assetTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800 space-y-2 overflow-x-auto">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Specialist persona</span>
              <div className="flex flex-wrap gap-1.5">
                {COPYWRITER_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPersonaId(p.id);
                      setMessages([
                        {
                          id: 'greeting-' + p.id,
                          role: 'assistant',
                          text: p.greeting,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                    }}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                      personaId === p.id
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 border-b border-slate-800 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isRefining}
                onClick={() => sendMessage(HOOK_PROMPT)}
                className="text-[10px] flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3 h-3" />
                Alternate hooks
              </button>
              <div className="flex items-center gap-1">
                <select
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                  className="text-[10px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300"
                >
                  {['Spanish', 'French', 'German', 'Portuguese', 'Japanese'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isRefining}
                  onClick={() =>
                    sendMessage(
                      `${TRANSLATE_PROMPT_PREFIX}${translateLang}. Preserve formatting and CTA intent.`,
                      { isTranslate: true }
                    )
                  }
                  className="text-[10px] flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Languages className="w-3 h-3" />
                  Translate
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-600 mt-0.5 font-mono">{msg.timestamp}</span>
                </div>
              ))}
              {isRefining && (
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  {persona.name} is refining…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {showTranslateDiff && preTranslateContent && (
              <div className="p-3 border-t border-slate-800 max-h-[140px] overflow-y-auto bg-slate-950">
                <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold block mb-2">
                  Translation diff (side-by-side inline)
                </span>
                <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {diffs.map((part, i) => {
                    if (part.type === 'added') {
                      return (
                        <span key={i} className="bg-emerald-950/60 text-emerald-400 px-0.5 rounded">
                          {part.value}
                        </span>
                      );
                    }
                    if (part.type === 'removed') {
                      return (
                        <span key={i} className="bg-rose-950/50 text-rose-400 line-through px-0.5">
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={i}>{part.value}</span>;
                  })}
                </div>
              </div>
            )}

            <div className="p-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                <span>Intensity {toneIntensity}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={toneIntensity}
                  onChange={(e) => setToneIntensity(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 h-1"
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isRefining}
                  placeholder={`Ask ${persona.name}…`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isRefining || !input.trim()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[9px] text-slate-600 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <Sparkles className="w-3 h-3 text-amber-500" />
                Persona context is injected into every refinement request.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
