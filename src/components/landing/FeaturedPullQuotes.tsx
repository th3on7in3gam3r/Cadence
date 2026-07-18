/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FEATURED_TESTIMONIALS, type LandingTestimonial } from '../../data/landingSocialProof';
import StarRating from './StarRating';

function PullQuote({ item }: { item: LandingTestimonial }) {
  const text = item.pullQuote ?? item.quote;

  return (
    <blockquote className="border-l-2 border-emerald-500/40 pl-4 md:pl-5">
      <StarRating rating={item.rating} className="mb-2" />
      <p className="text-sm text-slate-300 leading-relaxed">&ldquo;{text}&rdquo;</p>
      <footer className="mt-2.5">
        <p className="text-xs font-semibold text-white">{item.name}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {item.role}, {item.company}
        </p>
      </footer>
    </blockquote>
  );
}

export default function FeaturedPullQuotes() {
  if (FEATURED_TESTIMONIALS.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-5 md:gap-6">
      {FEATURED_TESTIMONIALS.map((item) => (
        <div key={`${item.company}-${item.name}`}>
          <PullQuote item={item} />
        </div>
      ))}
    </div>
  );
}
