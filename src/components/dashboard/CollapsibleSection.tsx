/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left cursor-pointer hover:bg-slate-850/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3 min-w-0">
          {icon && <span className="text-slate-400 shrink-0 mt-0.5">{icon}</span>}
          <div className="min-w-0">
            <h3 className="text-base font-display font-bold text-white">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 md:px-5 pb-5 pt-0 border-t border-slate-800/80">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </section>
  );
}
