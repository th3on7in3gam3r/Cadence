/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface FormatMarkdownProps {
  text: string;
  highlightKeywords?: boolean;
  activeKeywords?: string[];
  enableHeatmap?: boolean;
}

export default function FormatMarkdown({ text, highlightKeywords = false, activeKeywords = [], enableHeatmap = false }: FormatMarkdownProps) {
  if (!text) return null;
  const lines = text.split('\n');

  // Helper with regex to highlight target keywords whilst keeping casing of matching keyword
  const renderSpanWithKeywords = (txtRaw: string) => {
    if (!highlightKeywords || activeKeywords.length === 0) {
      return txtRaw;
    }
    const escaped = activeKeywords
      .filter(k => k.trim().length > 1)
      .map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    if (escaped.length === 0) return txtRaw;

    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const parts = txtRaw.split(regex);
    return (
      <>
        {parts.map((p, i) => {
          const isMatch = activeKeywords.some(k => k.toLowerCase() === p.toLowerCase());
          return isMatch ? (
            <mark key={i} className="bg-amber-500/25 text-amber-300 font-bold px-1 rounded border border-amber-600/35 inline-block">
              {p}
            </mark>
          ) : (
            p
          );
        })}
      </>
    );
  };

  // Helper to split a plain or bold segment of text and highlight keywords
  const renderInlineFormats = (rawLine: string) => {
    const boldParts = rawLine.split(/\*\*([\s\S]*?)\*\*/g);
    if (boldParts.length > 1) {
      return (
        <>
          {boldParts.map((part, pIdx) => (
            pIdx % 2 === 1 ? (
              <strong key={pIdx} className="text-white font-extrabold bg-slate-900/40 px-0.5 rounded">
                {renderSpanWithKeywords(part)}
              </strong>
            ) : (
              renderSpanWithKeywords(part)
            )
          ))}
        </>
      );
    }
    return renderSpanWithKeywords(rawLine);
  };

  // Estimate Flesch score & readability style per line/block
  const getLineReadabilityStyle = (lineText: string) => {
    if (!enableHeatmap || !lineText.trim() || lineText.startsWith('#')) {
      return { className: '', label: null };
    }
    const words = lineText.split(/\s+/).filter(w => w.trim().length > 0);
    // Short lines of text are highly conversational
    if (words.length < 5) {
      return { 
        className: 'bg-emerald-950/25 border-l-4 border-emerald-500/60 p-2.5 rounded-r shadow-xs my-1 block transition-all hover:bg-emerald-950/30 text-emerald-300', 
        label: 'Conversational Reading Score: ~95 (Fluid/Accessible)'
      };
    }
    
    let syllables = 0;
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      let count = clean.replace(/[^aeiouy]/g, '').length;
      if (clean.endsWith('e')) count--;
      if (count <= 0) count = 1;
      syllables += count;
    });

    const score = 206.835 - 1.015 * words.length - 84.6 * (syllables / words.length);
    const roundedScore = Math.max(0, Math.min(100, Math.round(score)));

    if (roundedScore >= 60) {
      return {
        className: 'bg-emerald-950/20 border-l-4 border-emerald-500/60 p-2.5 rounded-r shadow-xs my-1 block transition-all hover:bg-emerald-950/30 text-emerald-350',
        label: `Fluid & High Clarity - Flesch Score: ${roundedScore}/100`
      };
    } else if (roundedScore >= 40) {
      return {
        className: 'bg-slate-900 border-l-4 border-slate-700 p-2.5 rounded-r shadow-xs my-1 block transition-all hover:bg-slate-850/60 text-slate-300',
        label: `Normal / Standard Complexity - Flesch Score: ${roundedScore}/100`
      };
    } else {
      return {
        className: 'bg-rose-955/20 border-l-4 border-rose-500/70 p-2.5 rounded-r shadow-xs my-1 block transition-all hover:bg-rose-950/30 text-rose-300',
        label: `Alert: Highly Academic/Difficult Segment - Flesch Score: ${roundedScore}/100 (Consider simplifying)`
      };
    }
  };

  return (
    <div className="space-y-4 font-sans text-sm md:text-base text-slate-350 leading-relaxed max-w-full min-w-0 break-words">
      {enableHeatmap && (
        <div className="bg-slate-950 p-2.5 text-[10px] font-mono text-slate-400 border border-slate-800 rounded-xl flex items-center justify-between gap-1 select-none flex-wrap sticky top-14 z-10 bg-slate-950/90 backdrop-blur-md">
          <span className="font-bold text-amber-500 flex items-center gap-1">📊 Readability Heatmap Legend:</span>
          <div className="flex gap-2 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/70 block"></span> High Ease (Conversational)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-600 block"></span> Standard</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-700 block"></span> High Difficulty</span>
          </div>
        </div>
      )}
      
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const heatmapInfo = getLineReadabilityStyle(line);
        
        // Headers H1
        if (trimmed.startsWith('# ')) {
          return (
            <div key={idx} className={heatmapInfo.className}>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white mt-6 mb-2 tracking-tight">
                {renderSpanWithKeywords(trimmed.substring(2))}
              </h1>
              {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
            </div>
          );
        }
        // Headers H2
        if (trimmed.startsWith('## ')) {
          return (
            <div key={idx} className={heatmapInfo.className}>
              <h2 className="text-lg md:text-xl font-display font-extrabold text-white mt-5 mb-2 border-b border-slate-800 pb-1">
                {renderSpanWithKeywords(trimmed.substring(3))}
              </h2>
              {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
            </div>
          );
        }
        // Headers H3
        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} className={heatmapInfo.className}>
              <h3 className="text-base md:text-lg font-display font-bold text-white mt-4 mb-2">
                {renderSpanWithKeywords(trimmed.substring(4))}
              </h3>
              {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
            </div>
          );
        }
        // Bold list items/bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          const boldMatch = content.match(/^\*\*(.*?)\*\*(.*)/);
          if (boldMatch) {
            return (
              <div key={idx} className={heatmapInfo.className}>
                <ul className="list-none pl-4 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-1 text-xs">■</span>
                    <span>
                      <strong className="text-white font-bold">{renderSpanWithKeywords(boldMatch[1])}</strong>
                      {renderInlineFormats(boldMatch[2])}
                    </span>
                  </li>
                </ul>
                {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
              </div>
            );
          }
          return (
            <div key={idx} className={heatmapInfo.className}>
              <ul className="list-disc pl-5 my-1 text-slate-300">
                <li>{renderInlineFormats(content)}</li>
              </ul>
              {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
            </div>
          );
        }
        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className={heatmapInfo.className}>
              <ol className="list-none pl-4 space-y-1 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-xs mt-1 shrink-0">{numMatch[1]}.</span>
                  <span>{renderInlineFormats(numMatch[2])}</span>
                </li>
              </ol>
              {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
            </div>
          );
        }
        
        // Empty lines
        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        return (
          <div key={idx} className={heatmapInfo.className}>
            <p className="leading-relaxed text-slate-300">
              {renderInlineFormats(line)}
            </p>
            {heatmapInfo.label && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{heatmapInfo.label}</div>}
          </div>
        );
      })}
    </div>
  );
}