/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface BlogArticleCtaProps {
  cta: string;
  ctaUrl?: string;
}

export default function BlogArticleCta({ cta, ctaUrl }: BlogArticleCtaProps) {
  const label = cta?.trim();
  if (!label) return null;

  return (
    <div className="mt-12 lg:mt-16 p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/30 text-center">
      <p className="text-lg md:text-xl font-display font-bold text-white mb-4">{label}</p>
      {ctaUrl ? (
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
        >
          Learn more
          <ArrowRight className="w-4 h-4" />
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600/80 text-white font-bold rounded-xl cursor-default">
          Your CTA
          <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
