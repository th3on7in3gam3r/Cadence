/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { publishToSignalDeskApi } from '../lib/signaldesk';

const router = Router();

router.post('/wordpress', requireUser, async (req: AuthedRequest, res) => {
  try {
    const {
      title,
      content,
      status = 'draft',
      excerpt,
      featuredMediaUrl,
      metaDescription,
      answerBlock,
      byline,
    } = req.body as {
      title?: string;
      content?: string;
      status?: string;
      excerpt?: string;
      featuredMediaUrl?: string;
      metaDescription?: string;
      answerBlock?: string;
      byline?: string;
    };
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const sb = getSupabaseAdmin()!;
    const { data: conn } = await sb
      .from('integration_connections')
      .select('metadata')
      .eq('user_id', req.userId!)
      .eq('provider', 'wordpress')
      .maybeSingle();

    if (!conn?.metadata) {
      return res.status(400).json({
        error: 'Connect WordPress in Settings → Integrations first.',
      });
    }

    const meta = conn.metadata as {
      siteUrl: string;
      username: string;
      appPassword: string;
    };
    const base = meta.siteUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${meta.username}:${meta.appPassword}`).toString(
      'base64',
    );

    const excerptText = typeof excerpt === 'string' ? excerpt.trim() : '';

    const payload: Record<string, unknown> = {
      title,
      content,
      status,
      excerpt: excerptText,
    };

    const wpRes = await fetch(`${base}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      throw new Error(
        `WordPress API error: ${wpRes.status} ${errText.slice(0, 280)}`,
      );
    }

    const post = (await wpRes.json()) as {
      id?: number | string;
      link?: string;
      status?: string;
    };
    res.json({
      ok: true,
      postId: post.id,
      link: post.link,
      status: post.status,
    });
  } catch (e: unknown) {
    res
      .status(500)
      .json({ error: e instanceof Error ? e.message : 'Publish failed' });
  }
});

router.post('/signaldesk', requireUser, async (req: AuthedRequest, res) => {
  try {
    const {
      title,
      content,
      status = 'draft',
      excerpt,
      featuredMediaUrl,
      metaDescription,
      answerBlock,
      byline,
    } = req.body as {
      title?: string;
      content?: string;
      status?: string;
      excerpt?: string;
      featuredMediaUrl?: string;
      metaDescription?: string;
      answerBlock?: string;
      byline?: string;
    };
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const sb = getSupabaseAdmin()!;
    const { data: conn } = await sb
      .from('integration_connections')
      .select('metadata')
      .eq('user_id', req.userId!)
      .eq('provider', 'signaldesk')
      .maybeSingle();

    if (!conn?.metadata) {
      return res.status(400).json({
        error: 'Connect Signal Desk in Settings → Integrations first.',
      });
    }

    const meta = conn.metadata as {
      siteUrl: string;
      apiKey: string;
      webhookSecret?: string;
    };

    const result = await publishToSignalDeskApi({
      credentials: {
        siteUrl: meta.siteUrl,
        apiKey: meta.apiKey,
        webhookSecret: meta.webhookSecret,
      },
      title,
      content,
      status,
      excerpt,
      featuredMediaUrl,
      metaDescription,
      answerBlock,
      byline,
    });

    await sb.from('integration_connections').upsert({
      user_id: req.userId!,
      provider: 'signaldesk',
      access_token: null,
      refresh_token: null,
      metadata: {
        ...meta,
        lastRemoteId: result.postId != null ? String(result.postId) : null,
        lastRemoteUrl: result.link ?? null,
        lastRemoteStatus: result.status ?? null,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    res.json({
      ok: true,
      postId: result.postId,
      link: result.link,
      status: result.status,
    });
  } catch (e: unknown) {
    res
      .status(500)
      .json({ error: e instanceof Error ? e.message : 'Publish failed' });
  }
});

/** Meta tags pack for manual CMS paste */
router.post('/meta-export', requireUser, async (req, res) => {
  const { pages } = req.body as { pages: { url: string; title: string; metaDescription: string }[] };
  if (!pages?.length) {
    return res.status(400).json({ error: 'pages array required' });
  }
  const lines = pages.map(
    (p) =>
      `<!-- ${p.url} -->\n<title>${p.title}</title>\n<meta name="description" content="${p.metaDescription.replace(/"/g, '&quot;')}" />\n`
  );
  res.json({
    html: lines.join('\n'),
    json: pages,
  });
});

export default router;
