/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, List } from 'lucide-react';
import type { MarkdownHeading } from '../../utils/markdownToc';

const NUMBER_BADGES = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

export interface BlogTableOfContentsProps {
  headings: MarkdownHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  /** Mobile accordion mode */
  collapsible?: boolean;
}

export default function BlogTableOfContents({
  headings,
  activeId,
  onNavigate,
  collapsible = false,
}: BlogTableOfContentsProps) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  const list = (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {headings.map((h, i) => {
          const isActive = activeId === h.id;
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onNavigate(h.id)}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span className="shrink-0 text-emerald-400 font-mono text-xs mt-0.5">
                  {NUMBER_BADGES[i] ?? `${i + 1}.`}
                </span>
                <span className="line-clamp-2 leading-snug">{h.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (collapsible) {
    return (
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <List className="w-4 h-4 text-emerald-400" />
            Jump to section
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && <div className="px-2 pb-3 border-t border-slate-800 pt-2">{list}</div>}
      </div>
    );
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <h2 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          <List className="w-3.5 h-3.5 text-emerald-400" />
          Table of Contents
        </h2>
        {list}
      </div>
    </aside>
  );
}
