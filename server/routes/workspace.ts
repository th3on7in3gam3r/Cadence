/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import { emitStudioOpsEvent } from '../lib/studioOps';

const router = Router();

router.get('/current', requireUser, async (req: AuthedRequest, res) => {
  try {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('workspaces')
      .select('id, name, brand_url, payload, updated_at')
      .eq('user_id', req.userId!)
      .maybeSingle();
    if (error) throw error;
    res.json({ workspace: data });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to load workspace';
    res.status(500).json({ error: msg });
  }
});

router.put('/current', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { name, brandUrl, payload } = req.body;
    const sb = getSupabaseAdmin()!;
    const { data: prior } = await sb
      .from('workspaces')
      .select('id, brand_url')
      .eq('user_id', req.userId!)
      .maybeSingle();
    const row = {
      user_id: req.userId!,
      name: name || 'My workspace',
      brand_url: brandUrl || null,
      payload: payload || {},
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from('workspaces')
      .upsert(row, { onConflict: 'user_id' })
      .select('id, updated_at')
      .single();
    if (error) throw error;

    if (brandUrl && !prior?.brand_url) {
      const email =
        (await sb.auth.admin.getUserById(req.userId!)).data.user?.email || null;
      emitStudioOpsEvent({
        product: 'cadence',
        event: 'workspace.created',
        email,
        externalUserId: req.userId!,
        metadata: { brandUrl, workspaceId: data.id },
      });
    }

    res.json({ ok: true, workspace: data });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to save workspace';
    res.status(500).json({ error: msg });
  }
});

router.get('/runs', requireUser, async (req: AuthedRequest, res) => {
  try {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('campaign_runs')
      .select('id, label, brand_url, payload, created_at, updated_at')
      .eq('user_id', req.userId!)
      .order('updated_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    res.json({ runs: data || [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load runs';
    res.status(500).json({ error: msg });
  }
});

router.post('/runs', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { label, brandUrl, payload } = req.body;
    if (!label || !payload) {
      return res.status(400).json({ error: 'label and payload are required' });
    }
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('campaign_runs')
      .insert({
        user_id: req.userId!,
        label,
        brand_url: brandUrl || null,
        payload,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    res.json({ ok: true, id: data.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save run';
    res.status(500).json({ error: msg });
  }
});

router.delete('/runs/:id', requireUser, async (req: AuthedRequest, res) => {
  try {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb
      .from('campaign_runs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete run';
    res.status(500).json({ error: msg });
  }
});

export default router;
