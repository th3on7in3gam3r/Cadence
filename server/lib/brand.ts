/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PRODUCT_NAME = 'Cadence';

export const PRODUCTION_ORIGIN = 'https://growth.biblefunland.com';

export function serverPublicOrigin(): string {
  return (
    process.env.VITE_APP_URL?.replace(/\/+$/, '') ||
    process.env.APP_URL?.replace(/\/+$/, '') ||
    PRODUCTION_ORIGIN
  );
}
