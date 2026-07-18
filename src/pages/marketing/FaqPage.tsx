/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LandingFaqSection from '../../components/landing/LandingFaqSection';
import MarketingSectionPage from './MarketingSectionPage';
import { useAuth } from '../../contexts/AuthContext';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function FaqPage() {
  const { cloudEnabled } = useAuth();

  return (
    <MarketingSectionPage seo={PAGE_SEO['/faq']}>
      <LandingFaqSection cloudEnabled={cloudEnabled} />
    </MarketingSectionPage>
  );
}
