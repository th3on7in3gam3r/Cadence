/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PulseEnableCard from '../PulseEnableCard';

interface PulseInstallPanelProps {
  brandUrl?: string;
}

export default function PulseInstallPanel({ brandUrl }: PulseInstallPanelProps) {
  return (
    <div className="space-y-2">
      <PulseEnableCard brandUrl={brandUrl} />
      <p className="text-[10px] text-slate-600 font-mono px-1">
        Read keys are generated server-side and synced to Pulse — never sold as a separate product.
      </p>
    </div>
  );
}
