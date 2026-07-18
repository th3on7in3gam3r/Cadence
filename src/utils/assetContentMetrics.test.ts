/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { contentCompletenessScore, getAssetContentMetrics } from './assetContentMetrics';

describe('assetContentMetrics', () => {
  it('scores completeness from filled fields and word count', () => {
    const score = contentCompletenessScore('blog_post', 'word '.repeat(400), {
      title: 'Title',
      summary: 'Summary',
      taglineOrCTA: 'CTA',
    });
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('returns factual metrics without forecast language', () => {
    const metrics = getAssetContentMetrics('social_posts', 'Hello world post copy', {
      title: 'Launch',
      summary: '',
      taglineOrCTA: 'Try now',
    });
    expect(metrics.headline).toBe('Word count');
    expect(metrics.details.some((d) => d.label === 'Word count')).toBe(true);
    expect(JSON.stringify(metrics)).not.toMatch(/forecast|projected|CTR/i);
  });

  it('returns empty-friendly keyword line count', () => {
    const metrics = getAssetContentMetrics('seo_keywords', '', {
      title: '',
      summary: '',
      taglineOrCTA: '',
    });
    expect(metrics.headlineValue).toBe('0');
    expect(metrics.completenessScore).toBe(0);
  });
});
