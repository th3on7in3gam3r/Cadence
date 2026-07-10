/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Stripe from 'stripe';
import { appPublicUrl } from './config';
import {
  bundleIdFromPriceId,
  bundlePriceId,
  type BundleId,
} from './bundles';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

export function isStripeWebhookConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

/** @deprecated use bundlePriceId('ai_cmo_pro' | 'ai_cmo_team') */
export function stripePriceId(plan: 'pro' | 'team'): string | null {
  return bundlePriceId(plan === 'pro' ? 'ai_cmo_pro' : 'ai_cmo_team');
}

export function resolveCheckoutBundle(input: {
  bundle?: string;
  plan?: string;
}): BundleId | null {
  if (input.bundle && bundlePriceId(input.bundle as BundleId)) {
    return input.bundle as BundleId;
  }
  if (input.plan === 'pro') return 'ai_cmo_pro';
  if (input.plan === 'team') return 'ai_cmo_team';
  return null;
}

export function checkoutSuccessUrl(): string {
  return `${appPublicUrl()}/app/settings?billing=success`;
}

export function checkoutCancelUrl(): string {
  return `${appPublicUrl()}/app/settings?billing=cancel`;
}

export function mapStripeSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id || null;
  const bundleId = priceId ? bundleIdFromPriceId(priceId) : null;
  const periodEnd =
    (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null;
  return {
    id: sub.id,
    status: sub.status,
    priceId,
    bundleId,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}
