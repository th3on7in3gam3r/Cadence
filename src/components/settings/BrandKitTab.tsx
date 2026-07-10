/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Bell, Save, Sparkles } from 'lucide-react';
import { BrandKit } from '../../types';
import { defaultBrandKit, loadBrandKit, saveBrandKit } from '../../utils/brandKit';

export default function BrandKitTab() {
  const [kit, setKit] = useState<BrandKit>(() => loadBrandKit());
  const [saved, setSaved] = useState(false);
  const [bannedInput, setBannedInput] = useState(() => loadBrandKit().bannedPhrases.join(', '));

  useEffect(() => {
    const onUpdate = () => setKit(loadBrandKit());
    window.addEventListener('brand_kit_updated', onUpdate);
    return () => window.removeEventListener('brand_kit_updated', onUpdate);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const next: BrandKit = {
      ...kit,
      bannedPhrases: bannedInput.split(',').map((s) => s.trim()).filter(Boolean),
    };
    saveBrandKit(next);
    setKit(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        Injected into every AI generation — voice, CTAs, colors, and legal footer.
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Voice rules</label>
        <textarea
          value={kit.voiceRules}
          onChange={(e) => setKit((k) => ({ ...k, voiceRules: e.target.value }))}
          rows={3}
          placeholder="e.g. Short sentences. No jargon. Always lead with customer pain."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Banned words & phrases</label>
        <input
          value={bannedInput}
          onChange={(e) => setBannedInput(e.target.value)}
          placeholder="synergy, leverage, game-changer (comma-separated)"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Boilerplate CTA</label>
        <input
          value={kit.boilerplateCta}
          onChange={(e) => setKit((k) => ({ ...k, boilerplateCta: e.target.value }))}
          placeholder="Start your free trial →"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Legal footer</label>
        <textarea
          value={kit.legalFooter}
          onChange={(e) => setKit((k) => ({ ...k, legalFooter: e.target.value }))}
          rows={2}
          placeholder="© 2026 Acme Inc. All rights reserved."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-2 flex items-center gap-1">
          Brand colors
        </label>
        <div className="flex flex-wrap gap-4">
          {(['primary', 'accent', 'secondary'] as const).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={kit.logoColors[key] || '#334155'}
                onChange={(e) =>
                  setKit((k) => ({
                    ...k,
                    logoColors: { ...k.logoColors, [key]: e.target.value },
                  }))
                }
                className="w-10 h-10 rounded cursor-pointer border border-slate-700"
              />
              <span className="text-xs text-slate-400 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save brand kit'}
      </button>
    </form>
  );
}
