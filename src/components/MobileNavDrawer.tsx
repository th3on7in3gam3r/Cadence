/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function MobileNavDrawer({ open, onClose, title, children }: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label={title || 'Menu'}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute top-0 right-0 h-full w-[min(100%,20rem)] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 shrink-0">
          <span className="text-sm font-bold text-white">{title || 'Menu'}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">{children}</nav>
      </div>
    </div>
  );
}

interface MobileNavItemProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'primary' | 'muted';
}

export function MobileNavItem({
  label,
  onClick,
  icon,
  active,
  variant = 'default',
}: MobileNavItemProps) {
  const base =
    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer';
  const styles =
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
      : variant === 'muted'
        ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
        : active
          ? 'bg-slate-800 text-white border border-emerald-500/40'
          : 'text-slate-300 hover:text-white hover:bg-slate-800';

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {icon && <span className="shrink-0 opacity-90">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
