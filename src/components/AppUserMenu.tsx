/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, HelpCircle, LogOut, Sliders, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AppView } from '../lib/appPaths';

interface AppUserMenuProps {
  profileName: string;
  profileColor: string;
  cloudEnabled: boolean;
  user: SupabaseUser | null;
  activeView: AppView;
  goTo: (view: AppView) => void;
  onSignOut: () => void;
}

const USER_MENU_ITEMS: {
  view: AppView;
  label: string;
  icon: React.ReactNode;
  id: string;
}[] = [
  {
    view: 'profile',
    label: 'Marketer Profile',
    icon: <User className="w-4 h-4 shrink-0" />,
    id: 'nav-profile-btn',
  },
  {
    view: 'settings',
    label: 'Settings',
    icon: <Sliders className="w-4 h-4 shrink-0" />,
    id: 'nav-settings-btn',
  },
  {
    view: 'help',
    label: 'Help',
    icon: <HelpCircle className="w-4 h-4 shrink-0" />,
    id: 'nav-help-btn',
  },
];

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CM'
  );
}

export default function AppUserMenu({
  profileName,
  profileColor,
  cloudEnabled,
  user,
  activeView,
  goTo,
  onSignOut,
}: AppUserMenuProps) {
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
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        className="flex items-center gap-2 px-2 py-1.5 sm:px-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        title="Account menu"
      >
        <div
          className={`w-5 h-5 rounded bg-gradient-to-br ${profileColor} flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0`}
        >
          {initials(profileName)}
        </div>
        <span className="max-w-[88px] truncate hidden lg:inline text-slate-300">{profileName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-50"
        >
          <div className="px-3 py-2.5 border-b border-slate-800">
            <p className="text-sm font-semibold text-white truncate">{profileName}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {cloudEnabled && user?.email ? user.email : 'Local workspace'}
            </p>
          </div>

          {USER_MENU_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              id={item.id}
              role="menuitem"
              onClick={() => {
                goTo(item.view);
                close();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                activeView === item.view
                  ? 'text-white bg-slate-800/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {cloudEnabled && user && (
            <>
              <div className="my-1 border-t border-slate-800" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSignOut();
                  close();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { USER_MENU_ITEMS };
