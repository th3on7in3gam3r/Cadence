/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Menu, Package } from 'lucide-react';
import MobileNavDrawer, { MobileNavItem } from '../MobileNavDrawer';
import NavDropdown from './NavDropdown';
import { PRODUCT_NAME, PRODUCT_TAGLINE, showGrowthStackUi } from '../../lib/brand';

interface LandingNavProps {
  cloudEnabled?: boolean;
  hasWorkspace?: boolean;
  onTryFree: () => void;
  onOpenWorkspace: () => void;
  onSignIn: () => void;
}

function navLinkClass(active: boolean) {
  return `px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
    active ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
  }`;
}

export default function LandingNav({
  cloudEnabled,
  hasWorkspace,
  onTryFree,
  onOpenWorkspace,
  onSignIn,
}: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const stackUi = showGrowthStackUi();

  const closeMenu = () => setMobileMenuOpen(false);

  const productItems = [
    { label: 'Features', description: 'Strategy, SEO, and content studio', to: '/features' },
    { label: 'How it works', description: 'URL to campaign in three steps', to: '/how-it-works' },
    { label: 'Compare tools', description: 'Cadence vs. ChatGPT, Semrush & more', to: '/compare' },
  ];

  const studioItems = stackUi
    ? [
        {
          label: 'App bundles',
          description: 'Growth Stack + Signal Desk Blog publish desk',
          to: '/growth-stack',
        },
        {
          label: 'Studio apps',
          description: 'All studio products & bundle pricing',
          to: '/studio',
        },
      ]
    : [
        {
          label: 'Growth stack',
          description: 'Studio apps + Signal Desk Blog publishing',
          to: '/growth-stack',
        },
      ];

  const studioActive = pathname === '/studio' || pathname === '/growth-stack';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-[1fr_auto] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-2.5 min-w-0 group w-fit">
              <div className="shrink-0 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-emerald-400 group-hover:border-slate-700 transition">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <span className="font-display font-bold text-white text-[15px] leading-none tracking-tight block truncate">
                  {PRODUCT_NAME}
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wide hidden md:block mt-0.5">
                  {PRODUCT_TAGLINE}
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center justify-center gap-0.5" aria-label="Primary">
              <NavDropdown label="Product" items={productItems} />
              <Link to="/pricing" className={navLinkClass(pathname === '/pricing')}>
                Pricing
              </Link>
              <NavDropdown label={stackUi ? 'Studio' : 'Stack'} items={studioItems} active={studioActive} />
              <Link to="/faq" className={navLinkClass(pathname === '/faq')}>
                FAQ
              </Link>
            </nav>

            <div className="flex items-center justify-end gap-1 sm:gap-2">
              {hasWorkspace && (
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  className="hidden lg:inline-flex px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Workspace
                </button>
              )}
              {cloudEnabled && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="hidden md:inline-flex px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              )}
              <button
                type="button"
                onClick={onTryFree}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-full transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Start free
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer flex items-center justify-center touch-manipulation"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer open={mobileMenuOpen} onClose={closeMenu} title={PRODUCT_NAME}>
        <p className="px-3 pt-1 pb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600">
          Product
        </p>
        <Link
          to="/features"
          onClick={closeMenu}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          Features
        </Link>
        <Link
          to="/how-it-works"
          onClick={closeMenu}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          How it works
        </Link>
        <Link
          to="/compare"
          onClick={closeMenu}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          Compare tools
        </Link>
        <Link
          to="/pricing"
          onClick={closeMenu}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          Pricing
        </Link>
        <Link
          to="/faq"
          onClick={closeMenu}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          FAQ
        </Link>

        <p className="px-3 pt-4 pb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600">
          {stackUi ? 'Studio' : 'Stack'}
        </p>
        {stackUi ? (
          <>
            <Link
              to="/growth-stack"
              onClick={closeMenu}
              className="w-full flex flex-col gap-0.5 px-3 py-3 rounded-xl text-left hover:bg-slate-800 cursor-pointer"
            >
              <span className="text-sm font-semibold text-slate-300 hover:text-white">App bundles</span>
              <span className="text-[10px] text-slate-500 leading-snug">Cadence + CitePilot — one subscription</span>
            </Link>
            <Link
              to="/studio"
              onClick={closeMenu}
              className={`w-full flex flex-col gap-0.5 px-3 py-3 rounded-xl text-left cursor-pointer ${
                pathname === '/studio' ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-300 hover:text-white">
                <Package className="w-4 h-4 shrink-0 opacity-90" />
                Studio apps
              </span>
              <span className="text-[10px] text-slate-500 pl-7 leading-snug">
                All studio products &amp; bundle pricing
              </span>
            </Link>
          </>
        ) : (
          <Link
            to="/growth-stack"
            onClick={closeMenu}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            Growth Stack
          </Link>
        )}

        <div className="border-t border-slate-800 my-3 pt-3 space-y-1">
          {hasWorkspace && (
            <MobileNavItem
              label="Open workspace"
              onClick={() => {
                closeMenu();
                onOpenWorkspace();
              }}
            />
          )}
          {cloudEnabled && (
            <MobileNavItem
              label="Sign in"
              onClick={() => {
                closeMenu();
                onSignIn();
              }}
              variant="muted"
            />
          )}
          <MobileNavItem
            label="Start free"
            onClick={() => {
              closeMenu();
              onTryFree();
            }}
            variant="primary"
            icon={<ArrowRight className="w-4 h-4" />}
          />
        </div>
      </MobileNavDrawer>
    </>
  );
}
