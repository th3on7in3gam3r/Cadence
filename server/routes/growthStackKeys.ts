/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import {
  getGrowthStackKeysForUser,
  saveGrowthStackKeysForUser,
} from '../lib/growthStackKeys';

const router = Router();

router.get('/keys', requireUser, async (req: AuthedRequest, res) => {
  try {
    const keys = await getGrowthStackKeysForUser(req.userId!);
    return res.json(keys);
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to load growth stack keys';
    return res.status(500).json({ error: msg });
  }
});

router.put('/keys', requireUser, async (req: AuthedRequest, res) => {
  try {
    const body = req.body ?? {};
    const keys = await saveGrowthStackKeysForUser(req.userId!, {
      citePilotApiKey: String(body.citePilotApiKey ?? ''),
      kerygmaApiKey: String(body.kerygmaApiKey ?? ''),
      aegisApiKey: String(body.aegisApiKey ?? ''),
      postwickApiKey: String(body.postwickApiKey ?? ''),
    });
    return res.json({ ok: true, ...keys });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to save growth stack keys';
    return res.status(500).json({ error: msg });
  }
});

export default router;
