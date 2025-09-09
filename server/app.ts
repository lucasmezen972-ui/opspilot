import express from 'express'
import cors from 'cors'
import { supabase } from './supabase'
import { logger } from '../utils/logger'

export const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Audits
app.get('/audits', async (_, res) => {
  const { data, error } = await supabase.from('audits').select('*').limit(100)
  if (error) {
    logger.error('Failed to fetch audits', error)
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
})

app.post('/audits', async (req, res) => {
  const { data, error } = await supabase.from('audits').insert(req.body).select().single()
  if (error) {
    logger.error('Failed to create audit', error)
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json(data)
})

// Tasks
app.get('/tasks', async (_, res) => {
  const { data, error } = await supabase.from('tasks').select('*').limit(100)
  if (error) {
    logger.error('Failed to fetch tasks', error)
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
})

app.post('/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').insert(req.body).select().single()
  if (error) {
    logger.error('Failed to create task', error)
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json(data)
})

// Products
app.get('/products', async (_, res) => {
  const { data, error } = await supabase.from('products').select('*').limit(100)
  if (error) {
    logger.error('Failed to fetch products', error)
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
})

app.post('/products', async (req, res) => {
  const { data, error } = await supabase.from('products').insert(req.body).select().single()
  if (error) {
    logger.error('Failed to create product', error)
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json(data)
})

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
