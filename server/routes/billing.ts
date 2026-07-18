/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import {
  getStripe,
  isStripeConfigured,
  isStripeWebhookConfigured,
  resolveCheckoutBundle,
  checkoutSuccessUrl,
  checkoutCancelUrl,
  mapStripeSubscription,
} from '../lib/stripe';
import {
  STUDIO_BUNDLES,
  aiCmoPlanForBundle,
  bundleCatalogForApi,
  aiCmoOnlyCatalogForApi,
  bundleIdFromPriceId,
  bundlePriceId,
  type BundleId,
} from '../lib/bundles';
import { limitsForPlan, type PlanId } from '../lib/plans';
import { countSeoAuditsThisMonth, countDeepCrawlPagesThisMonth, getUserPlan } from '../lib/usage';
import { logger } from '../lib/logger';
import { fanOutStudioBillingEvent } from '../lib/billingFanout';
import { emitStudioOpsEvent } from '../lib/studioOps';
import { getOrCreateStudioAccount } from '../lib/studioIdentity';

const router = Router();

async function ensureSubscriptionRow(userId: string) {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
  if (!data) {
    await sb.from('subscriptions').insert({ user_id: userId, plan: 'free', status: 'active' });
  }
}

async function userEmail(userId: string): Promise<string> {
  const { data } = await getSupabaseAdmin()!.auth.admin.getUserById(userId);
  return data.user?.email || '';
}

async function ensureStripeCustomer(userId: string, email: string): Promise<string> {
  const sb = getSupabaseAdmin()!;
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  await ensureSubscriptionRow(userId);
  const { data: sub } = await sb
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { supabaseUserId: userId },
  });
  await sb.from('subscriptions').update({ stripe_customer_id: customer.id }).eq('user_id', userId);
  return customer.id;
}

async function syncAiCmoPlanFromBundles(userId: string) {
  const sb = getSupabaseAdmin()!;
  const { data: rows } = await sb
    .from('studio_billing_subscriptions')
    .select('bundle_id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing']);

  let best: PlanId = 'free';
  for (const row of rows || []) {
    if (row.status !== 'active' && row.status !== 'trialing') continue;
    const plan = aiCmoPlanForBundle(row.bundle_id as BundleId);
    if (plan === 'team') best = 'team';
    else if (plan === 'pro' && best !== 'team') best = 'pro';
  }

  const { data: legacy } = await sb
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (legacy?.status === 'active') {
    if (legacy.plan === 'team') best = 'team';
    else if (legacy.plan === 'pro' && best !== 'team') best = 'pro';
  }

  await sb.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: best,
      status: best === 'free' ? 'active' : 'active',
      seats: best === 'team' ? 3 : 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (best !== 'free') {
    await sb.from('organizations').update({ plan: best }).eq('owner_id', userId);
  }
}

async function upsertStudioBillingSub(input: {
  userId: string;
  bundleId: BundleId;
  stripeSubscriptionId: string;
  stripePriceId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
}) {
  const bundle = STUDIO_BUNDLES[input.bundleId];
  const sb = getSupabaseAdmin()!;
  await sb.from('studio_billing_subscriptions').upsert(
    {
      user_id: input.userId,
      bundle_id: input.bundleId,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_price_id: input.stripePriceId || null,
      status: input.status,
      products: bundle.products,
      entitlements: bundle.entitlements,
      current_period_end: input.currentPeriodEnd || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
}

router.get('/bundles', requireUser, async (_req: AuthedRequest, res) => {
  res.json({
    bundles: bundleCatalogForApi(),
    aiCmoPlans: aiCmoOnlyCatalogForApi(),
    stripeConfigured: isStripeConfigured(),
  });
});

router.get('/status', requireUser, async (req: AuthedRequest, res) => {
  try {
    await ensureSubscriptionRow(req.userId!);
    const plan = await getUserPlan(req.userId!);
    const limits = limitsForPlan(plan);
    const auditsUsed = await countSeoAuditsThisMonth(req.userId!);
    const deepPagesUsed = await countDeepCrawlPagesThisMonth(req.userId!);
    const sb = getSupabaseAdmin()!;
    const { data: sub } = await sb
      .from('subscriptions')
      .select('status, seats, current_period_end, stripe_customer_id, plan')
      .eq('user_id', req.userId!)
      .maybeSingle();

    const { data: studioSubs } = await sb
      .from('studio_billing_subscriptions')
      .select('bundle_id, status, products, entitlements, current_period_end, stripe_subscription_id')
      .eq('user_id', req.userId!)
      .order('updated_at', { ascending: false });

    let stripeSubscriptions: ReturnType<typeof mapStripeSubscription>[] = [];
    const stripe = getStripe();
    if (stripe && sub?.stripe_customer_id) {
      const list = await stripe.subscriptions.list({
        customer: sub.stripe_customer_id,
        status: 'all',
        limit: 20,
      });
      stripeSubscriptions = list.data.map(mapStripeSubscription);
    }

    res.json({
      plan,
      limits,
      usage: { seoAuditsThisMonth: auditsUsed, deepCrawlPagesThisMonth: deepPagesUsed },
      subscription: sub,
      activeBundles: (studioSubs || []).filter((r) =>
        ['active', 'trialing'].includes(r.status),
      ),
      studioSubscriptions: studioSubs || [],
      stripeSubscriptions,
      stripeConfigured: isStripeConfigured(),
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    res.status(500).json({ error: e instanceof Error ? e.message : 'Billing status failed' });
  }
});

router.post('/checkout', requireUser, async (req: AuthedRequest, res) => {
  try {
    const bundleId = resolveCheckoutBundle(req.body);
    if (!bundleId) {
      return res.status(400).json({
        error: 'Provide bundle (growth|social|devsec|studio) or plan (pro|team)',
      });
    }

    const interval =
      req.body?.interval === 'annual' ? ('annual' as const) : ('monthly' as const);

    const stripe = getStripe();
    const bundle = STUDIO_BUNDLES[bundleId];
    const priceId = bundlePriceId(bundleId, interval);
    if (!stripe || !priceId) {
      const envHint =
        interval === 'annual' && bundle.annualEnvKey
          ? bundle.annualEnvKey
          : bundle.envKey;
      return res.status(503).json({
        error: `Stripe price not configured for ${bundleId} (${interval}). Set ${envHint} in .env.local`,
      });
    }

    const email = await userEmail(req.userId!);
    const customerId = await ensureStripeCustomer(req.userId!, email);
    const studio = await getOrCreateStudioAccount(req.userId!, email);

    const quantity = bundleId === 'ai_cmo_team' || bundleId === 'studio' ? 3 : 1;
    const metadata = {
      userId: req.userId!,
      supabaseUserId: req.userId!,
      bundleId,
      email,
      products: bundle.products.join(','),
      clerkId: studio.clerk_id || '',
      kerygmaUserId: studio.kerygma_user_id || '',
      citepilotUserId: studio.citepilot_user_id || '',
      aegisGithubLogin: studio.aegis_github_login || '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity }],
      success_url: checkoutSuccessUrl(),
      cancel_url: checkoutCancelUrl(),
      metadata,
      subscription_data: { metadata },
    });

    res.json({ url: session.url, bundleId });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Checkout failed' });
  }
});

router.post('/portal', requireUser, async (req: AuthedRequest, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
    const sb = getSupabaseAdmin()!;
    const { data: sub } = await sb
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.userId!)
      .maybeSingle();
    if (!sub?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account yet — subscribe to a plan first' });
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: checkoutSuccessUrl().replace('?billing=success', ''),
    });
    res.json({ url: portal.url });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Portal failed' });
  }
});

async function processBundleActivation(input: {
  userId: string;
  email: string;
  bundleId: BundleId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  eventType: 'bundle.activated' | 'bundle.updated' | 'bundle.canceled';
}) {
  const bundle = STUDIO_BUNDLES[input.bundleId];
  const sb = getSupabaseAdmin()!;

  if (input.eventType === 'bundle.canceled') {
    await sb
      .from('studio_billing_subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', input.stripeSubscriptionId);
  } else {
    await upsertStudioBillingSub({
      userId: input.userId,
      bundleId: input.bundleId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripePriceId: input.stripePriceId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
    });
  }

  if (bundle.entitlements.ai_cmo) {
    const plan = bundle.entitlements.ai_cmo.plan;
    await sb.from('subscriptions').upsert(
      {
        user_id: input.userId,
        plan,
        status: input.status === 'canceled' ? 'canceled' : 'active',
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        seats: plan === 'team' ? 3 : 1,
        current_period_end: input.currentPeriodEnd || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (input.status !== 'canceled') {
      await sb.from('organizations').update({ plan }).eq('owner_id', input.userId);
    }
  } else {
    await syncAiCmoPlanFromBundles(input.userId);
  }

  const studio = await getOrCreateStudioAccount(input.userId, input.email);
  const fanout = await fanOutStudioBillingEvent({
    id: randomUUID(),
    type: input.eventType,
    bundleId: input.bundleId,
    supabaseUserId: input.userId,
    email: input.email,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    products: [...bundle.products],
    entitlements: bundle.entitlements as Record<string, unknown>,
    linkedIds: {
      clerkId: studio.clerk_id,
      citepilotUserId: studio.citepilot_user_id,
      kerygmaUserId: studio.kerygma_user_id,
      aegisGithubLogin: studio.aegis_github_login,
    },
    occurredAt: new Date().toISOString(),
  });

  logger.info('studio_billing_fanout', {
    userId: input.userId,
    bundleId: input.bundleId,
    eventType: input.eventType,
    delivered: fanout.delivered.length,
    skipped: fanout.skipped.length,
  });

  emitStudioOpsEvent({
    product: 'cadence',
    event: input.eventType,
    email: input.email,
    externalUserId: input.userId,
    metadata: {
      bundleId: input.bundleId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      products: [...bundle.products],
      fanoutDelivered: fanout.delivered.length,
    },
  });
}

/** Stripe webhook — mount with express.raw in server.ts */
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) throw new Error('Stripe webhook not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  const sb = getSupabaseAdmin()!;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: Record<string, string>;
      subscription?: string;
      customer?: string;
    };
    const userId = session.metadata?.supabaseUserId || session.metadata?.userId;
    const bundleId = (session.metadata?.bundleId || 'ai_cmo_pro') as BundleId;
    const email = session.metadata?.email || '';
    if (userId && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
      const priceId = subscription.items.data[0]?.price.id || null;
      const resolvedBundle = (priceId && bundleIdFromPriceId(priceId)) || bundleId;
      const periodEnd =
        (subscription as { current_period_end?: number }).current_period_end ?? null;
      await processBundleActivation({
        userId,
        email,
        bundleId: resolvedBundle,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        eventType: 'bundle.activated',
      });
      logger.info('subscription_activated', { userId, bundleId: resolvedBundle });
    }
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data.object as {
      id: string;
      customer?: string;
      status: string;
      metadata?: Record<string, string>;
      current_period_end?: number;
      items: { data: { price: { id: string } }[] };
    };
    const priceId = sub.items.data[0]?.price.id;
    const bundleId = priceId ? bundleIdFromPriceId(priceId) : null;
    const userId =
      sub.metadata?.supabaseUserId ||
      sub.metadata?.userId ||
      (
        await sb
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', sub.customer)
          .maybeSingle()
      ).data?.user_id;

    if (userId && bundleId) {
      const email = await userEmail(userId);
      const canceled = event.type === 'customer.subscription.deleted' || sub.status === 'canceled';
      await processBundleActivation({
        userId,
        email,
        bundleId,
        stripeCustomerId: String(sub.customer),
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: canceled ? 'canceled' : sub.status,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        eventType: canceled ? 'bundle.canceled' : 'bundle.updated',
      });
    } else if (userId && !bundleId && event.type === 'customer.subscription.deleted') {
      await sb.from('subscriptions').update({ plan: 'free', status: 'canceled' }).eq('user_id', userId);
      await syncAiCmoPlanFromBundles(userId);
    }
  }

  return { received: true };
}

export default router;
