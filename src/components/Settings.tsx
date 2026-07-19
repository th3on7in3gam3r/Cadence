/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders, Bell, Sparkles, RefreshCw, Cpu, Check, ShieldAlert,
  KeyRound, HardDrive, Plug, Wifi, WifiOff, ExternalLink,
  CreditCard, Users, Building2, Globe, Cloud, Grid3X3, BookOpen,
} from 'lucide-react';
import { isCloudEnabled } from '../lib/cloudConfig';
import { useAuth } from '../contexts/AuthContext';
import CloudIntegrationsPanel from './settings/CloudIntegrationsPanel';
import GrowthStackIntegrationsPanel from './settings/GrowthStackIntegrationsPanel';
import PulseInstallPanel from './settings/PulseInstallPanel';
import ConnectedProductsPanel from './settings/ConnectedProductsPanel';
import BrandKitTab from './settings/BrandKitTab';
import NotificationPrefsTab from './settings/NotificationPrefsTab';
import BillingTab from './settings/BillingTab';
import TeamTab from './settings/TeamTab';
import AgencyTab from './settings/AgencyTab';
import { PRODUCT_NAME } from '../lib/brand';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemSettingsData {
  defaultToneIntensity: number;
  autoArchiveDays: number;
  simulatedNetworkLatency: boolean;
  enableExpertAutoPilot: boolean;
  activeStrategyFramework: string;
  autoSaveWorkspaceInterval: number;
  /** Kit (ConvertKit) form or landing page URL for blog subscribe CTAs */
  newsletterSubscribeUrl: string;
}

const defaultSettings: SystemSettingsData = {
  defaultToneIntensity: 75,
  autoArchiveDays: 30,
  simulatedNetworkLatency: false,
  enableExpertAutoPilot: true,
  activeStrategyFramework: 'Generative Engine Search Dominance (GEO)',
  autoSaveWorkspaceInterval: 5,
  newsletterSubscribeUrl: '',
};

type IntegrationId =
  | 'wordpress' | 'wordpress_self' | 'webflow' | 'framer' | 'sanity'
  | 'twitter' | 'linkedin'
  | 'github'
  | 'google_analytics' | 'google_search_console'
  | 'whatsapp' | 'telegram';

type IntegrationConnections = Record<IntegrationId, boolean>;

const defaultConnections: IntegrationConnections = {
  wordpress: false, wordpress_self: false, webflow: false,
  framer: false, sanity: false, twitter: false, linkedin: false,
  github: false, google_analytics: false, google_search_console: false,
  whatsapp: false, telegram: false,
};

interface Integration {
  id: IntegrationId;
  name: string;
  description: string;
  logo: string; // emoji / svg placeholder
}

interface IntegrationGroup {
  label: string;
  subtitle: string;
  items: Integration[];
}


const INTEGRATION_GROUPS: IntegrationGroup[] = [
  {
    label: 'Article Publishing',
    subtitle: 'Publish articles directly to your CMS or blog platform',
    items: [
      { id: 'wordpress',      name: 'WordPress',             description: 'Publish articles to WordPress.com',          logo: '🔵' },
      { id: 'wordpress_self', name: 'WordPress (Self-Hosted)',description: 'Connect via application password',           logo: '🔵' },
      { id: 'webflow',        name: 'Webflow',                description: 'Publish to Webflow CMS collections',         logo: '🌊' },
      { id: 'framer',         name: 'Framer',                 description: 'Publish to Framer CMS collections',          logo: '⚡' },
      { id: 'sanity',         name: 'Sanity',                 description: 'Publish articles to your Sanity dataset',    logo: '🟠' },
    ],
  },
  {
    label: 'Socials',
    subtitle: 'Connect your social accounts to post and share content',
    items: [
      { id: 'twitter',  name: 'X (Twitter)', description: 'Post tweets and threads',          logo: '✖️' },
      { id: 'linkedin', name: 'LinkedIn',     description: 'Share professional content',       logo: '🔷' },
    ],
  },
  {
    label: 'Code Repository',
    subtitle: 'Connect a GitHub repo so the SEO agent can open pull requests against it',
    items: [
      { id: 'github', name: 'GitHub', description: 'Let the SEO agent open pull requests against your repository', logo: '🐙' },
    ],
  },
  {
    label: 'Analytics',
    subtitle: 'Connect analytics tools to track performance. Disconnecting will remove the connector and all collected data.',
    items: [
      { id: 'google_analytics',       name: 'Google Analytics',       description: 'Track website traffic and user behaviour',   logo: '📊' },
      { id: 'google_search_console',  name: 'Google Search Console',  description: 'Monitor SEO performance and indexing',        logo: '🔍' },
    ],
  },
  {
    label: 'Messaging',
    subtitle: `Chat with ${PRODUCT_NAME} directly from your phone.`,
    items: [
      { id: 'whatsapp', name: 'WhatsApp', description: `Receive daily digests and chat with ${PRODUCT_NAME} on WhatsApp`,  logo: '💬' },
      { id: 'telegram', name: 'Telegram', description: `Receive daily digests and chat with ${PRODUCT_NAME} on Telegram`, logo: '✈️' },
    ],
  },
];


// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsProps {
  brandName?: string;
  brandUrl?: string;
  onResetWorkspace?: () => void;
  onOpenHelp?: (section: 'overview' | 'start' | 'post' | 'map') => void;
}

// ─── IntegrationCard ──────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  connected,
  onToggle,
}: {
  integration: Integration;
  connected: boolean;
  onToggle: (id: IntegrationId) => void;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      connected
        ? 'bg-emerald-950/20 border-emerald-800/40'
        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="text-2xl w-9 h-9 flex items-center justify-center shrink-0 select-none">
        {integration.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{integration.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{integration.description}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {connected ? (
            <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-mono text-emerald-400 font-medium">Connected</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-[10px] font-mono text-slate-500">Not connected</span></>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(integration.id)}
        className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
          connected
            ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-red-800/60 hover:text-red-400'
            : 'bg-white text-slate-900 border-white hover:bg-slate-100'
        }`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}


// ─── IntegrationsTab ──────────────────────────────────────────────────────────

function IntegrationsTab({ brandUrl }: { brandUrl?: string }) {
  return (
    <div className="space-y-10">
      <PulseInstallPanel brandUrl={brandUrl} />
      <GrowthStackIntegrationsPanel />
      {isCloudEnabled() ? <CloudIntegrationsPanel /> : <LegacyIntegrationsTab />}
    </div>
  );
}

function LegacyIntegrationsTab() {
  const [connections, setConnections] = useState<IntegrationConnections>(() => {
    try {
      const saved = localStorage.getItem('ai_cmo_integrations');
      return saved ? { ...defaultConnections, ...JSON.parse(saved) } : defaultConnections;
    } catch {
      return defaultConnections;
    }
  });

  const toggleConnection = (id: IntegrationId) => {
    setConnections(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('ai_cmo_integrations', JSON.stringify(updated));
      return updated;
    });
  };

  const connectedCount = Object.values(connections).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Summary banner */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-mono font-bold text-white">
            {connectedCount} integration{connectedCount !== 1 ? 's' : ''} active
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Changes save automatically</span>
      </div>

      {/* Integration groups */}
      {INTEGRATION_GROUPS.map(group => (
        <div key={group.label} className="space-y-3">
          <div>
            <h3 className="text-sm font-display font-extrabold text-white">{group.label}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{group.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map(item => (
              <div key={item.id}>
                <IntegrationCard
                  integration={item}
                  connected={connections[item.id]}
                  onToggle={toggleConnection}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


// ─── Main Settings Component ──────────────────────────────────────────────────

type SettingsTab = 'general' | 'integrations' | 'studio' | 'brand-kit' | 'notifications' | 'billing' | 'team' | 'agency';

export default function Settings({ brandName, brandUrl, onResetWorkspace, onOpenHelp }: SettingsProps) {
  const { user } = useAuth();
  const cloudEnabled = isCloudEnabled();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const highlightBundle = searchParams.get('bundle') || searchParams.get('plan') || undefined;
  const [settings, setSettings] = useState<SystemSettingsData>(defaultSettings);
  const [isSavedNotify, setIsSavedNotify] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai_cmo_system_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse system settings', e);
      }
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab === 'billing' ||
      tab === 'studio' ||
      tab === 'integrations' ||
      tab === 'general' ||
      tab === 'brand-kit' ||
      tab === 'notifications' ||
      tab === 'team' ||
      tab === 'agency'
    ) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ai_cmo_system_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('system_settings_updated'));
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    localStorage.removeItem('ai_cmo_user_profile');
    localStorage.removeItem('ai_cmo_system_settings');
    if (onResetWorkspace) { onResetWorkspace(); } else { window.location.reload(); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in" id="settings-view">
      {/* Header */}
      <div className="select-none border-b border-slate-800 pb-4 space-y-1">
        <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-500 shrink-0" />
          Settings
        </h2>
        <p className="text-[11px] text-slate-400 font-sans font-medium leading-relaxed max-w-xl">
          War room controls, billing, team, integrations, and brand kit
        </p>
      </div>

      {onOpenHelp && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white">User guide</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Step-by-step help — especially publishing blogs to WordPress and connecting Kit.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenHelp('post')}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
            >
              How to post
            </button>
            <button
              type="button"
              onClick={() => onOpenHelp('overview')}
              className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              All guides
            </button>
          </div>
        </div>
      )}

      {/* Workspace context — replaces the AI team panel on this page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Active brand
          </p>
          <p className="text-sm font-bold text-white truncate mt-1">{brandName || 'Not set'}</p>
          {brandUrl && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{brandUrl}</p>
          )}
        </div>
        {cloudEnabled && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-w-0">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              Cloud account
            </p>
            <p className="text-sm font-bold text-white truncate mt-1">
              {user?.email || 'Not signed in'}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Workspace syncs across devices</p>
          </div>
        )}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            Data storage
          </p>
          <p className="text-sm font-bold text-white truncate mt-1">
            {cloudEnabled ? 'Cloud + local cache' : 'This browser only'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {cloudEnabled ? 'Changes save to Supabase' : 'Sign in to sync to the cloud'}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 max-w-full">
        {([
          { id: 'general',      label: 'General',      icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'brand-kit',    label: 'Brand kit',    icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'integrations', label: 'Integrations', icon: <Plug className="w-3.5 h-3.5" /> },
          { id: 'studio',         label: 'Studio',       icon: <Grid3X3 className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Alerts',    icon: <Bell className="w-3.5 h-3.5" /> },
          { id: 'billing',      label: 'Billing',      icon: <CreditCard className="w-3.5 h-3.5" /> },
          { id: 'team',         label: 'Team',         icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'agency',       label: 'Agency',       icon: <Building2 className="w-3.5 h-3.5" /> },
        ] as { id: SettingsTab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>


      {/* Integrations tab */}
      {activeTab === 'integrations' && <IntegrationsTab brandUrl={brandUrl} />}
      {activeTab === 'studio' && <ConnectedProductsPanel />}
      {activeTab === 'brand-kit' && <BrandKitTab />}
      {activeTab === 'notifications' && <NotificationPrefsTab />}
      {activeTab === 'billing' && <BillingTab highlightBundle={highlightBundle} />}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'agency' && <AgencyTab />}

      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl select-none">
            <div className="space-y-1">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg w-fit">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display font-extrabold text-white pt-1">Active Brand Domain</h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                {brandName || 'Not Set'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10.5px] text-slate-400 space-y-2 leading-relaxed">
              <div className="text-white font-bold text-xs">Sandbox Engine Parameters:</div>
              <p>Under default deployment regulations, {PRODUCT_NAME} coordinates with pre-authenticated secure server credentials through standard stateless sandbox pipelines.</p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Strategy Framework Constraint</label>
              <div className="space-y-1">
                {[
                  'Generative Engine Search Dominance (GEO)',
                  'AIDA Conversion Funnel Funneling',
                  'Aggressive Viral Organic Loops (X & LinkedIn)',
                  'Traditional Solution-Led Authority Building',
                ].map((framework) => (
                  <button
                    key={framework}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, activeStrategyFramework: framework }))}
                    className={`w-full text-left text-[11px] p-2 rounded transition-all flex items-center justify-between ${
                      settings.activeStrategyFramework === framework
                        ? 'bg-amber-500/10 border border-amber-500/35 text-amber-300'
                        : 'hover:bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{framework}</span>
                    {settings.activeStrategyFramework === framework && <Check className="w-3 h-3 text-amber-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Right column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 select-none">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Pipeline Generation & Autopilot Controls
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                    <span className="font-bold uppercase text-[10px] text-slate-500">
                      DEFAULT COPYWRITING INTENSITY ({settings.defaultToneIntensity}%)
                    </span>
                    <span className="text-amber-400 font-semibold">
                      {settings.defaultToneIntensity > 80
                        ? 'Highly Dramatic / Aggressive CTA'
                        : settings.defaultToneIntensity > 50
                        ? 'Balanced Corporate / Conversational'
                        : 'Acutely Academic & Understated'}
                    </span>
                  </div>
                  <input
                    type="range" min="20" max="100"
                    value={settings.defaultToneIntensity}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultToneIntensity: parseInt(e.target.value, 10) }))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 block uppercase mb-1">Auto-Archive Delay Days</label>
                    <select
                      value={settings.autoArchiveDays}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoArchiveDays: parseInt(e.target.value) }))}
                      className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                      <option value={7}>Archive older than 7 Days</option>
                      <option value={14}>Archive older than 14 Days</option>
                      <option value={30}>Archive older than 30 Days</option>
                      <option value={90}>Archive older than 90 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 block uppercase mb-1">Auto-Save Workspace Interval (min)</label>
                    <input
                      type="number" min="1" max="60"
                      value={settings.autoSaveWorkspaceInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoSaveWorkspaceInterval: parseInt(e.target.value) || 5 }))}
                      className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
                    Kit newsletter URL
                  </label>
                  <input
                    type="url"
                    value={settings.newsletterSubscribeUrl}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, newsletterSubscribeUrl: e.target.value }))
                    }
                    placeholder="https://biblefunland.kit.com/your-form"
                    className="w-full text-xs font-sans bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Paste your Kit (ConvertKit) signup form or landing page URL. Blog WordPress exports use this
                    for the Subscribe button.
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase tracking-wider select-none">Toggles & Operational Enforcers</span>
                  <label className="flex items-start gap-3 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={settings.enableExpertAutoPilot}
                      onChange={(e) => setSettings(prev => ({ ...prev, enableExpertAutoPilot: e.target.checked }))}
                      className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/50 accent-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="text-white font-bold block">Deploy Expert Autopilot Peer Reviews</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Enables immediate background review cycles from Sarah, Maya, Kofi, or Devon when completing draft iterations.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={settings.simulatedNetworkLatency}
                      onChange={(e) => setSettings(prev => ({ ...prev, simulatedNetworkLatency: e.target.checked }))}
                      className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/50 accent-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="text-white font-bold block">Simulate Network & API Response Latency</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Simulates typical high-level research and analysis delay loops to test front-end loader UI states correctly.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <span className="text-[9px] font-mono text-slate-500">Settings Sandbox v2026.06</span>
                <div className="flex items-center gap-3">
                  {isSavedNotify && (
                    <span className="text-xs text-emerald-400 font-bold font-mono animate-pulse flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Directives saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    id="save-system-settings"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Save Global Configuration
                  </button>
                </div>
              </div>
            </div>


            {/* Danger zone */}
            <div className="bg-slate-900 border border-red-900/20 rounded-2xl p-6 space-y-4 shadow-xl select-none">
              <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Administrative Gaps Override
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                If you wish to initiate a completely pristine campaign onboarding cycle, you can purge your cached target corporate guidelines, sandbox files, connected social publishers, and layout profiles.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="reset-war-room-clear-btn"
                  onClick={handleReset}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    confirmReset
                      ? 'bg-red-700 hover:bg-red-600 text-white border-red-500'
                      : 'bg-slate-950 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-900/40'
                  }`}
                >
                  {confirmReset ? '⚠️ Confirm Purge Memory!' : 'Purge All Sandbox States'}
                </button>
                {confirmReset && (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
