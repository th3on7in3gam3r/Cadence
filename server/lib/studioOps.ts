/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { logger } from './logger';

export type StudioOpsProduct = 'cadence' | 'kerygma' | 'citepilot' | 'aegis' | 'pulpit' | 'stripe';

export interface StudioOpsEvent {
  product: StudioOpsProduct;
  event: string;
  email?: string | null;
  externalUserId?: string | null;
  metadata?: Record<string, unknown>;
}

function studioOpsUrl(): string | null {
  const raw = process.env.STUDIO_OPS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

function studioOpsSecret(): string | null {
  return process.env.STUDIO_OPS_WEBHOOK_SECRET?.trim() || null;
}

function signStudioOpsPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/** Fire-and-forget — never blocks product flows. */
export function emitStudioOpsEvent(input: StudioOpsEvent): void {
  const baseUrl = studioOpsUrl();
  const secret = studioOpsSecret();
  if (!baseUrl || !secret) return;

  const body = JSON.stringify({
    product: input.product,
    event: input.event,
    email: input.email ?? null,
    externalUserId: input.externalUserId ?? null,
    metadata: input.metadata ?? {},
  });

  const signature = signStudioOpsPayload(body, secret);

  void fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Studio-Ops-Signature': signature,
    },
    body,
    signal: AbortSignal.timeout(8000),
  })
    .then((res) => {
      if (!res.ok) {
        logger.warn('studio_ops_emit_failed', {
          event: input.event,
          status: res.status,
        });
      }
    })
    .catch((err) => {
      logger.warn('studio_ops_emit_error', {
        event: input.event,
        message: err instanceof Error ? err.message : String(err),
      });
    });
}
