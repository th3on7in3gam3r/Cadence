/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  signStudioBillingPayload,
  verifyStudioBillingSignature,
} from './billingFanout';

describe('studio billing fan-out signatures', () => {
  it('signs and verifies payload', () => {
    const body = JSON.stringify({ bundleId: 'growth', email: 'a@b.com' });
    const sig = signStudioBillingPayload(body, 'test-secret');
    expect(verifyStudioBillingSignature(body, sig, 'test-secret')).toBe(true);
    expect(verifyStudioBillingSignature(body, 'bad', 'test-secret')).toBe(false);
  });
});
