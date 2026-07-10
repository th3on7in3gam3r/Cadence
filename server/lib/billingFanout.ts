/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export function studioBillingFanoutSecret(): string | null {
  return process.env.STUDIO_BILLING_FANOUT_SECRET?.trim() || null;
}

export function signStudioBillingPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyStudioBillingSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signStudioBillingPayload(body, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

export interface StudioBillingFanoutEvent {
  id: string;
  type: 'bundle.activated' | 'bundle.updated' | 'bundle.canceled';
  bundleId: string;
  supabaseUserId: string;
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  products: string[];
  entitlements: Record<string, unknown>;
  linkedIds: {
    clerkId?: string | null;
    citepilotUserId?: string | null;
    kerygmaUserId?: string | null;
    aegisGithubLogin?: string | null;
  };
  occurredAt: string;
}

function fanoutUrlForProduct(product: string): string | null {
  switch (product) {
    case 'kerygma':
      return process.env.KERYGMA_STUDIO_BILLING_URL?.trim() || null;
    case 'citepilot':
      return process.env.CITEPILOT_STUDIO_BILLING_URL?.trim() || null;
    case 'aegis':
      return process.env.AEGIS_STUDIO_BILLING_URL?.trim() || null;
    default:
      return null;
  }
}

export async function fanOutStudioBillingEvent(
  event: StudioBillingFanoutEvent,
): Promise<{ delivered: string[]; skipped: string[] }> {
  const secret = studioBillingFanoutSecret();
  const body = JSON.stringify(event);
  const delivered: string[] = [];
  const skipped: string[] = [];

  const targets = new Set<string>();
  for (const product of event.products) {
    const url = fanoutUrlForProduct(product);
    if (url) targets.add(url);
  }

  if (!secret || targets.size === 0) {
    return { delivered, skipped: [...event.products] };
  }

  const signature = signStudioBillingPayload(body, secret);
  await Promise.all(
    [...targets].map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Studio-Billing-Signature': signature,
            'X-Studio-Billing-Event': event.type,
          },
          body,
          signal: AbortSignal.timeout(12000),
        });
        if (res.ok) delivered.push(url);
        else skipped.push(url);
      } catch {
        skipped.push(url);
      }
    }),
  );

  return { delivered, skipped };
}
