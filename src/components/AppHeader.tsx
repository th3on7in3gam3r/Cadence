/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BrainCircuit,
  Home,
  FolderKanban,
  Search,
  Layers,
  History,
  User,
  Sliders,
  Plus,
  Grid3X3,
  Menu,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AppView } from '../lib/appPaths';
import type { WebsiteAnalysis } from '../types';
import { PRODUCT_NAME, PRODUCT_TAGLINE, showGrowthStackUi } from '../lib/brand';
import BrandSwitcher from './BrandSwitcher';
import ProductSwitcher from './ProductSwitcher';
import NotificationCenter from './NotificationCenter';
import MobileNavDrawer, { MobileNavItem } from './MobileNavDrawer';

interface AppHeaderProps {
  activeView: AppView;
  brandAnalysis: WebsiteAnalysis | null;
  profileName: string;
  profileColor: string;
  cloudEnabled: boolean;
  user: SupabaseUser | null;
  onGoHome?: () => void;
  onLogoClick: () => void;
  onSignOut: () => void;
  onNewAudit: () => void;
  goTo: (view: AppView) => void;
}

const NAV_ITEMS: {
  view: AppView;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  matchViews?: AppView[];
}[] = [
  { view: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <FolderKanban className="w-3.5 h-3.5 shrink-0" />, matchViews: ['dashboard', 'workspace'] },
  { view: 'seo-agent', label: 'SEO Agent', shortLabel: 'SEO', icon: <Search className="w-3.5 h-3.5 shrink-0" /> },
  { view: 'campaign-history', label: 'Campaign History', shortLabel: 'History', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
  { view: 'studio', label: 'Studio', shortLabel: 'Studio', icon: <Grid3X3 className="w-3.5 h-3.5 shrink-0" /> },
  { view: 'history-scans', label: 'Document Scans', shortLabel: 'Scans', icon: <History className="w-3.5 h-3.5 shrink-0" /> },
  { view: 'profile', label: 'Marketer Profile', shortLabel: 'Profile', icon: <User className="w-3.5 h-3.5 shrink-0" /> },
  { view: 'settings', label: 'Settings', shortLabel: 'Settings', icon: <Sliders className="w-3.5 h-3.5 shrink-0" /> },
];

function isNavActive(activeView: AppView, item: (typeof NAV_ITEMS)[0]): boolean {
  if (item.matchViews) return item.matchViews.includes(activeView);
  return activeView === item.view;
}

export default function AppHeader({
  activeView,
  brandAnalysis,
  profileName,
  profileColor,
  cloudEnabled,
  user,
  onGoHome,
  onLogoClick,
  onSignOut,
  onNewAudit,
  goTo,
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showNav = activeView !== 'onboarding' && !!brandAnalysis;
  const stackUi = showGrowthStackUi();
  const navItems = stackUi ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.view !== 'studio');
  const closeMenu = () => setMobileMenuOpen(false);
  const goToView = (view: AppView) => {
    goTo(view);
    closeMenu();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur shadow-lg/10">
      {/* Row 1 — brand + actions (never overlaps) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onLogoClick}
            className="p-1.5 bg-slate-800 text-emerald-400 rounded-lg flex items-center justify-center border border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors shrink-0"
            title={onGoHome ? 'Back to homepage' : 'Dashboard'}
          >
            <BrainCircuit className="w-5 h-5" />
          </button>
          <div className="min-w-0 leading-tight">
            <span className="font-display font-extrabold text-sm sm:text-base text-white block truncate">
              {PRODUCT_NAME}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:block truncate">
              {PRODUCT_TAGLINE}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {cloudEnabled && user && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex text-[11px] font-bold text-slate-500 hover:text-red-400 px-2 py-1 cursor-pointer"
              title={user.email || 'Sign out'}
            >
              Sign out
            </button>
          )}
          <NotificationCenter />
          {showNav && (
            <button
              type="button"
              id="nav-new-audit-btn"
              onClick={onNewAudit}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New audit</span>
            </button>
          )}
          {showNav && (
            <>
              <button
                type="button"
                onClick={() => goTo('profile')}
                className="hidden sm:flex items-center gap-2 px-2 py-1.5 sm:px-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                title="Marketer profile"
              >
                <div className={`w-5 h-5 rounded bg-gradient-to-br ${profileColor} flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0`}>
                  {profileName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'CM'}
                </div>
                <span className="max-w-[88px] truncate hidden lg:inline text-slate-300">{profileName}</span>
              </button>
              <div className="hidden sm:block">
                <BrandSwitcher currentBrandName={brandAnalysis.brandName} />
              </div>
              {stackUi && (
                <div className="hidden sm:block">
                  <ProductSwitcher />
                </div>
              )}
            </>
          )}
          {showNav && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 cursor-pointer flex items-center justify-center touch-manipulation"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden />
        </div>
      </div>

      {/* Row 2 — tab navigation (large screens) */}
      {showNav && (
        <div className="hidden lg:block border-t border-slate-800/80 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
            <nav
              className="flex items-stretch gap-0.5 overflow-x-auto py-0 scrollbar-none -mb-px"
              aria-label="Workspace navigation"
            >
              {onGoHome && (
                <button
                  type="button"
                  id="nav-home-btn"
                  onClick={onGoHome}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Home</span>
                </button>
              )}
              {navItems.map((item) => {
                const active = isNavActive(activeView, item);
                return (
                  <button
                    key={item.view}
                    type="button"
                    id={`nav-${item.view}-btn`}
                    onClick={() => goTo(item.view)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 ${
                      active
                        ? 'border-emerald-500 text-white bg-slate-900/50'
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {showNav && (
        <MobileNavDrawer open={mobileMenuOpen} onClose={closeMenu} title={brandAnalysis?.brandName || 'Navigate'}>
          {onGoHome && (
            <MobileNavItem
              label="Marketing homepage"
              icon={<Home className="w-4 h-4" />}
              onClick={() => {
                closeMenu();
                onGoHome();
              }}
            />
          )}
          {navItems.map((item) => (
            <div key={item.view}>
              <MobileNavItem
                label={item.label}
                icon={item.icon}
                active={isNavActive(activeView, item)}
                onClick={() => goToView(item.view)}
              />
            </div>
          ))}
          <div className="border-t border-slate-800 my-2 pt-2 space-y-1">
            <MobileNavItem
              label="New audit"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                closeMenu();
                onNewAudit();
              }}
              variant="primary"
            />
            <MobileNavItem
              label="Marketer profile"
              icon={<User className="w-4 h-4" />}
              onClick={() => goToView('profile')}
            />
            {cloudEnabled && user && (
              <MobileNavItem
                label="Sign out"
                onClick={() => {
                  closeMenu();
                  onSignOut();
                }}
                variant="muted"
              />
            )}
          </div>
        </MobileNavDrawer>
      )}
    </header>
  );
}
