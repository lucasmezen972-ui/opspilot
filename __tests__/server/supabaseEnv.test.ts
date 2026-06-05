/**
 * @vitest-environment node
 */
import { expect, test, vi } from 'vitest';

test('uses fallback URL when SUPABASE_URL is missing', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_KEY;

  delete process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_KEY = 'test';

  vi.resetModules();
  const mod = await import('../../server/supabase');
  expect(mod.supabase).toBeDefined();

  process.env.SUPABASE_URL = originalUrl;
  process.env.SUPABASE_SERVICE_KEY = originalKey;
});

test('uses fallback anon key when SUPABASE_SERVICE_KEY is missing', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_KEY;

  process.env.SUPABASE_URL = 'https://example.supabase.co';
  delete process.env.SUPABASE_SERVICE_KEY;

  vi.resetModules();
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const mod = await import('../../server/supabase');
  expect(mod.supabase).toBeDefined();
  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();

  process.env.SUPABASE_URL = originalUrl;
  process.env.SUPABASE_SERVICE_KEY = originalKey;
});
