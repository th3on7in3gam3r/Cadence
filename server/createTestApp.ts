/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getSecurityStatus } from './middleware/security';
import { isSupabaseConfigured, isHostedAiMode } from './lib/config';
import { metricsHandler } from './lib/metrics';

/** Minimal Express app for health/API tests (no Vite, no listen). */
export function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      geminiConfigured: hasKey,
      hostedAi: isHostedAiMode(),
      cloudEnabled: isSupabaseConfigured(),
      security: getSecurityStatus(),
    });
  });

  app.get('/api/metrics', metricsHandler);

  return app;
}
