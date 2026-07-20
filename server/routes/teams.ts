/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { getOrCreateOrg, getUserPlan, countBrandsForUser } from '../lib/usage';
import { limitsForPlan } from '../lib/plans';
import { slugifyBrandId } from '../lib/slugify';
import { isSchemaNotReadyError, isUniqueViolationError, schemaSetupHint } from '../lib/dbErrors';

const router = Router();

router.get('/org', requireUser, async (req: AuthedRequest, res) => {
  try {
    const org = await getOrCreateOrg(req.userId!);
    res.json({ org });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to load org' });
  }
});

router.patch('/org', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { agencyName, agencyLogoUrl, name } = req.body;
    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('organizations')
      .update({
        ...(name && { name }),
        ...(agencyName !== undefined && { agency_name: agencyName }),
        ...(agencyLogoUrl !== undefined && { agency_logo_url: agencyLogoUrl }),
      })
      .eq('id', org.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ org: data });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Update failed' });
  }
});

router.get('/brands', requireUser, async (req: AuthedRequest, res) => {
  try {
    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('brands')
      .select('id, slug, name, brand_url, updated_at')
      .eq('org_id', org.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ brands: data || [] });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to list brands' });
  }
});

router.get('/brands/:id', requireUser, async (req: AuthedRequest, res) => {
  try {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('brands')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Brand not found' });
    res.json({ brand: data });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to load brand' });
  }
});

router.post('/brands', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { name, brandUrl, payload } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const plan = await getUserPlan(req.userId!);
    const limits = limitsForPlan(plan);
    const count = await countBrandsForUser(req.userId!);
    if (count >= limits.brands) {
      return res.status(403).json({
        error: `Your ${plan} plan allows ${limits.brands} brand(s). Upgrade to add more clients.`,
      });
    }

    const org = await getOrCreateOrg(req.userId!);
    const slug = slugifyBrandId(brandUrl || name);
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('brands')
      .insert({
        org_id: org.id,
        slug,
        name,
        brand_url: brandUrl || null,
        payload: payload || {},
      })
      .select('*')
      .single();
    if (error) {
      if (isUniqueViolationError(error)) {
        const { data: existing, error: lookupError } = await sb
          .from('brands')
          .select('*')
          .eq('org_id', org.id)
          .eq('slug', slug)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) return res.json({ brand: existing });
      }
      throw error;
    }
    res.json({ brand: data });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to create brand' });
  }
});

router.put('/brands/:id', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { name, brandUrl, payload } = req.body;
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('brands')
      .update({
        ...(name && { name }),
        ...(brandUrl !== undefined && { brand_url: brandUrl }),
        ...(payload && { payload }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ brand: data });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to update brand' });
  }
});

router.delete('/brands/:id', requireUser, async (req: AuthedRequest, res) => {
  try {
    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data: brand, error: fetchError } = await sb
      .from('brands')
      .select('id, org_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    if (brand.org_id !== org.id) {
      return res.status(403).json({ error: 'You do not have access to this brand.' });
    }

    const { count, error: countError } = await sb
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id);
    if (countError) throw countError;
    if ((count || 0) <= 1) {
      return res.status(400).json({ error: 'You need at least one brand workspace.' });
    }

    const { error } = await sb.from('brands').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to delete brand' });
  }
});

router.get('/members', requireUser, async (req: AuthedRequest, res) => {
  try {
    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from('organization_members')
      .select('id, email, role, invited_at, joined_at, user_id')
      .eq('org_id', org.id)
      .order('invited_at', { ascending: false });
    if (error) throw error;
    res.json({ members: data || [] });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to list members' });
  }
});

router.post('/members/invite', requireUser, async (req: AuthedRequest, res) => {
  try {
    const { email, role = 'editor' } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!['admin', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or editor' });
    }

    const plan = await getUserPlan(req.userId!);
    const limits = limitsForPlan(plan);
    if (plan !== 'team') {
      return res.status(403).json({ error: 'Team invites require the Team plan.' });
    }

    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { count } = await sb
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id);

    if ((count || 0) >= limits.seats) {
      return res.status(403).json({ error: `Team plan includes ${limits.seats} seats.` });
    }

    const token = crypto.randomUUID();
    const { data, error } = await sb
      .from('organization_members')
      .upsert({
        org_id: org.id,
        email: email.toLowerCase().trim(),
        role,
        invite_token: token,
        invited_at: new Date().toISOString(),
      }, { onConflict: 'org_id,email' })
      .select('*')
      .single();
    if (error) throw error;

    res.json({
      member: data,
      inviteUrl: `${process.env.APP_URL || 'http://localhost:3000'}/app/settings?invite=${token}`,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Invite failed' });
  }
});

router.get('/role', requireUser, async (req: AuthedRequest, res) => {
  try {
    const org = await getOrCreateOrg(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data } = await sb
      .from('organization_members')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', req.userId!)
      .maybeSingle();
    res.json({
      role: data?.role || (org.owner_id === req.userId ? 'admin' : 'editor'),
      canApprove: (await getUserPlan(req.userId!)) === 'team',
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Role check failed' });
  }
});

export default router;
