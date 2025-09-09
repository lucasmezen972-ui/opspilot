import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// Mock Platform to force native environment
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

// In-memory SQLite mock
const tables: Record<string, any[]> = { tasks: [], audits: [], photos: [] }
let counters = { tasks: 1, audits: 1, photos: 1 }
const createRows = (rows: any[]) => ({ length: rows.length, item: (i: number) => rows[i] })

const mockDb = {
  transaction: vi.fn((cb: any) => {
    const tx = {
      executeSql(
        sql: string,
        params: any[] = [],
        success?: (t: any, result: any) => void,
        error?: (t: any, err: any) => void,
      ) {
        try {
          sql = sql.trim()
          if (sql.startsWith('CREATE TABLE')) {
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('INSERT INTO tasks')) {
            tables.tasks.push({ id: counters.tasks++, data: params[0], synced: params[1] ?? 0 })
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('INSERT INTO audits')) {
            tables.audits.push({ id: counters.audits++, data: params[0], synced: params[1] ?? 0 })
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('INSERT INTO photos')) {
            tables.photos.push({ id: counters.photos++, uri: params[0], audit_id: params[1], synced: 0 })
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('SELECT * FROM tasks WHERE synced = 0')) {
            const rows = tables.tasks.filter((t) => t.synced === 0)
            success?.(null, { rows: createRows(rows) })
            return
          }
          if (sql.startsWith('SELECT * FROM audits WHERE synced = 0')) {
            const rows = tables.audits.filter((a) => a.synced === 0)
            success?.(null, { rows: createRows(rows) })
            return
          }
          if (sql.startsWith('SELECT * FROM photos WHERE synced = 0')) {
            const rows = tables.photos.filter((p) => p.synced === 0)
            success?.(null, { rows: createRows(rows) })
            return
          }
          if (sql.startsWith('UPDATE tasks SET synced = 1 WHERE id = ?')) {
            const [id] = params
            const t = tables.tasks.find((r) => r.id === id)
            if (t) t.synced = 1
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('UPDATE audits SET synced = 1 WHERE id = ?')) {
            const [id] = params
            const a = tables.audits.find((r) => r.id === id)
            if (a) a.synced = 1
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('UPDATE photos SET synced = 1 WHERE id = ?')) {
            const [id] = params
            const p = tables.photos.find((r) => r.id === id)
            if (p) p.synced = 1
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('UPDATE photos SET audit_id = ? WHERE audit_id = ?')) {
            const [newId, oldId] = params
            tables.photos.forEach((p) => {
              if (p.audit_id === oldId) p.audit_id = newId
            })
            success?.(null, { rows: createRows([]) })
            return
          }
          if (sql.startsWith('SELECT data FROM tasks')) {
            const rows = tables.tasks.map((t) => ({ data: t.data }))
            success?.(null, { rows: createRows(rows) })
            return
          }
          if (sql.startsWith('SELECT data FROM audits')) {
            const rows = tables.audits.map((a) => ({ data: a.data }))
            success?.(null, { rows: createRows(rows) })
            return
          }
          success?.(null, { rows: createRows([]) })
        } catch (e) {
          error?.(null, e)
        }
      },
    }
    cb(tx)
  }),
}

vi.mock('expo-sqlite', () => ({ openDatabase: vi.fn(() => mockDb) }))

// Supabase mock setup
var supabaseMock: any = { fail: false }
vi.mock('../../lib/supabase', () => ({ supabase: supabaseMock }))

const auditSelectEqSingle = vi.fn(async () => ({ data: { photos: [] }, error: supabaseMock.fail ? new Error('fail') : null }))
const auditSelect = vi.fn(() => ({ eq: vi.fn(() => ({ single: auditSelectEqSingle })) }))
const auditUpdateEq = vi.fn(async () => ({ error: supabaseMock.fail ? new Error('fail') : null }))
const auditUpdate = vi.fn(() => ({ eq: auditUpdateEq }))
const auditInsertSelectSingle = vi.fn(async () => ({ data: { id: 'audit-server', photos: [] }, error: supabaseMock.fail ? new Error('fail') : null }))
const auditInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: auditInsertSelectSingle })) }))
const auditsUpsert = vi.fn(async () => ({ error: supabaseMock.fail ? new Error('fail') : null }))
const tasksUpsert = vi.fn(async () => ({ error: supabaseMock.fail ? new Error('fail') : null }))
const tasksInsert = vi.fn(async () => ({ error: supabaseMock.fail ? new Error('fail') : null }))

const fromMock = vi.fn((table: string) => {
  if (table === 'tasks') return { upsert: tasksUpsert, insert: tasksInsert }
  if (table === 'audits') return { upsert: auditsUpsert, insert: auditInsert, select: auditSelect, update: auditUpdate }
  return {}
})

const storageUpload = vi.fn(async () => ({ error: supabaseMock.fail ? new Error('fail') : null }))
const storageGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'http://example.com/photo.jpg' } }))
const storageFrom = vi.fn(() => ({ upload: storageUpload, getPublicUrl: storageGetPublicUrl }))

supabaseMock.from = fromMock
supabaseMock.storage = { from: storageFrom }

// Mock fetch for photo upload
;(global as any).fetch = vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(new Blob()) }))

let offlineHelpers: any
let queueTask: any
let queuePhoto: any
let syncPendingData: any
let __setDbForTests: any

beforeAll(async () => {
  const offline = await import('../../lib/offline')
  offlineHelpers = offline.offlineHelpers
  __setDbForTests = offline.__setDbForTests
  __setDbForTests(mockDb)
  ;({ queueTask, queuePhoto, syncPendingData } = offlineHelpers)
})

beforeEach(() => {
  tables.tasks = []
  tables.audits = []
  tables.photos = []
  counters = { tasks: 1, audits: 1, photos: 1 }
  supabaseMock.fail = false
  fromMock.mockClear()
  auditUpdateEq.mockClear()
  storageFrom.mockClear()
  storageUpload.mockClear()
  offlineHelpers.isOnline = vi.fn().mockResolvedValue(true)
  offlineHelpers.initOfflineDatabase()
})

describe('offline queue and sync', () => {
  it('queues tasks and marks them synced after reconnection', async () => {
    await queueTask({ id: 't1', title: 'Task 1' })
    expect(tables.tasks.length).toBe(1)
    expect(tables.tasks[0].synced).toBe(0)

    supabaseMock.fail = true
    await syncPendingData()
    expect(tables.tasks[0].synced).toBe(0)

    supabaseMock.fail = false
    await syncPendingData()
    expect(tables.tasks[0].synced).toBe(1)
  })

  it('queues photos and updates audit when sync succeeds', async () => {
    await queuePhoto('audit-1', 'file://photo.jpg')
    expect(tables.photos.length).toBe(1)
    expect(tables.photos[0].synced).toBe(0)

    supabaseMock.fail = true
    await syncPendingData()
    expect(tables.photos[0].synced).toBe(0)

    supabaseMock.fail = false
    await syncPendingData()
    expect(tables.photos[0].synced).toBe(1)
    expect(storageUpload).toHaveBeenCalled()
    expect(auditUpdateEq).toHaveBeenCalled()
  })
})
