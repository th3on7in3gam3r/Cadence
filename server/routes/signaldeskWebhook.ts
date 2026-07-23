/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { verifySignalDeskWebhookSignature } from '../lib/signaldesk';

const router = Router();

type SignalDeskWebhookPayload = {
  event?: string;
  post?: {
    id?: number | string;
    slug?: string;
    url?: string;
    status?: string;
    publishedAt?: string | null;
  };
};

/**
 * Inbound Signal Desk publish webhook (HMAC auth).
 * Mounted with express.raw so signature matches the original body.
 * URL includes ?userId=… from Integrations connect response.
 */
router.post('/signaldesk', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'userId query param required' });
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : '';

    if (!rawBody) {
      return res.status(400).json({ error: 'Empty body' });
    }

    let payload: SignalDeskWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as SignalDeskWebhookPayload;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { data: conn } = await sb
      .from('integration_connections')
      .select('metadata')
      .eq('user_id', userId)
      .eq('provider', 'signaldesk')
      .maybeSingle();

    if (!conn?.metadata) {
      return res.status(404).json({ error: 'Not found' });
    }

    const meta = conn.metadata as {
      siteUrl?: string;
      apiKey?: string;
      webhookSecret?: string;
      lastRemoteId?: string | null;
      lastRemoteUrl?: string | null;
      lastRemoteStatus?: string | null;
      webhookEvents?: unknown[];
    };

    const secret = meta.webhookSecret?.trim();
    if (!secret) {
      return res.status(401).json({ error: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-signal-desk-signature'];
    const sigHeader = Array.isArray(signature) ? signature[0] : signature;
    if (!verifySignalDeskWebhookSignature(rawBody, sigHeader, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    if (payload.event !== 'post.published') {
      return res.json({ ok: true, ignored: true, event: payload.event });
    }

    const remoteId = payload.post?.id != null ? String(payload.post.id) : '';
    const events = Array.isArray(meta.webhookEvents) ? [...meta.webhookEvents] : [];
    events.push({
      at: new Date().toISOString(),
      event: payload.event,
      postId: remoteId,
      url: payload.post?.url ?? null,
      status: payload.post?.status ?? null,
    });
    while (events.length > 20) events.shift();

    await sb.from('integration_connections').upsert({
      user_id: userId,
      provider: 'signaldesk',
      access_token: null,
      refresh_token: null,
      metadata: {
        ...meta,
        lastRemoteId: remoteId || meta.lastRemoteId || null,
        lastRemoteUrl: payload.post?.url ?? meta.lastRemoteUrl ?? null,
        lastRemoteStatus: 'publish',
        lastWebhookAt: new Date().toISOString(),
        webhookEvents: events,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    return res.json({
      ok: true,
      matched: Boolean(remoteId),
      remoteId: remoteId || null,
      remoteUrl: payload.post?.url ?? null,
    });
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Webhook failed',
    });
  }
});

export default router;
