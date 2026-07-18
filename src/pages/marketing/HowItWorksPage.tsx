/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LandingHowItWorksSection from '../../components/landing/LandingHowItWorksSection';
import MarketingSectionPage from './MarketingSectionPage';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function HowItWorksPage() {
  return (
    <MarketingSectionPage seo={PAGE_SEO['/how-it-works']}>
      <LandingHowItWorksSection />
    </MarketingSectionPage>
  );
}
