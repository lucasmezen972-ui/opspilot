import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../../server/app'

describe('OpsPilot backend', () => {
  it('returns ok on health check', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
