/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { MarketingAssetType } from '../../types';
import { inferAssetTypeFromText } from '../../utils/calendarTasks';

interface GrowthOpportunityItemProps {
  text: string;
  fallbackType: MarketingAssetType;
  disabled?: boolean;
  onCreate: (type: MarketingAssetType, options?: { customRequirements?: string }) => void;
}

export default function GrowthOpportunityItem({
  text,
  fallbackType,
  disabled,
  onCreate,
}: GrowthOpportunityItemProps) {
  const assetType = inferAssetTypeFromText(text) ?? fallbackType;
  const brief = `Growth opportunity to address: ${text}`;

  return (
    <li className="text-xs text-blue-100 space-y-2">
      <div className="flex items-start gap-1.5">
        <span className="text-blue-400 shrink-0">→</span>
        <span>{text}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCreate(assetType, { customRequirements: brief })}
        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-4"
      >
        Create this →
      </button>
    </li>
  );
}
