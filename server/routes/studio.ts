/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import {
  getOrCreateStudioAccount,
  productPayload,
  STUDIO_PRODUCTS,
  type StudioProductId,
} from '../lib/studioIdentity';
import { PRODUCT_NAME, serverPublicOrigin } from '../lib/brand';

const router = Router();

const CHURCH_PRODUCTS = [
  {
    id: 'vesper',
    name: 'Vesper',
    tagline: 'Cinematic reels from your sermons',
    href: 'https://vesper.biblefunland.com',
    category: 'church' as const,
  },
  {
    id: 'rhemanote',
    name: 'RhemaNote',
    tagline: 'Scripture-linked study notes from your messages',
    href: 'https://rhemanotes.biblefunland.com',
    category: 'church' as const,
  },
  {
    id: 'pulpit',
    name: 'Pulpit',
    tagline: 'Ministry command center — connect Vesper, Kerygma & RhemaNote',
    href: 'https://pulpit.biblefunland.com',
    category: 'hub' as const,
  },
];

const PERSONAS = [
  {
    id: 'local_business',
    label: 'Local business or church social',
    description: 'Autopilot social posts from your website',
    primaryProduct: 'kerygma',
    bundleId: 'social',
  },
  {
    id: 'agency',
    label: 'Marketing agency',
    description: 'SEO, citations, white-label audits, client brands',
    primaryProduct: 'ai_cmo',
    bundleId: 'studio',
  },
  {
    id: 'saas_dev',
    label: 'SaaS / dev team',
    description: 'Ship securely and get cited by AI buyers',
    primaryProduct: 'aegis',
    bundleId: 'devsec',
  },
  {
    id: 'content_founder',
    label: 'Content-first founder',
    description: 'Strategy, SEO audits, then distribute',
    primaryProduct: 'ai_cmo',
    bundleId: 'growth',
  },
  {
    id: 'church',
    label: 'Church media team',
    description: 'Sermon → reels, posts, and study notes',
    primaryProduct: 'pulpit',
  },
];

router.get('/catalog', (_req, res) => {
  const origin = serverPublicOrigin();

  res.json({
    hubUrl: `${origin}/studio`,
    appStudioUrl: `${origin}/app/studio`,
    narrative: 'Find it → Get cited → Strategize → Publish → Secure it',
    growthProducts: STUDIO_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      href: p.id === 'ai_cmo' ? `${origin}/app` : p.url,
      category: 'growth',
    })),
    churchProducts: CHURCH_PRODUCTS,
    personas: PERSONAS,
  });
});

const VALID_PRODUCTS = new Set<StudioProductId>(['ai_cmo', 'kerygma', 'citepilot', 'aegis']);

router.get('/identity', requireUser, async (req: AuthedRequest, res) => {
  try {
    const email = (req as AuthedRequest & { userEmail?: string }).userEmail
      || (await getSupabaseAdmin()!.auth.admin.getUserById(req.userId!)).data.user?.email
      || '';

    const account = await getOrCreateStudioAccount(req.userId!, email);
    res.json({
      email: account.email,
      products: productPayload(account),
      updatedAt: account.updated_at,
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to load studio identity' });
  }
});

router.patch('/identity', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { product, linked, externalId, githubLogin } = req.body as {
      product?: string;
      linked?: boolean;
      externalId?: string;
      githubLogin?: string;
    };

    if (!product || !VALID_PRODUCTS.has(product as StudioProductId)) {
      return res.status(400).json({ error: 'product must be one of: ai_cmo, kerygma, citepilot, aegis' });
    }

    if (product === 'ai_cmo') {
      return res.status(400).json({ error: `${PRODUCT_NAME} is always linked to your current session` });
    }

    const sb = getSupabaseAdmin()!;
    const email =
      (await sb.auth.admin.getUserById(req.userId!)).data.user?.email || '';
    const account = await getOrCreateStudioAccount(req.userId!, email);
    const linkedProducts = { ...account.linked_products };

    if (typeof linked === 'boolean') {
      linkedProducts[product as StudioProductId] = linked;
    }

    const patch: Record<string, unknown> = {
      linked_products: linkedProducts,
      updated_at: new Date().toISOString(),
    };

    if (product === 'kerygma' && externalId?.trim()) {
      patch.kerygma_user_id = externalId.trim();
      patch.clerk_id = externalId.trim();
      linkedProducts.kerygma = true;
      patch.linked_products = linkedProducts;
    }
    if (product === 'citepilot' && externalId?.trim()) {
      patch.citepilot_user_id = externalId.trim();
      linkedProducts.citepilot = true;
      patch.linked_products = linkedProducts;
    }
    if (product === 'aegis') {
      if (externalId?.trim()) patch.aegis_github_id = externalId.trim();
      if (githubLogin?.trim()) patch.aegis_github_login = githubLogin.trim();
      if (externalId?.trim() || githubLogin?.trim()) {
        linkedProducts.aegis = true;
        patch.linked_products = linkedProducts;
      }
    }

    const { data, error } = await sb
      .from('studio_accounts')
      .update(patch)
      .eq('user_id', req.userId!)
      .select('*')
      .single();

    if (error) throw error;

    const updated = {
      ...data,
      linked_products: linkedProducts,
    };

    res.json({
      email: updated.email,
      products: productPayload(updated as typeof account),
      updatedAt: updated.updated_at,
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to update studio identity' });
  }
});

export default router;
