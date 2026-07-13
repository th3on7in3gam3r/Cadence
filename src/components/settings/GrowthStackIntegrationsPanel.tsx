/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Shield, Search, Loader2 } from 'lucide-react';
import {
  loadGrowthStackSettings,
  saveGrowthStackSettings,
} from '../../utils/growthStackSettings';
import { GROWTH_STACK_PRODUCTS } from '../../lib/growthStack';

export default function GrowthStackIntegrationsPanel() {
  const [citePilotApiKey, setCitePilotApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadGrowthStackSettings();
    setCitePilotApiKey(s.citePilotApiKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGrowthStackSettings({
      citePilotApiKey: citePilotApiKey.trim(),
      aegisApiUrl: '',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          Growth stack (CitePilot &amp; Aegis)
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
          Pull AI citation scores and lightweight security header checks into SEO Agent and your
          dashboard. CitePilot works without a key when a public audit exists; paste a Fleet API key
          below only if you need private workspace data from CitePilot.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4"
      >
        <div>
          <label
            htmlFor="citepilot-api-key"
            className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            CitePilot API key (optional)
          </label>
          <input
            id="citepilot-api-key"
            type="password"
            autoComplete="off"
            value={citePilotApiKey}
            onChange={(e) => setCitePilotApiKey(e.target.value)}
            placeholder="Fleet API key from getcitepilot.com"
            className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            Saved in this browser only. Leave blank to use the latest public citation audit for your
            brand domain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg cursor-pointer"
          >
            Save CitePilot key
          </button>
          {saved && <span className="text-xs text-emerald-400">CitePilot key saved</span>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <a
          href={GROWTH_STACK_PRODUCTS.citePilot.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          Run a free audit on CitePilot
          <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
        </a>
        <a
          href={GROWTH_STACK_PRODUCTS.aegis.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <Shield className="w-4 h-4 text-violet-400 shrink-0" />
          Full security scanning in Aegis Loop
          <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
        </a>
      </div>
    </div>
  );
}
