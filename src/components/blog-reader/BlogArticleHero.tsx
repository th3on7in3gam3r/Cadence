/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock } from 'lucide-react';

export interface BlogArticleHeroProps {
  title: string;
  brandName: string;
  readMinutes: number;
  summary?: string;
}

export default function BlogArticleHero({
  title,
  brandName,
  readMinutes,
  summary,
}: BlogArticleHeroProps) {
  return (
    <header className="mb-8 md:mb-10">
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-4">
        <span className="text-slate-400">{brandName}</span>
        <span className="text-slate-700">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {readMinutes} min read
        </span>
        <span className="text-slate-700">·</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
          Blog
        </span>
      </div>
      <h1 className="text-[32px] md:text-[36px] font-extrabold text-white font-display tracking-tight leading-tight">
        {title || 'Untitled article'}
      </h1>
      {summary?.trim() && (
        <p className="mt-3 text-base text-slate-400 leading-relaxed max-w-2xl">{summary}</p>
      )}
    </header>
  );
}
