/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRODUCT_NAME } from '../lib/brand';

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_BASE: FaqItem[] = [
  {
    q: 'Do I need a marketing team to use this?',
    a: `No. ${PRODUCT_NAME} is built for founders and small teams who want strategy and copy without hiring a full agency.`,
  },
  {
    q: 'Is this just ChatGPT with a form?',
    a: `No. ${PRODUCT_NAME} connects brand analysis, SEO crawling, five content generators (keywords, blog, social, email, and lead magnet), version history, and campaign export in one workspace — see the comparison table for how that differs from ChatGPT, Semrush, Jasper, and Buffer.`,
  },
  {
    q: 'Can I use it for GEO / AI search?',
    a: 'Yes. Keyword research, blog drafts, and the SEO Agent are designed for traditional SEO and generative engine visibility.',
  },
];

export function getStartedFaq(cloudEnabled?: boolean): FaqItem {
  return {
    q: 'What do I need to get started?',
    a: cloudEnabled
      ? 'Paste your website URL — try one free brand analysis instantly, no signup required. Create a free account to save your workspace, generate content, and run SEO audits (3/month on Free).'
      : 'A website URL and a Google Gemini API key. The app runs in your browser — your data stays in local storage.',
  };
}

export function buildFaqList(cloudEnabled?: boolean): FaqItem[] {
  return [FAQ_BASE[0], getStartedFaq(cloudEnabled), ...FAQ_BASE.slice(1)];
}
