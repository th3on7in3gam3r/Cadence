/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import GrowthStackCta from '../../components/GrowthStackCta';
import MarketingSectionPage from './MarketingSectionPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTryFree } from '../../hooks/useTryFree';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function GrowthStackPage() {
  const { cloudEnabled } = useAuth();
  const onTryFree = useTryFree();

  return (
    <MarketingSectionPage seo={PAGE_SEO['/growth-stack']}>
      <GrowthStackCta cloudEnabled={cloudEnabled} onGetStarted={() => void onTryFree()} />
    </MarketingSectionPage>
  );
}
