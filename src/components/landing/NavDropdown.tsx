/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export interface NavDropdownItem {
  label: string;
  description?: string;
  onClick?: () => void;
  to?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
}

export default function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
          open ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
        }`}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          className="absolute left-0 top-full mt-2 min-w-[15rem] py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-50"
        >
          {items.map((item) => {
            const className =
              'block w-full text-left px-3 py-2.5 mx-1 max-w-[calc(100%-0.5rem)] rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer';

            const content = (
              <>
                <span className="block text-[13px] font-medium text-slate-200">{item.label}</span>
                {item.description && (
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{item.description}</span>
                )}
              </>
            );

            if (item.to) {
              return (
                <Link key={item.label} to={item.to} role="menuitem" className={className} onClick={close}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  item.onClick?.();
                  close();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
