/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import GrowthStackPromoPage from '../../components/marketing/GrowthStackPromoPage';
import MarketingSectionPage from './MarketingSectionPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTryFree } from '../../hooks/useTryFree';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function GrowthStackPage() {
  const { cloudEnabled } = useAuth();
  const onTryFree = useTryFree();

  return (
    <MarketingSectionPage seo={PAGE_SEO['/growth-stack']}>
      <GrowthStackPromoPage cloudEnabled={cloudEnabled} onGetStarted={() => void onTryFree()} />
    </MarketingSectionPage>
  );
}
