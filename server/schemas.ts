import { z } from 'zod';

export const auditSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  score: z.number().int().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  end_latitude: z.number().optional(),
  end_longitude: z.number().optional(),
});

export const taskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  price: z.number().optional(),
});

export const analysisSchema = z.object({
  problems: z.array(z.string().min(1)).min(1),
});
