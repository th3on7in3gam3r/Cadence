/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Check } from 'lucide-react';
import { fetchOrg, updateOrg } from '../../lib/teamsApi';
import { fetchBillingStatus } from '../../lib/billingApi';

export default function AgencyTab() {
  const [agencyName, setAgencyName] = useState('');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchOrg(), fetchBillingStatus()])
      .then(([org, billing]) => {
        if (org) {
          setAgencyName(org.agency_name || '');
          setAgencyLogoUrl(org.agency_logo_url || '');
          setWorkspaceName(org.name || '');
        }
        setWhiteLabel(billing.limits.whiteLabelReports);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateOrg({
        name: workspaceName,
        agencyName: whiteLabel ? agencyName : '',
        agencyLogoUrl: whiteLabel ? agencyLogoUrl : '',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading agency settings…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">{error}</div>
      )}

      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          Agency / white-label
        </h3>
        {!whiteLabel && (
          <p className="text-[11px] text-amber-400/90 bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
            White-label PDF reports require Pro or Team. Upgrade in Billing to add your logo to client audit exports.
          </p>
        )}

        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Workspace name</label>
          <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Agency name (on PDF reports)</label>
          <input
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            disabled={!whiteLabel}
            placeholder="Acme Marketing Co."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Agency logo URL</label>
          <input
            value={agencyLogoUrl}
            onChange={(e) => setAgencyLogoUrl(e.target.value)}
            disabled={!whiteLabel}
            placeholder="https://yoursite.com/logo.png"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white disabled:opacity-50"
          />
          {agencyLogoUrl && whiteLabel && (
            <img src={agencyLogoUrl} alt="" className="mt-2 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          Save agency settings
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Export branded SEO audit PDFs from the SEO Agent overview tab. Use the header brand switcher to jump between client workspaces.
      </p>
    </form>
  );
}
