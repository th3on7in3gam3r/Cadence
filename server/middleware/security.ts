/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { isSupabaseConfigured } from '../lib/config';
import { resolveUserIdFromBearer } from '../db/supabaseAdmin';

const isProduction = process.env.NODE_ENV === 'production';
const apiToken = process.env.CMO_API_TOKEN?.trim();
const allowLocalhostWithoutToken =
  process.env.ALLOW_LOCALHOST_WITHOUT_TOKEN === 'true' || (!isProduction && !apiToken);

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.API_RATE_LIMIT_MAX || '40', 10);

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function isLocalhostRequest(req: Request): boolean {
  const ip = clientIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

export function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const custom = req.headers['x-cmo-access-token'];
  if (typeof custom === 'string') return custom.trim();
  return null;
}

/** Protects Gemini-backed routes from anonymous public abuse. */
export async function requireApiAccess(req: Request, res: Response, next: NextFunction) {
  const provided = extractAccessToken(req);

  // Cloud SaaS: signed-in users pass Supabase JWT (server hosts Gemini key)
  if (isSupabaseConfigured() && provided) {
    const userId = await resolveUserIdFromBearer(provided);
    if (userId) {
      (req as Request & { userId?: string }).userId = userId;
      return next();
    }
  }

  if (!apiToken) {
    if (isProduction && isSupabaseConfigured()) {
      return res.status(401).json({ error: 'Sign in required.' });
    }
    if (isProduction) {
      return res.status(503).json({
        error:
          'Server misconfiguration: set CMO_API_TOKEN in the environment before exposing this app publicly.',
      });
    }
    if (allowLocalhostWithoutToken && isLocalhostRequest(req)) {
      return next();
    }
    return res.status(401).json({
      error:
        'API access token required. Set CMO_API_TOKEN in .env.local and send Authorization: Bearer <token> from the client.',
    });
  }

  if (!provided || provided !== apiToken) {
    return res.status(401).json({ error: 'Invalid or missing API access token.' });
  }
  next();
}

export function rateLimitExpensiveApis(req: Request, res: Response, next: NextFunction) {
  const key = clientIp(req);
  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
    });
  }
  next();
}

export function getSecurityStatus() {
  return {
    apiTokenConfigured: !!apiToken,
    cloudConfigured: isSupabaseConfigured(),
    productionMode: isProduction,
    localhostBypass: allowLocalhostWithoutToken,
    rateLimitMax: RATE_LIMIT_MAX,
    rateLimitWindowMinutes: RATE_LIMIT_WINDOW_MS / 60000,
  };
}
