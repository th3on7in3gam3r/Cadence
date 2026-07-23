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
        error:
          'Connect WordPress or Signal Desk in Settings → Integrations first.',
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
    const description =
      (typeof metaDescription === 'string' && metaDescription.trim()) ||
      excerptText;
    const cover =
      typeof featuredMediaUrl === 'string' ? featuredMediaUrl.trim() : '';
    const answer =
      (typeof answerBlock === 'string' && answerBlock.trim()) ||
      description ||
      excerptText;

    const payload: Record<string, unknown> = {
      title,
      content,
      status,
      excerpt: excerptText,
    };

    // Signal Desk (WP-compatible) publish-ready fields; ignored by plain WordPress.
    if (cover) {
      payload.featured_media_url = cover;
    }
    payload.meta = {
      description,
      cover_image_url: cover || undefined,
      answer_block: answer,
      byline:
        typeof byline === 'string' && byline.trim() ? byline.trim() : undefined,
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
