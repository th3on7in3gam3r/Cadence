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
  Plus,
  Grid3X3,
  Menu,
  LogOut,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AppView } from '../lib/appPaths';
import type { WebsiteAnalysis } from '../types';
import { PRODUCT_NAME, PRODUCT_TAGLINE, showGrowthStackUi } from '../lib/brand';
import BrandSwitcher from './BrandSwitcher';
import ProductSwitcher from './ProductSwitcher';
import NotificationCenter from './NotificationCenter';
import AppUserMenu, { USER_MENU_ITEMS } from './AppUserMenu';
import MobileNavDrawer, { MobileNavItem } from './MobileNavDrawer';

interface AppHeaderProps {
  activeView: AppView;
  brandAnalysis: WebsiteAnalysis | null;
  brandUrl?: string;
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

type NavItem = {
  view: AppView;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  matchViews?: AppView[];
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    view: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: <FolderKanban className="w-3.5 h-3.5 shrink-0" />,
    matchViews: ['dashboard', 'workspace'],
  },
  { view: 'seo-agent', label: 'SEO Agent', shortLabel: 'SEO', icon: <Search className="w-3.5 h-3.5 shrink-0" /> },
  {
    view: 'campaign-history',
    label: 'Campaign History',
    shortLabel: 'History',
    icon: <Layers className="w-3.5 h-3.5 shrink-0" />,
  },
  { view: 'studio', label: 'Studio', shortLabel: 'Studio', icon: <Grid3X3 className="w-3.5 h-3.5 shrink-0" /> },
  {
    view: 'history-scans',
    label: 'Document Scans',
    shortLabel: 'Scans',
    icon: <History className="w-3.5 h-3.5 shrink-0" />,
  },
];

function isNavActive(activeView: AppView, item: NavItem): boolean {
  if (item.matchViews) return item.matchViews.includes(activeView);
  return activeView === item.view;
}

export default function AppHeader({
  activeView,
  brandAnalysis,
  brandUrl,
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
  const showNav = activeView !== 'onboarding' && (!!brandAnalysis || activeView === 'help');
  const stackUi = showGrowthStackUi();
  const primaryNavItems = stackUi
    ? PRIMARY_NAV_ITEMS
    : PRIMARY_NAV_ITEMS.filter((item) => item.view !== 'studio');
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
              <div className="hidden sm:block">
                <BrandSwitcher
                  currentBrandName={brandAnalysis?.brandName}
                  brandUrl={brandUrl}
                  onViewCampaignHistory={() => goTo('campaign-history')}
                />
              </div>
              {stackUi && (
                <div className="hidden sm:block">
                  <ProductSwitcher />
                </div>
              )}
              <AppUserMenu
                profileName={profileName}
                profileColor={profileColor}
                cloudEnabled={cloudEnabled}
                user={user}
                activeView={activeView}
                goTo={goTo}
                onSignOut={onSignOut}
              />
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
              {primaryNavItems.map((item) => {
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
          {primaryNavItems.map((item) => (
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
            {USER_MENU_ITEMS.map((item) => (
              <div key={item.view}>
                <MobileNavItem
                  label={item.label}
                  icon={item.icon}
                  active={activeView === item.view}
                  onClick={() => goToView(item.view)}
                />
              </div>
            ))}
            {cloudEnabled && user && (
              <MobileNavItem
                label="Sign out"
                icon={<LogOut className="w-4 h-4" />}
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
