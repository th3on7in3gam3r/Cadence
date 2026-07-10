/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Award, Shield, Check, Mail, Building, Target, Save, Sparkles } from 'lucide-react';

interface UserProfileData {
  fullName: string;
  role: string;
  organization: string;
  userEmail: string;
  bio: string;
  kpiGoal: string;
  experienceLevel: string;
  avatarColor: string;
}

const defaultProfile: UserProfileData = {
  fullName: '',
  role: '',
  organization: '',
  userEmail: '',
  bio: '',
  kpiGoal: '',
  experienceLevel: 'Founder / solo marketer',
  avatarColor: 'from-emerald-500 to-teal-600',
};

interface UserProfileProps {
  onBackToDashboard: () => void;
  currentUserEmail?: string;
}

export default function UserProfile({ onBackToDashboard, currentUserEmail }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData>(defaultProfile);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai_cmo_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sync with email metadata if provided and profile is empty
        if (currentUserEmail && !parsed.userEmail) {
          parsed.userEmail = currentUserEmail;
        }
        setProfile(parsed);
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    } else if (currentUserEmail) {
      setProfile(prev => ({ ...prev, userEmail: currentUserEmail }));
    }
  }, [currentUserEmail]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ai_cmo_user_profile', JSON.stringify(profile));
    
    // Fire a dispatch event so header or others can update if needed
    window.dispatchEvent(new Event('user_profile_updated'));

    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2500);
  };

  const avatarColorPresets = [
    { label: 'Amber Flame', value: 'from-amber-500 to-orange-600' },
    { label: 'Emerald Mint', value: 'from-emerald-400 to-teal-600' },
    { label: 'Hyper Blue', value: 'from-blue-500 to-indigo-650' },
    { label: 'Royal Orchid', value: 'from-purple-500 to-pink-600' },
    { label: 'Charcoal Dark', value: 'from-slate-700 to-slate-900' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in" id="user-profile-view">
      {/* Header back tracker */}
      <div className="flex items-center justify-between select-none border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Marketer Command Profile
          </h2>
          <p className="text-[11px] text-slate-400 font-sans">Configure your executive identity to auto-align generated deliverables' tone and signature author bio</p>
        </div>
        <button
          type="button"
          id="profile-back-to-dash-btn"
          onClick={onBackToDashboard}
          className="text-xs font-mono font-medium border border-slate-800 hover:border-slate-705 px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          ← Back to dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl select-none">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-slate-950 font-display font-extrabold text-3xl shadow-inner transition-transform group-hover:scale-105 duration-300`}>
              {profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CM'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-display font-extrabold text-white">{profile.fullName}</h3>
            <p className="text-xs font-mono text-emerald-400 mt-1 font-bold">{profile.role}</p>
            <p className="text-[10px] text-slate-550 font-sans mt-0.5">{profile.organization}</p>
          </div>

          <div className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2.5 text-left text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{profile.userEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{profile.organization}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Target className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-semibold truncate" title={profile.kpiGoal}>{profile.kpiGoal}</span>
            </div>
          </div>

          <div className="w-full pt-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block text-left mb-2">Select Avatar Vibe</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {avatarColorPresets.map((preset) => {
                const isActive = profile.avatarColor === preset.value;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setProfile(prev => ({ ...prev, avatarColor: preset.value }))}
                    className={`w-5 h-5 rounded-md bg-gradient-to-br ${preset.value} border transition-all cursor-pointer ${
                      isActive ? 'ring-2 ring-amber-500 border-white' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                    title={preset.label}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-850 pb-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 select-none">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Personalize Brand Representative Profile
            </h3>
            <p className="text-xs text-slate-450 mt-1">This metadata is utilized as generative guardrails by the CMO agent to keep all copy contextualized inside your department structure.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Full Representative Name</label>
              <input
                type="text"
                required
                value={profile.fullName}
                onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Professional Title</label>
              <input
                type="text"
                required
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Corporate Organization</label>
              <input
                type="text"
                required
                value={profile.organization}
                onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={profile.userEmail}
                onChange={(e) => setProfile(prev => ({ ...prev, userEmail: e.target.value }))}
                className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Experience Focus Level</label>
            <select
              value={profile.experienceLevel}
              onChange={(e) => setProfile(prev => ({ ...prev, experienceLevel: e.target.value }))}
              className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option>Associate Lead (1-3 years)</option>
              <option>Senior Growth Strategist (3-6 years)</option>
              <option>Marketing Director (6-10 years)</option>
              <option>Executive Leader (10+ years)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Top Active KPI Growth Goal (Strict focus constraint)</label>
            <input
              type="text"
              required
              value={profile.kpiGoal}
              onChange={(e) => setProfile(prev => ({ ...prev, kpiGoal: e.target.value }))}
              placeholder="e.g. Increase product signups, lower bounce rates, boost semantic reach"
              className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-450 block uppercase mb-1">Executive Biography / Tactical Focus</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 leading-relaxed font-mono"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-850">
            <div className="text-emerald-400 font-mono text-xs flex items-center gap-1.5 select-none font-bold">
              <Award className="w-4 h-4" />
              {profile.fullName ? `${profile.fullName} Profile Authenticated` : 'Marketer Credentials'}
            </div>

            <div className="flex items-center gap-3">
              {isSavedNotify && (
                <span className="text-xs text-amber-400 font-bold font-mono animate-pulse flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Handled and Persisted Successfully!
                </span>
              )}
              
              <button
                type="submit"
                id="save-profile-credentials-btn"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
