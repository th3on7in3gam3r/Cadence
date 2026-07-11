/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Menu'}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute top-0 right-0 z-10 flex h-dvh max-h-dvh w-[min(100vw,20rem)] flex-col bg-slate-900 border-l border-slate-800 shadow-2xl mobile-nav-drawer-panel">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 shrink-0">
          <span className="text-sm font-bold text-white">{title || 'Menu'}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1">{children}</nav>
      </div>
    </div>,
    document.body,
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
    'w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer touch-manipulation';
  const styles =
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'
      : variant === 'muted'
        ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
        : active
          ? 'bg-slate-800 text-white border border-emerald-500/40'
          : 'text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700';

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {icon && <span className="shrink-0 opacity-90">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
