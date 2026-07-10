/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => emit('debug', msg, fields),
  info: (msg: string, fields?: LogFields) => emit('info', msg, fields),
  warn: (msg: string, fields?: LogFields) => emit('warn', msg, fields),
  error: (msg: string, fields?: LogFields) => emit('error', msg, fields),
};

export function initSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  try {
    // Dynamic optional dependency — install @sentry/node when enabling production monitoring
    logger.info('Sentry DSN configured', { feature: 'sentry' });
  } catch {
    logger.warn('Sentry init skipped');
  }
}
