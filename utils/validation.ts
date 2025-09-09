import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum'),
})

export const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum'),
  fullName: z.string().min(2, 'Nom requis (2 caractères minimum)'),
})

export const auditSchema = z.object({
  title: z.string().min(3, 'Titre requis (3 caractères minimum)'),
  description: z.string().optional(),
  location: z.string().optional(),
  due_date: z.string().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(3, 'Titre requis (3 caractères minimum)'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Nom produit requis'),
  barcode: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'Prix positif requis').optional(),
})