/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LandingNav from '../landing/LandingNav';
import MarketingFooter from '../MarketingFooter';
import type { MarketingSiteHandlers } from '../../hooks/useMarketingSite';

interface MarketingSiteShellProps {
  children: React.ReactNode;
  marketing: MarketingSiteHandlers;
  /** Override footer scroll (e.g. landing page in-page scroll). */
  footerScrollTo?: (id: string) => void;
}

export default function MarketingSiteShell({
  children,
  marketing,
  footerScrollTo,
}: MarketingSiteShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <LandingNav
        cloudEnabled={marketing.cloudEnabled}
        hasWorkspace={marketing.hasWorkspace}
        onTryFree={marketing.onTryFree}
        onOpenWorkspace={marketing.onOpenWorkspace}
        onSignIn={marketing.onSignIn}
      />
      <main id="main-content">{children}</main>
      <MarketingFooter
        onScrollTo={footerScrollTo ?? marketing.scrollToSection}
        onGetStarted={marketing.onTryFree}
      />
    </div>
  );
}
