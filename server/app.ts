import express from 'express'
import cors from 'cors'
import { supabase } from './supabase'

export const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Audits
app.get('/audits', async (_, res) => {
  const { data, error } = await supabase.from('audits').select('*').limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/audits', async (req, res) => {
  const { data, error } = await supabase.from('audits').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Tasks
app.get('/tasks', async (_, res) => {
  const { data, error } = await supabase.from('tasks').select('*').limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Products
app.get('/products', async (_, res) => {
  const { data, error } = await supabase.from('products').select('*').limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/products', async (req, res) => {
  const { data, error } = await supabase.from('products').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Trainings
app.get('/trainings', async (_, res) => {
  const { data, error } = await supabase.from('trainings').select('*').limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})
