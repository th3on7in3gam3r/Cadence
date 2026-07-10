import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './createTestApp';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('geminiConfigured');
    expect(res.body).toHaveProperty('security');
  });
});

describe('GET /api/metrics', () => {
  it('returns metrics object', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metrics');
  });
});
