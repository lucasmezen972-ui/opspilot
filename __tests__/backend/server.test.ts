import request from 'supertest'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { app } from '../../server/app'

vi.mock('../../server/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: '1', title: 'Test' }, error: null })
        })
      })
    })
  }
}))

describe('OpsPilot backend', () => {
  beforeAll(() => {
    process.env.API_TOKEN = 'test-token'
  })

  it('returns ok on health check', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('rejects unauthorized access', async () => {
    const res = await request(app).get('/audits')
    expect(res.status).toBe(401)
  })

  it('validates request body', async () => {
    const res = await request(app)
      .post('/audits')
      .set('Authorization', 'Bearer test-token')
      .send({})
    expect(res.status).toBe(400)
  })

  it('accepts valid request', async () => {
    const res = await request(app)
      .post('/audits')
      .set('Authorization', 'Bearer test-token')
      .send({ title: 'Test' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: '1', title: 'Test' })
  })
})
