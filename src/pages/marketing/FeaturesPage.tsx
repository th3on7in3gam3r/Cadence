/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LandingFeaturesSection from '../../components/landing/LandingFeaturesSection';
import MarketingSectionPage from './MarketingSectionPage';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function FeaturesPage() {
  return (
    <MarketingSectionPage seo={PAGE_SEO['/features']}>
      <LandingFeaturesSection />
    </MarketingSectionPage>
  );
}
