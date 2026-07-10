/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';

const router = Router();

router.post('/wordpress', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { title, content, status = 'draft', excerpt } = req.body;
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
      return res.status(400).json({ error: 'Connect WordPress in Settings → Integrations first.' });
    }

    const meta = conn.metadata as { siteUrl: string; username: string; appPassword: string };
    const base = meta.siteUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${meta.username}:${meta.appPassword}`).toString('base64');

    const wpRes = await fetch(`${base}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status,
        excerpt: excerpt || '',
      }),
    });

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      throw new Error(`WordPress API error: ${wpRes.status} ${errText.slice(0, 200)}`);
    }

    const post = await wpRes.json();
    res.json({
      ok: true,
      postId: post.id,
      link: post.link,
      status: post.status,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Publish failed' });
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
