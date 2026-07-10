/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { limitsForPlan, PLAN_LIMITS } from './plans';

describe('plan limits', () => {
  it('free tier caps brands and audits', () => {
    const free = limitsForPlan('free');
    expect(free.brands).toBe(1);
    expect(free.seoAuditsPerMonth).toBe(3);
    expect(free.integrations).toBe(false);
    expect(free.approvalWorkflow).toBe(false);
    expect(free.whiteLabelReports).toBe(false);
  });

  it('pro unlocks integrations and white-label', () => {
    const pro = limitsForPlan('pro');
    expect(pro.integrations).toBe(true);
    expect(pro.whiteLabelReports).toBe(true);
    expect(pro.approvalWorkflow).toBe(false);
  });

  it('team enables approval workflow and seats', () => {
    const team = limitsForPlan('team');
    expect(team.approvalWorkflow).toBe(true);
    expect(team.seats).toBeGreaterThan(1);
  });

  it('pro unlocks deep crawl', () => {
    const pro = limitsForPlan('pro');
    expect(pro.deepCrawlEnabled).toBe(true);
    expect(pro.deepCrawlMaxPagesPerJob).toBe(100);
    expect(pro.quickCrawlMaxPages).toBe(20);
  });

  it('unknown plan falls back to free', () => {
    expect(limitsForPlan('unknown' as 'free')).toEqual(PLAN_LIMITS.free);
  });
});
