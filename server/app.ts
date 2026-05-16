import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import type { ZodSchema } from 'zod';

import { mapSupabaseError } from '../utils/error';
import { logger } from '../utils/logger';
import { authenticate } from './middleware/auth';
import {
  auditSchema,
  taskSchema,
  productSchema,
  analysisSchema,
} from './schemas';
import { supabase } from './supabase';
import { dataToCSV, dataToExcelBuffer } from '../utils/export';
import { generatePlanAndAudit } from '../utils/planner';

export const app = express();
app.use(cors());
app.use(express.json());

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(limiter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use(authenticate);

function registerResourceRoutes(table: string, schema: ZodSchema) {
  app.get(`/${table}`, async (_, res) => {
    const { data, error } = await supabase.from(table).select('*').limit(100);
    if (error) {
      logger.error({ error, table }, 'Error fetching data');
      return res
        .status(500)
        .json({ error: mapSupabaseError(`Error fetching ${table}`, error) });
    }
    res.json(data);
  });

  app.get(`/${table}/export`, async (req, res) => {
    const format = (req.query.format as string) || 'csv';
    if (!['csv', 'excel'].includes(format)) {
      return res.status(400).json({ error: 'Unsupported export format' });
    }

    const { data, error } = await supabase.from(table).select('*').limit(1000);
    if (error) {
      logger.error({ error, table }, 'Error exporting data');
      return res
        .status(500)
        .json({ error: mapSupabaseError(`Error exporting ${table}`, error) });
    }

    if (format === 'excel') {
      const buffer = await dataToExcelBuffer(data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${table}.xlsx"`,
      );
      return res.send(buffer);
    }

    const csv = dataToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
    res.send(csv);
  });

  app.post(`/${table}`, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { data, error } = await supabase
      .from(table)
      .insert(parsed.data)
      .select()
      .single();
    if (error) {
      logger.error({ error, table }, 'Error creating record');
      return res
        .status(500)
        .json({ error: mapSupabaseError(`Error creating ${table}`, error) });
    }
    res.status(201).json(data);
  });
}

registerResourceRoutes('audits', auditSchema);
registerResourceRoutes('tasks', taskSchema);
registerResourceRoutes('products', productSchema);

// Trainings
app.get('/trainings', async (_, res) => {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .limit(100);
  if (error) {
    logger.error({ error }, 'Error fetching trainings');
    return res
      .status(500)
      .json({ error: mapSupabaseError('Error fetching trainings', error) });
  }
  res.json(data);
});

app.post('/analysis', (req, res) => {
  const parsed = analysisSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const results = parsed.data.problems.map(generatePlanAndAudit);
  const actionPlans = results.map((r) => r.actionPlan);
  const audits = results.map((r) => r.audit);

  res.json({ actionPlans, audits });
});

app.use(((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
}) as express.ErrorRequestHandler);
