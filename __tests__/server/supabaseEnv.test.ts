/**
 * @vitest-environment node
 */
import { expect, test, vi } from 'vitest'

const resetEnv = (url: string | undefined, key: string | undefined) => {
  if (url === undefined) {
    delete process.env.SUPABASE_URL
  } else {
    process.env.SUPABASE_URL = url
  }
  if (key === undefined) {
    delete process.env.SUPABASE_SERVICE_KEY
  } else {
    process.env.SUPABASE_SERVICE_KEY = key
  }
}

test('throws when SUPABASE_URL is missing', async () => {
  const originalUrl = process.env.SUPABASE_URL
  const originalKey = process.env.SUPABASE_SERVICE_KEY

  delete process.env.SUPABASE_URL
  process.env.SUPABASE_SERVICE_KEY = 'test'

  vi.resetModules()
  await expect(import('../../server/supabase')).rejects.toThrow(
    'SUPABASE_URL is required',
  )

  resetEnv(originalUrl, originalKey)
})

test('throws when SUPABASE_SERVICE_KEY is missing', async () => {
  const originalUrl = process.env.SUPABASE_URL
  const originalKey = process.env.SUPABASE_SERVICE_KEY

  process.env.SUPABASE_URL = 'https://example.supabase.co'
  delete process.env.SUPABASE_SERVICE_KEY

  vi.resetModules()
  await expect(import('../../server/supabase')).rejects.toThrow(
    'SUPABASE_SERVICE_KEY is required',
  )

  resetEnv(originalUrl, originalKey)
})
