/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ComparisonCell = 'yes' | 'partial' | 'no';

export interface ComparisonRow {
  capability: string;
  cadence: ComparisonCell;
  chatgpt: ComparisonCell;
  semrush: ComparisonCell;
  jasper: ComparisonCell;
  buffer: ComparisonCell;
}

export const COMPARISON_COLUMNS = [
  { id: 'cadence', label: 'Cadence' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'semrush', label: 'Semrush' },
  { id: 'jasper', label: 'Jasper' },
  { id: 'buffer', label: 'Buffer' },
] as const;

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    capability: 'Brand strategy from your URL',
    cadence: 'yes',
    chatgpt: 'partial',
    semrush: 'no',
    jasper: 'no',
    buffer: 'no',
  },
  {
    capability: 'SEO site crawl & audit',
    cadence: 'yes',
    chatgpt: 'no',
    semrush: 'yes',
    jasper: 'no',
    buffer: 'no',
  },
  {
    capability: 'Blog, social, email, keywords & lead magnet',
    cadence: 'yes',
    chatgpt: 'partial',
    semrush: 'no',
    jasper: 'partial',
    buffer: 'partial',
  },
  {
    capability: 'Campaign version history & ZIP export',
    cadence: 'yes',
    chatgpt: 'no',
    semrush: 'no',
    jasper: 'no',
    buffer: 'no',
  },
  {
    capability: 'Single workspace for strategy + SEO + copy',
    cadence: 'yes',
    chatgpt: 'no',
    semrush: 'no',
    jasper: 'no',
    buffer: 'no',
  },
];

export const COMPARISON_FOOTNOTE =
  'Comparison reflects typical solo-founder stacks; individual tools vary by plan.';
