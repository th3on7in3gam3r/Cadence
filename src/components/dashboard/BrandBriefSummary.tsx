/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

interface BrandBriefSummaryProps {
  summary: string;
}

function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  if (!parts?.length) return [trimmed];
  return parts.map((s) => s.trim()).filter(Boolean);
}

export default function BrandBriefSummary({ summary }: BrandBriefSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const sentences = useMemo(() => splitSentences(summary), [summary]);
  const canExpand = sentences.length > 2;

  const displayText = expanded || !canExpand ? summary : `${sentences.slice(0, 2).join(' ')}…`;

  return (
    <div className="text-sm md:text-base text-slate-300 leading-relaxed font-sans mb-5">
      <p>{displayText}</p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read full brand brief'}
        </button>
      )}
    </div>
  );
}
