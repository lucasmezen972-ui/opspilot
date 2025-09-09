import express from 'express'
import cors from 'cors'
import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { authenticate } from './middleware/auth'
import { auditSchema, taskSchema, productSchema } from './schemas'
import type { ZodSchema } from 'zod'
import { dataToCSV, dataToExcelBuffer } from '../utils/export'

export const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use(authenticate)

function registerResourceRoutes(table: string, schema: ZodSchema) {
  app.get(`/${table}`, async (_, res) => {
    const { data, error } = await supabase.from(table).select('*').limit(100)
    if (error) {
      logger.error(`Failed to fetch ${table}`, error)
      return res.status(500).json({ error: error.message })
    }
    res.json(data)
  })

  app.get(`/${table}/export`, async (req, res) => {
    const format = (req.query.format as string) || 'csv'
    const { data, error } = await supabase.from(table).select('*').limit(1000)
    if (error) {
      logger.error(`Failed to export ${table}`, error)
      return res.status(500).json({ error: error.message })
    }

    if (format === 'excel') {
      const buffer = await dataToExcelBuffer(data)
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${table}.xlsx"`
      )
      return res.send(buffer)
    }

    const csv = dataToCSV(data)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`)
    res.send(csv)
  })

  app.post(`/${table}`, async (req, res) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() })
    }
    const { data, error } = await supabase
      .from(table)
      .insert(parsed.data)
      .select()
      .single()
    if (error) {
      logger.error(`Failed to create ${table}`, error)
      return res.status(500).json({ error: error.message })
    }
    res.status(201).json(data)
  })
}

registerResourceRoutes('audits', auditSchema)
registerResourceRoutes('tasks', taskSchema)
registerResourceRoutes('products', productSchema)

// Trainings
app.get('/trainings', async (_, res) => {
  const { data, error } = await supabase.from('trainings').select('*').limit(100)
  if (error) {
    logger.error('Failed to fetch trainings', error)
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
})

app.use(((err, _req, res, _next) => {
  logger.error('Unhandled error', err)
  res.status(500).json({ error: 'Internal Server Error' })
}) as express.ErrorRequestHandler)
