import { describe, expect, it } from 'vitest';
import { campaignLandingUrl, withUtm } from './utm';

describe('withUtm', () => {
  it('appends utm params without removing existing query params', () => {
    const out = withUtm('https://kerygmasocial.com/sign-up?url=https%3A%2F%2Facme.com', {
      source: 'cadence',
      campaign: 'Spring Launch',
      medium: 'referral',
    });
    const parsed = new URL(out);
    expect(parsed.searchParams.get('url')).toBe('https://acme.com');
    expect(parsed.searchParams.get('utm_source')).toBe('cadence');
    expect(parsed.searchParams.get('utm_campaign')).toBe('spring-launch');
    expect(parsed.searchParams.get('utm_medium')).toBe('referral');
  });

  it('tags campaign landing URLs for Pulse-tracked hosts', () => {
    const out = campaignLandingUrl('https://kerygmasocial.com/', {
      campaign: 'weekly-digest',
      medium: 'email',
    });
    expect(out).toContain('utm_source=cadence');
    expect(out).toContain('utm_campaign=weekly-digest');
    expect(out).toContain('utm_medium=email');
  });
});
