/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from '../lib/api';
import type { SeoAgentAuditResult } from '../types';

export async function exportSeoAuditPdf(
  audit: SeoAgentAuditResult,
  branding: {
    clientName: string;
    siteUrl: string;
    agencyName?: string;
    agencyLogoUrl?: string;
  }
): Promise<void> {
  const res = await apiFetch('/api/reports/seo-audit', {
    method: 'POST',
    body: JSON.stringify({ audit, branding }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Report export failed');
  }
  const { html } = await res.json();
  openPrintWindow(html);
}

export function openPrintWindow(html: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) throw new Error('Pop-up blocked. Allow pop-ups to export PDF.');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
