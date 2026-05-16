import request from 'supertest';
import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
  it('returns ok status', async () => {
    const originalUrl = process.env.SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_URL = originalUrl ?? 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = originalKey ?? 'test-key';

    const { app } = await import('../../server/app');

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });

    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_KEY;
    else process.env.SUPABASE_SERVICE_KEY = originalKey;
  });
});
