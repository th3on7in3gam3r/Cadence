/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONTENT_GENERATORS } from './landingGenerators';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, productPublicOrigin } from '../lib/brand';
import { PLAN_PRICES } from '../lib/plans';

/**
 * Schema.org SoftwareApplication for Cadence marketing pages.
 * No aggregateRating — testimonials are portfolio quotes, not verified reviews.
 */
export function buildCadenceSoftwareApplicationSchema(): Record<string, unknown> {
  const url = productPublicOrigin();

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: PRODUCT_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url,
    description: PRODUCT_SUBTITLE,
    featureList: CONTENT_GENERATORS.map((g) => g.label),
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        url: `${url}/pricing`,
      },
      {
        '@type': 'Offer',
        name: PLAN_PRICES.pro.label,
        price: String(PLAN_PRICES.pro.monthly),
        priceCurrency: 'USD',
        billingDuration: 'P1M',
        url: `${url}/pricing`,
      },
      {
        '@type': 'Offer',
        name: PLAN_PRICES.team.label,
        price: String(PLAN_PRICES.team.monthly),
        priceCurrency: 'USD',
        billingDuration: 'P1M',
        url: `${url}/pricing`,
      },
    ],
  };
}
