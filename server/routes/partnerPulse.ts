/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Partner APIs Cadence exposes for Pulse (Bearer PULSE_PARTNER_SECRET).
 */

import { Router } from 'express';
import {
  computeCadenceDrove,
  partnerSecretAuthorized,
  pushCadenceDroveToPulse,
} from '../lib/cadenceDrove';
import { pulseSiteIdFromDomain } from '../lib/pulseSite';
import { domainFromBrandUrl } from '../lib/websiteUrl';

const router = Router();

router.get('/pulse/drove', async (req, res) => {
  if (!partnerSecretAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const days = Number(req.query.days || 7);
  const rawSite = String(req.query.siteId || '').trim();
  const rawDomain = String(req.query.domain || '').trim();

  let siteId = rawSite;
  if (!siteId && rawDomain) {
    const domain = domainFromBrandUrl(rawDomain) || rawDomain;
    siteId = pulseSiteIdFromDomain(domain);
  }
  if (!siteId) {
    return res.status(400).json({ error: 'siteId or domain is required' });
  }

  const payload = await computeCadenceDrove(siteId, days);
  // Keep Pulse cache warm when Cadence is queried
  void pushCadenceDroveToPulse(siteId, days);
  return res.json({ ok: true, ...payload });
});

export default router;
