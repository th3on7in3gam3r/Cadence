/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Minus } from 'lucide-react';
import {
  COMPARISON_COLUMNS,
  COMPARISON_FOOTNOTE,
  COMPARISON_ROWS,
  type ComparisonCell,
} from '../data/landingComparison';
import { PRODUCT_NAME } from '../lib/brand';

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex items-center justify-center text-emerald-400" aria-label="Yes">
        <Check className="w-4 h-4" />
      </span>
    );
  }
  if (value === 'partial') {
    return <span className="text-[11px] font-medium text-slate-400">Partial</span>;
  }
  return (
    <span className="inline-flex items-center justify-center text-slate-600" aria-label="No">
      <Minus className="w-4 h-4" />
    </span>
  );
}

export default function LandingStackComparison() {
  return (
    <section
      id="compare"
      className="py-20 md:py-28 border-b border-slate-800 bg-slate-950 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">
            One workspace instead of five subscriptions
          </h2>
          <p className="mt-4 text-slate-400">
            {PRODUCT_NAME} replaces the patchwork of ChatGPT + Semrush + Jasper + Buffer — strategy,
            SEO, and copy in one place, without juggling five different tools.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 pr-4 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-normal">
                  Capability
                </th>
                {COMPARISON_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className={`py-3 px-2 text-center text-xs font-bold ${
                      col.id === 'cadence' ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.capability} className="border-b border-slate-800/80">
                  <td className="py-3.5 pr-4 text-slate-300 font-medium">{row.capability}</td>
                  <td className="py-3.5 px-2 text-center bg-emerald-950/20">
                    <CellValue value={row.cadence} />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <CellValue value={row.chatgpt} />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <CellValue value={row.semrush} />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <CellValue value={row.jasper} />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <CellValue value={row.buffer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600 italic">{COMPARISON_FOOTNOTE}</p>
      </div>
    </section>
  );
}
