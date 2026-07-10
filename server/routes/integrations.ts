/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { appPublicUrl, isGoogleOAuthConfigured } from '../lib/config';
import { getUserPlan } from '../lib/usage';
import { limitsForPlan } from '../lib/plans';

const router = Router();

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function googleAuthUrl(state: string, scopes: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${appPublicUrl()}/api/integrations/google/callback`,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function getConnection(userId: string, provider: string) {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb
    .from('integration_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  return data;
}

async function refreshGoogleToken(userId: string, provider: string, refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Failed to refresh Google token');
  const json = await res.json();
  const sb = getSupabaseAdmin()!;
  await sb.from('integration_connections').update({
    access_token: json.access_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', provider);
  return json.access_token as string;
}

async function getValidAccessToken(userId: string, provider: string): Promise<string | null> {
  const conn = await getConnection(userId, provider);
  if (!conn?.access_token) return null;
  if (conn.expires_at && new Date(conn.expires_at) < new Date() && conn.refresh_token) {
    return refreshGoogleToken(userId, provider, conn.refresh_token);
  }
  return conn.access_token;
}

router.get('/status', requireUser, async (req: AuthedRequest, res) => {
  try {
    const sb = getSupabaseAdmin()!;
    const { data } = await sb
      .from('integration_connections')
      .select('provider, metadata, updated_at')
      .eq('user_id', req.userId!);
    const map: Record<string, { connected: boolean; metadata?: unknown }> = {};
    for (const row of data || []) {
      map[row.provider] = { connected: true, metadata: row.metadata };
    }
    res.json({
      googleOAuthConfigured: isGoogleOAuthConfigured(),
      connections: map,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Status failed' });
  }
});

router.get('/google/start', requireUser, async (req: AuthedRequest, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ error: 'Google OAuth is not configured on the server.' });
  }
  const plan = await getUserPlan(req.userId!);
  if (!limitsForPlan(plan).integrations) {
    return res.status(403).json({
      error: 'Google integrations require Pro or Team. Upgrade in Settings → Billing.',
    });
  }
  const service = req.query.service === 'ga4' ? 'ga4' : 'gsc';
  const state = Buffer.from(JSON.stringify({ userId: req.userId, service })).toString('base64url');
  const scopes = service === 'ga4' ? GA4_SCOPE : GSC_SCOPE;
  res.json({ url: googleAuthUrl(state, scopes) });
});

router.get('/google/callback', async (req, res) => {
  try {
    if (!isGoogleOAuthConfigured()) {
      return res.status(503).send('Google OAuth not configured');
    }
    const code = req.query.code as string;
    const stateRaw = req.query.state as string;
    if (!code || !stateRaw) return res.status(400).send('Missing code or state');
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
    const { userId, service } = state;
    const provider = service === 'ga4' ? 'google_analytics' : 'google_search_console';

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appPublicUrl()}/api/integrations/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokens = await tokenRes.json();

    const sb = getSupabaseAdmin()!;
    await sb.from('integration_connections').upsert({
      user_id: userId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      metadata: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    res.redirect(`${appPublicUrl()}/app?view=settings&integration=connected`);
  } catch (e: unknown) {
    console.error('Google OAuth callback error:', e);
    res.redirect(`${appPublicUrl()}/app?view=settings&integration=error`);
  }
});

router.post('/google/disconnect', requireUser, async (req: AuthedRequest, res) => {
  const provider = req.body.provider;
  if (!['google_search_console', 'google_analytics'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }
  const sb = getSupabaseAdmin()!;
  await sb.from('integration_connections').delete().eq('user_id', req.userId!).eq('provider', provider);
  res.json({ ok: true });
});

router.get('/seo-data', requireUser, async (req: AuthedRequest, res) => {
  try {
    const siteUrl = (req.query.siteUrl as string) || '';
    const ga4PropertyId = (req.query.ga4PropertyId as string) || '';

    const gscToken = await getValidAccessToken(req.userId!, 'google_search_console');
    const ga4Token = await getValidAccessToken(req.userId!, 'google_analytics');

    let topQueries: { query: string; clicks: number; impressions: number; position: number }[] = [];
    let topPages: { path: string; sessions: number; bounceRate?: number }[] = [];

    if (gscToken && siteUrl) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const gscSite = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
      const qRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSite)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gscToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: fmt(start),
            endDate: fmt(end),
            dimensions: ['query'],
            rowLimit: 25,
          }),
        }
      );
      if (qRes.ok) {
        const qJson = await qRes.json();
        topQueries = (qJson.rows || []).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          position: Math.round(r.position * 10) / 10,
        }));
      }
    }

    if (ga4Token && ga4PropertyId) {
      const property = ga4PropertyId.startsWith('properties/') ? ga4PropertyId : `properties/${ga4PropertyId}`;
      const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ga4Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
          limit: 15,
        }),
      });
      if (gaRes.ok) {
        const gaJson = await gaRes.json();
        topPages = (gaJson.rows || []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
          path: r.dimensionValues[0]?.value || '/',
          sessions: parseInt(r.metricValues[0]?.value || '0', 10),
          bounceRate: Math.round(parseFloat(r.metricValues[1]?.value || '0') * 100) / 100,
        }));
      }
    }

    res.json({
      googleSearchConsole: gscToken
        ? { connected: true, propertyUrl: siteUrl, topQueries }
        : { connected: false },
      ga4: ga4Token
        ? { connected: true, propertyId: ga4PropertyId, topPages }
        : { connected: false },
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to load SEO data' });
  }
});

router.post('/wordpress', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { siteUrl, username, appPassword } = req.body;
    if (!siteUrl || !username || !appPassword) {
      return res.status(400).json({ error: 'siteUrl, username, and appPassword are required' });
    }
    const sb = getSupabaseAdmin()!;
    await sb.from('integration_connections').upsert({
      user_id: req.userId!,
      provider: 'wordpress',
      access_token: null,
      refresh_token: null,
      metadata: { siteUrl, username, appPassword },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'WordPress connect failed' });
  }
});

export default router;
