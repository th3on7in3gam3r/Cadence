/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LandingStackComparison from '../../components/LandingStackComparison';
import MarketingSectionPage from './MarketingSectionPage';
import { PAGE_SEO } from '../../lib/pageSeo';

export default function ComparePage() {
  return (
    <MarketingSectionPage seo={PAGE_SEO['/compare']}>
      <LandingStackComparison />
    </MarketingSectionPage>
  );
}
