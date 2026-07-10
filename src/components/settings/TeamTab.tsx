/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Loader2, Shield } from 'lucide-react';
import {
  fetchMembers,
  inviteMember,
  fetchUserRole,
  fetchBrands,
  createBrand,
  type MemberRole,
} from '../../lib/teamsApi';
import { fetchBillingStatus } from '../../lib/billingApi';
import { isCloudEnabled } from '../../lib/cloudConfig';
import SelectField from '../ui/SelectField';

export default function TeamTab() {
  const [members, setMembers] = useState<{ id: string; email: string; role: MemberRole }[]>([]);
  const [role, setRole] = useState<MemberRole>('admin');
  const [canApprove, setCanApprove] = useState(false);
  const [brandCount, setBrandCount] = useState(0);
  const [plan, setPlan] = useState('free');
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandUrl, setNewBrandUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [m, r, b, billing] = await Promise.all([
        fetchMembers(),
        fetchUserRole(),
        fetchBrands(),
        fetchBillingStatus(),
      ]);
      setMembers(m);
      setRole(r.role);
      setCanApprove(r.canApprove);
      setBrandCount(b.length);
      setPlan(billing.plan);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await inviteMember(email.trim(), inviteRole);
      setMessage(result.inviteUrl ? `Invite link: ${result.inviteUrl}` : 'Invite sent');
      setEmail('');
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createBrand(newBrandName.trim(), newBrandUrl.trim() || undefined);
      setNewBrandName('');
      setNewBrandUrl('');
      setMessage('Brand created. Use the header switcher to open it.');
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add brand');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
      </div>
    );
  }

  const teamPlan = plan === 'team';

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">{error}</div>
      )}
      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-300 break-all">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Your role</p>
          <p className="text-sm font-bold text-white capitalize mt-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            {role}
          </p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Client brands</p>
          <p className="text-sm font-bold text-white mt-1">{brandCount}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Approval workflow</p>
          <p className={`text-sm font-bold mt-1 ${canApprove ? 'text-emerald-400' : 'text-slate-500'}`}>
            {canApprove ? 'Enabled (Team)' : 'Pro / Free — view only'}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Add client brand
        </h3>
        <form onSubmit={handleAddBrand} className="flex flex-wrap gap-2">
          <input
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Client name"
            className="flex-1 min-w-[140px] text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={newBrandUrl}
            onChange={(e) => setNewBrandUrl(e.target.value)}
            placeholder="https://client.com (optional)"
            className="flex-1 min-w-[180px] text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Add brand
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-400" />
          Invite teammate
        </h3>
        {!teamPlan && (
          <p className="text-[11px] text-slate-500">Team invites require the Team plan ($149/mo).</p>
        )}
        <form onSubmit={handleInvite} className="flex flex-wrap gap-2 items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@agency.com"
            disabled={!teamPlan}
            className="flex-1 min-w-[200px] text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white disabled:opacity-50"
          />
          <SelectField
            id="invite-role"
            label="Role"
            value={inviteRole}
            onChange={(v) => setInviteRole(v as MemberRole)}
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'admin', label: 'Admin' },
            ]}
            hidePlaceholder
            disabled={!teamPlan}
            className="min-w-[120px]"
          />
          <button
            type="submit"
            disabled={busy || !teamPlan}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
          >
            Send invite
          </button>
        </form>
        <p className="text-[10px] text-slate-500">
          Admins manage billing, invites, and agency settings. Editors can run campaigns and audits.
        </p>
      </section>

      <section>
        <h3 className="text-[10px] font-mono text-slate-500 uppercase mb-3">Members</h3>
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs text-slate-500">No teammates yet.{!isCloudEnabled() && ' (Local mode stores invites in this browser.)'}</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                <span className="text-white">{m.email}</span>
                <span className="text-slate-500 capitalize font-mono">{m.role}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
