/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ExternalLink,
  KeyRound,
  Search,
  Share2,
  Shield,
} from 'lucide-react';
import {
  loadGrowthStackSettings,
  saveGrowthStackSettings,
  type GrowthStackSettings,
} from '../../utils/growthStackSettings';
import { GROWTH_STACK_PRODUCTS } from '../../lib/growthStack';

type ProductKeyId = keyof GrowthStackSettings;

type SisterProductKey = 'citePilot' | 'kerygma' | 'aegis';

const PRODUCT_KEY_FIELDS: {
  id: ProductKeyId;
  productKey: SisterProductKey;
  icon: React.ReactNode;
  iconColor: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    id: 'citePilotApiKey',
    productKey: 'citePilot',
    icon: <Search className="w-4 h-4" />,
    iconColor: 'text-cyan-400',
    placeholder: 'Fleet API key from getcitepilot.com',
    hint: 'Leave blank to use the public citation audit for your brand domain.',
  },
  {
    id: 'kerygmaApiKey',
    productKey: 'kerygma',
    icon: <Share2 className="w-4 h-4" />,
    iconColor: 'text-violet-400',
    placeholder: 'API key from kerygmasocial.com',
    hint: 'Optional — stored for upcoming publish integrations. Social posting still happens in Kerygma.',
  },
  {
    id: 'aegisApiKey',
    productKey: 'aegis',
    icon: <Shield className="w-4 h-4" />,
    iconColor: 'text-rose-400',
    placeholder: 'API key from aegis-loop.com',
    hint: 'Optional — unlocks deeper scans in SEO Agent when Aegis partner API is available.',
  },
];

export default function GrowthStackIntegrationsPanel() {
  const [keys, setKeys] = useState<GrowthStackSettings>({
    citePilotApiKey: '',
    kerygmaApiKey: '',
    aegisApiKey: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(loadGrowthStackSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGrowthStackSettings({
      citePilotApiKey: keys.citePilotApiKey.trim(),
      kerygmaApiKey: keys.kerygmaApiKey.trim(),
      aegisApiKey: keys.aegisApiKey.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateKey = (id: ProductKeyId, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          Growth stack API keys
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
          Paste optional keys from each sister product below. Saved in this browser only — not your
          Cadence account settings. Pulse is handled in the section above (no key to paste).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {PRODUCT_KEY_FIELDS.map((field) => {
          const product = GROWTH_STACK_PRODUCTS[field.productKey];
          return (
            <div
              key={field.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={field.iconColor}>{field.icon}</span>
                  <span className="text-sm font-bold text-white">{product.name}</span>
                </div>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 shrink-0"
                >
                  Open {product.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[10px] text-slate-500">{product.tagline}</p>
              <input
                type="password"
                autoComplete="off"
                value={keys[field.id]}
                onChange={(e) => updateKey(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono"
                aria-label={`${product.name} API key`}
              />
              <p className="text-[10px] text-slate-600">{field.hint}</p>
            </div>
          );
        })}

        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex gap-3">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white">{GROWTH_STACK_PRODUCTS.pulse.name}</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              No key field here — use <strong className="text-slate-400">Enable Pulse for this brand</strong>{' '}
              above. Cadence creates the site ID and read key for you, then shows the install snippet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg cursor-pointer"
          >
            Save growth stack keys
          </button>
          {saved && (
            <span className="text-xs text-emerald-400">CitePilot, Kerygma &amp; Aegis keys saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
