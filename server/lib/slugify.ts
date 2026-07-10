/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function slugifyBrandId(brandUrl: string): string {
  if (!brandUrl) return 'workspace';
  return brandUrl
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase() || 'workspace';
}
