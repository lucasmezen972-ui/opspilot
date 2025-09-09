import { z } from 'zod'

export const auditSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  score: z.number().int().optional(),
})

export const taskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  price: z.number().optional(),
})
