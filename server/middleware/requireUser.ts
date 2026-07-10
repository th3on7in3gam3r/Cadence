/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { extractAccessToken } from './security';
import { resolveUserIdFromBearer } from '../db/supabaseAdmin';
import { isSupabaseConfigured } from '../lib/config';

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Requires a valid Supabase session when cloud is configured. */
export async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Cloud mode is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }
  const token = extractAccessToken(req);
  const userId = await resolveUserIdFromBearer(token);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required for cloud workspace.' });
  }
  req.userId = userId;
  next();
}
