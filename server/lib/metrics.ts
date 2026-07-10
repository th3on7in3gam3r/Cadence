/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

const counters = new Map<string, number>();

export function recordMetric(name: string, labels?: Record<string, string>) {
  const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
  counters.set(key, (counters.get(key) || 0) + 1);
}

export function getMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const path = req.route?.path || req.path;
    if (path.startsWith('/api/')) {
      recordMetric('api_request', { path, status: String(res.statusCode) });
      logger.info('api_request', {
        method: req.method,
        path,
        status: res.statusCode,
        durationMs,
      });
    }
  });
  next();
}

export function metricsHandler(_req: Request, res: Response) {
  res.json({ metrics: getMetricsSnapshot() });
}
