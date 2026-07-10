/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireApiAccess } from '../middleware/security';
import type { AuthedRequest } from '../middleware/requireUser';
import { buildSeoAuditReportHtml } from '../lib/reportHtml';
import { getUserPlan } from '../lib/usage';
import { limitsForPlan } from '../lib/plans';

const router = Router();

router.post('/seo-audit', requireApiAccess, async (req: AuthedRequest, res) => {
  try {
    const { audit, branding, forceBasic } = req.body;
    if (!audit || !branding?.clientName || !branding?.siteUrl) {
      return res.status(400).json({ error: 'audit and branding (clientName, siteUrl) are required.' });
    }

    let agencyName = branding.agencyName;
    let agencyLogoUrl = branding.agencyLogoUrl;

    if (req.userId && !forceBasic) {
      const plan = await getUserPlan(req.userId);
      const limits = limitsForPlan(plan);
      if (!limits.whiteLabelReports) {
        agencyName = undefined;
        agencyLogoUrl = undefined;
      }
    } else if (!forceBasic && (agencyName || agencyLogoUrl)) {
      // Local dev: allow white-label when client explicitly saved agency settings
    }

    const html = buildSeoAuditReportHtml(audit, {
      agencyName,
      agencyLogoUrl,
      clientName: branding.clientName,
      siteUrl: branding.siteUrl,
      generatedAt: branding.generatedAt,
    });

    res.json({ html, whiteLabel: !!(agencyName || agencyLogoUrl) });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Report generation failed' });
  }
});

export default router;
