/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { NotificationPreferences } from '../../types';
import {
  defaultNotificationPrefs,
  loadNotificationPrefs,
  saveNotificationPrefs,
} from '../../utils/notifications';
import { apiFetch } from '../../lib/api';

export default function NotificationPrefsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => loadNotificationPrefs());
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationPrefs(prefs);
    try {
      await apiFetch('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
    } catch { /* local prefs still saved */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Bell className="w-4 h-4 text-amber-400" />
        In-app alerts always on. Optional Slack webhook for team channels.
      </div>

      <Toggle
        label="Audit complete"
        desc="Notify when an SEO audit finishes."
        checked={prefs.onAuditComplete}
        onChange={(v) => setPrefs((p) => ({ ...p, onAuditComplete: v }))}
      />
      <Toggle
        label="SEO score drop"
        desc="Alert when overall score falls more than 5 points."
        checked={prefs.onScoreDrop}
        onChange={(v) => setPrefs((p) => ({ ...p, onScoreDrop: v }))}
      />
      <Toggle
        label="Weekly digest"
        desc="Summary of pending calendar tasks and recommended actions."
        checked={prefs.weeklyDigest}
        onChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))}
      />

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Slack webhook URL (optional)</label>
        <input
          type="url"
          value={prefs.slackWebhookUrl || ''}
          onChange={(e) => setPrefs((p) => ({ ...p, slackWebhookUrl: e.target.value }))}
          placeholder="https://hooks.slack.com/services/..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-slate-500 uppercase block mb-1.5">Email for digests (optional)</label>
        <input
          type="email"
          value={prefs.email || ''}
          onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
          placeholder="you@company.com"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save notification preferences'}
      </button>
    </form>
  );
}
