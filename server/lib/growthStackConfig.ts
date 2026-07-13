/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function citePilotApiBase(): string {
  return (process.env.CITEPILOT_API_URL || 'https://getcitepilot.com').replace(/\/+$/, '');
}

export function aegisApiBase(): string {
  return (process.env.AEGIS_API_URL || 'https://aegis-loop.com').replace(/\/+$/, '');
}

export function pulseApiBase(): string {
  return (process.env.PULSE_API_URL || 'https://pulse-5o1m.onrender.com').replace(
    /\/+$/,
    '',
  );
}
