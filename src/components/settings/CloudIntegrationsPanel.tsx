/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Plug, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  connectSignalDesk,
  connectWordPress,
  disconnectGoogleIntegration,
  fetchIntegrationStatus,
  startGoogleIntegration,
} from '../../lib/workspaceApi';

export default function CloudIntegrationsPanel() {
  const { cloudEnabled } = useAuth();
  const [loading, setLoading] = useState(true);
  const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState(false);
  const [connections, setConnections] = useState<Record<string, { connected: boolean; metadata?: unknown }>>({});
  const [wpSiteUrl, setWpSiteUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [wpSaving, setWpSaving] = useState(false);
  const [sdSiteUrl, setSdSiteUrl] = useState('');
  const [sdApiKey, setSdApiKey] = useState('');
  const [sdSaving, setSdSaving] = useState(false);
  const [sdWebhook, setSdWebhook] = useState<{ url: string; secret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = async () => {
    if (!cloudEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrationStatus();
      setGoogleOAuthConfigured(data.googleOAuthConfigured);
      setConnections(data.connections);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [cloudEnabled]);

  if (!cloudEnabled) return null;

  const gscConnected = !!connections.google_search_console?.connected;
  const ga4Connected = !!connections.google_analytics?.connected;
  const wpConnected = !!connections.wordpress?.connected;
  const sdConnected = !!connections.signaldesk?.connected;
  const connectedCount = [gscConnected, ga4Connected, wpConnected, sdConnected].filter(Boolean).length;

  const handleGoogleConnect = async (service: 'gsc' | 'ga4') => {
    setError(null);
    try {
      await startGoogleIntegration(service);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'OAuth failed');
    }
  };

  const handleGoogleDisconnect = async (provider: 'google_search_console' | 'google_analytics') => {
    setError(null);
    try {
      await disconnectGoogleIntegration(provider);
      await refresh();
      setSuccess('Disconnected.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Disconnect failed');
    }
  };

  const handleWordPressConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setWpSaving(true);
    setError(null);
    try {
      await connectWordPress(wpSiteUrl.trim(), wpUsername.trim(), wpPassword.trim());
      setWpPassword('');
      await refresh();
      setSuccess('WordPress connected.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'WordPress connect failed');
    } finally {
      setWpSaving(false);
    }
  };

  const handleSignalDeskConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSdSaving(true);
    setError(null);
    setSdWebhook(null);
    try {
      const result = await connectSignalDesk(sdSiteUrl.trim(), sdApiKey.trim());
      setSdApiKey('');
      if (result.webhookUrl && result.webhookSecret) {
        setSdWebhook({ url: result.webhookUrl, secret: result.webhookSecret });
      }
      await refresh();
      setSuccess(
        result.webhookHint ||
          'Signal Desk connected. Paste the webhook URL and secret into Signal Desk Settings.',
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signal Desk connect failed');
    } finally {
      setSdSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-mono font-bold text-white">
            {connectedCount} cloud integration{connectedCount !== 1 ? 's' : ''} active
          </span>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-lg px-4 py-2">{success}</p>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-display font-extrabold text-white">Analytics (live SEO data)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Connect Google accounts to pull real queries and traffic into SEO Agent audits.
          </p>
        </div>
        {!googleOAuthConfigured && (
          <p className="text-xs text-amber-400/90 bg-amber-950/20 border border-amber-900/40 rounded-lg px-3 py-2">
            Server needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables (Render on production).
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IntegrationRow
            name="Google Search Console"
            description="Top queries, impressions, and positions"
            logo="🔍"
            connected={gscConnected}
            disabled={!googleOAuthConfigured}
            onConnect={() => handleGoogleConnect('gsc')}
            onDisconnect={() => handleGoogleDisconnect('google_search_console')}
          />
          <IntegrationRow
            name="Google Analytics 4"
            description="Sessions and top landing pages"
            logo="📊"
            connected={ga4Connected}
            disabled={!googleOAuthConfigured}
            onConnect={() => handleGoogleConnect('ga4')}
            onDisconnect={() => handleGoogleDisconnect('google_analytics')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-display font-extrabold text-white">Publishing</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Connect Signal Desk with an API key, or WordPress with an application password.
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${sdConnected ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📰</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Signal Desk</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Site URL + API key from Signal Desk → Studio → Settings. Preferred for GEO / citation-ready posts.
              </p>
              <div className="flex items-center gap-1 mt-1">
                {sdConnected ? (
                  <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-mono text-emerald-400">Connected</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-[10px] font-mono text-slate-500">Not connected</span></>
                )}
              </div>
            </div>
          </div>
          {!sdConnected && (
            <form onSubmit={handleSignalDeskConnect} className="space-y-3">
              <input
                type="url"
                required
                placeholder="https://your-signal-desk.example"
                value={sdSiteUrl}
                onChange={(e) => setSdSiteUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="password"
                required
                placeholder="API key (sd_live_…)"
                value={sdApiKey}
                onChange={(e) => setSdApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={sdSaving}
                className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {sdSaving ? 'Connecting…' : 'Connect Signal Desk'}
              </button>
            </form>
          )}
          {sdWebhook && (
            <div className="mt-3 space-y-2 rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-[11px] text-slate-300">
              <p className="font-semibold text-white">Paste into Signal Desk → Settings → Publish webhook</p>
              <p className="break-all"><span className="text-slate-500">URL: </span>{sdWebhook.url}</p>
              <p className="break-all"><span className="text-slate-500">Secret: </span>{sdWebhook.secret}</p>
            </div>
          )}
        </div>

        <div className={`p-4 rounded-xl border ${wpConnected ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔵</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">WordPress</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Self-hosted or WordPress.com via username + application password.
              </p>
              <div className="flex items-center gap-1 mt-1">
                {wpConnected ? (
                  <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-mono text-emerald-400">Connected</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-[10px] font-mono text-slate-500">Not connected</span></>
                )}
              </div>
            </div>
          </div>
          {!wpConnected && (
            <form onSubmit={handleWordPressConnect} className="space-y-3">
              <input
                type="url"
                required
                placeholder="https://your-wordpress.example"
                value={wpSiteUrl}
                onChange={(e) => setWpSiteUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                required
                placeholder="Username"
                value={wpUsername}
                onChange={(e) => setWpUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="password"
                required
                placeholder="Application password"
                value={wpPassword}
                onChange={(e) => setWpPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={wpSaving}
                className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {wpSaving ? 'Connecting…' : 'Connect WordPress'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({
  name,
  description,
  logo,
  connected,
  disabled,
  onConnect,
  onDisconnect,
}: {
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  disabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      connected ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950 border-slate-800'
    }`}>
      <span className="text-2xl shrink-0">{logo}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {connected ? (
            <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-mono text-emerald-400">Connected</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-[10px] font-mono text-slate-500">Not connected</span></>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled && !connected}
        onClick={connected ? onDisconnect : onConnect}
        className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer border disabled:opacity-40 ${
          connected
            ? 'bg-slate-900 text-slate-300 border-slate-700 hover:text-red-400'
            : 'bg-white text-slate-900 border-white hover:bg-slate-100'
        }`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
