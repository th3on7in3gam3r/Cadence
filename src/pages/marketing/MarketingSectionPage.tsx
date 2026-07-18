/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import MarketingSiteShell from '../../components/marketing/MarketingSiteShell';
import { useMarketingSite } from '../../hooks/useMarketingSite';
import { usePageMeta } from '../../hooks/usePageMeta';
import type { PageSeoConfig } from '../../lib/pageSeo';

interface MarketingSectionPageProps {
  seo: PageSeoConfig;
  children: React.ReactNode;
}

export default function MarketingSectionPage({ seo, children }: MarketingSectionPageProps) {
  const marketing = useMarketingSite();
  usePageMeta(seo);

  return <MarketingSiteShell marketing={marketing}>{children}</MarketingSiteShell>;
}
