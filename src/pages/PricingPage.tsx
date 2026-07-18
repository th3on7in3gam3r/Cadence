/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import CadencePricingSection from '../components/CadencePricingSection';
import MarketingSiteShell from '../components/marketing/MarketingSiteShell';
import JsonLd from '../components/seo/JsonLd';
import { buildCadenceSoftwareApplicationSchema } from '../data/structuredData';
import { useMarketingSite } from '../hooks/useMarketingSite';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../contexts/AuthContext';
import { PAGE_SEO } from '../lib/pageSeo';

export default function PricingPage() {
  const { cloudEnabled } = useAuth();
  const marketing = useMarketingSite();

  usePageMeta(PAGE_SEO['/pricing']);

  return (
    <MarketingSiteShell marketing={marketing}>
      <JsonLd data={buildCadenceSoftwareApplicationSchema()} />
      <CadencePricingSection
        cloudEnabled={cloudEnabled}
        onGetStarted={marketing.onTryFree}
      />
    </MarketingSiteShell>
  );
}
