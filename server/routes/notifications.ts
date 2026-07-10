/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';

const router = Router();

const prefsStore = new Map<string, Record<string, unknown>>();
const inboxStore = new Map<string, unknown[]>();

function userKey(req: { headers: { authorization?: string } }): string {
  return req.headers.authorization?.slice(0, 32) || 'anonymous';
}

router.get('/preferences', (req, res) => {
  const key = userKey(req);
  res.json(prefsStore.get(key) || {
    onAuditComplete: true,
    onScoreDrop: true,
    weeklyDigest: true,
  });
});

router.put('/preferences', (req, res) => {
  const key = userKey(req);
  prefsStore.set(key, req.body);
  res.json({ ok: true });
});

router.get('/inbox', (req, res) => {
  const key = userKey(req);
  res.json({ notifications: inboxStore.get(key) || [] });
});

router.post('/dispatch', async (req, res) => {
  try {
    const { title, message, type, slackWebhookUrl } = req.body;
    const key = userKey(req);
    const entry = {
      id: crypto.randomUUID(),
      type: type || 'info',
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const list = [entry, ...(inboxStore.get(key) || [])].slice(0, 50);
    inboxStore.set(key, list);

    if (slackWebhookUrl) {
      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `*${title}*\n${message}` }),
      }).catch(() => undefined);
    }

    res.json({ ok: true, notification: entry });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Dispatch failed' });
  }
});

export default router;
