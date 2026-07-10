/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Mail, Smartphone, Monitor, MousePointerClick, Sparkles } from 'lucide-react';
import { parseEmailSequence, subjectLineScore } from '../utils/parseEmailSequence';

interface EmailMockupViewportProps {
  content: string;
  brandName: string;
  taglineOrCTA?: string;
}

export default function EmailMockupViewport({
  content,
  brandName,
  taglineOrCTA,
}: EmailMockupViewportProps) {
  const emails = useMemo(() => parseEmailSequence(content), [content]);
  const [activeTab, setActiveTab] = useState(0);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const active = emails[activeTab] || emails[0];
  const subjectMetrics = subjectLineScore(active?.subject || '');

  return (
    <div className="mb-8 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-xl animate-fade-in select-none min-w-0 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-4 mb-5">
        <div>
          <span className="text-[10px] font-mono text-amber-450 font-bold uppercase tracking-wider block">
            📧 Email Drip & Newsletter Mockup Engine
          </span>
          <h4 className="text-sm font-display font-black text-white uppercase mt-0.5 tracking-tight">
            Portrait Inbox Preview Studio
          </h4>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              deviceMode === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Mobile
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-850 gap-1 overflow-x-auto mb-4 pb-0.5 -mx-1 px-1 scrollbar-thin">
        {emails.map((email, idx) => (
          <button
            key={email.id}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-[10px] sm:text-[11px] font-sans font-bold whitespace-nowrap shrink-0 cursor-pointer max-w-[200px] truncate ${
              activeTab === idx
                ? 'border-amber-500 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Mail className="w-3 h-3 shrink-0" />
            {email.label}
          </button>
        ))}
      </div>

      <div
        className={`mx-auto transition-all duration-300 ${
          deviceMode === 'mobile' ? 'max-w-[320px]' : 'max-w-[420px]'
        }`}
      >
        <div
          className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '4/5' }}
        >
          <div className="absolute top-0 left-0 right-0 h-8 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            <span className="w-2 h-2 rounded-full bg-slate-700" />
          </div>

          <div className="pt-10 px-4 pb-4 h-full overflow-y-auto flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-850">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-[10px]">
                {brandName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-white truncate">{brandName}</p>
                <p className="text-[8px] text-slate-500 font-mono">to: subscriber@inbox.dev</p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-xs font-bold text-white leading-snug line-clamp-2">{active.subject}</p>
              <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed">{active.previewText}</p>
            </div>

            <div className="flex-1 bg-slate-950/60 rounded-lg border border-slate-850 p-3 text-[10px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans">
              {active.body.slice(0, deviceMode === 'mobile' ? 600 : 1200)}
              {active.body.length > (deviceMode === 'mobile' ? 600 : 1200) && '…'}
            </div>

            <button
              type="button"
              className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg cursor-default"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              {active.cta || taglineOrCTA || 'Call to action'}
            </button>
          </div>
        </div>
        <p className="text-center text-[9px] font-mono text-slate-500 mt-2">4:5 portrait frame · {deviceMode} viewport</p>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Subject optimizer</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-emerald-400">{subjectMetrics.score}</span>
            <span className="text-[10px] font-bold text-slate-300 mb-1">{subjectMetrics.label}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${subjectMetrics.score}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{active.subject.length} chars (ideal 30–55)</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Preview snippet</span>
          <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed">{active.previewText}</p>
          <p className="text-[9px] text-slate-500 mt-1">{active.previewText.length} chars (ideal 40–130)</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Tips
          </span>
          <ul className="text-[9px] text-slate-400 space-y-0.5 list-disc list-inside">
            {subjectMetrics.tips.length > 0 ? (
              subjectMetrics.tips.map((t, i) => <li key={i}>{t}</li>)
            ) : (
              <li>Subject length looks solid for deliverability.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
