/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MarketingAssetType } from '../types';

export interface ContentGenerator {
  id: MarketingAssetType;
  label: string;
  short: string;
}

export const CONTENT_GENERATORS: ContentGenerator[] = [
  { id: 'seo_keywords', label: 'SEO keywords', short: 'Keyword plan' },
  { id: 'blog_post', label: 'Blog post', short: 'Blog article' },
  { id: 'social_posts', label: 'Social posts', short: 'Social posts' },
  { id: 'email_sequence', label: 'Email sequence', short: 'Email series' },
  { id: 'lead_magnet', label: 'Lead magnet', short: 'Free download offer' },
];

/** Compact list for stats bar subline */
export const GENERATOR_STATS_SUBLINE = 'Keywords · Blog · Social · Email · Lead magnet';

export const CONTENT_STUDIO_CALLOUT =
  'Keyword plan, blog post, social posts, email sequence, and lead magnet — generated from your brand strategy.';
