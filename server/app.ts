import cors from 'cors';
import express from 'express';
import type { ZodSchema } from 'zod';
import OpenAI from 'openai';

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

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use(authenticate);

function registerResourceRoutes(table: string, schema: ZodSchema) {
  app.get(`/${table}`, async (_, res) => {
    const { data, error } = await supabase.from(table).select('*').limit(100);
    if (error) {
      logger.error(`Failed to fetch ${table}`, error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  app.get(`/${table}/export`, async (req, res) => {
    const format = (req.query.format as string) || 'csv';
    const { data, error } = await supabase.from(table).select('*').limit(1000);
    if (error) {
      logger.error(`Failed to export ${table}`, error);
      return res.status(500).json({ error: error.message });
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
      logger.error(`Failed to create ${table}`, error);
      return res.status(500).json({ error: error.message });
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
    logger.error('Failed to fetch trainings', error);
    return res.status(500).json({ error: error.message });
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

// OpenAI proxy endpoints
app.post('/openai/analyze-image', async (req, res) => {
  const { imageUrl, auditType = 'general' } = req.body as {
    imageUrl: string
    auditType?: string
  };
  if (!openai) {
    return res.status(500).json({
      issues: [
        {
          severity: 'medium',
          description: 'Analyse automatique indisponible',
          recommendation: 'Effectuer une analyse manuelle',
        },
      ],
      overall_score: 75,
      summary: 'Analyse manuelle requise',
      recommendations: ['Vérifier manuellement tous les points de contrôle'],
    });
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysez cette photo d'audit ${auditType} dans un contexte de magasin/supermarché.

              Identifiez:
              1. Les problèmes de sécurité, hygiène, ou organisation
              2. Le niveau de gravité de chaque problème
              3. Des recommandations d'amélioration
              4. Un score global sur 100

              Répondez au format JSON avec la structure suivante:
              {
                "issues": [{"severity": "high", "description": "...", "recommendation": "...", "location": "..."}],
                "overall_score": 85,
                "summary": "Résumé général de l'audit",
                "recommendations": ["Recommandation 1", "Recommandation 2"]
              }`
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1500,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Pas de réponse de OpenAI');
    res.json(JSON.parse(content));
  } catch (error) {
    logger.error('Erreur analyse OpenAI:', error);
    res.status(500).json({
      issues: [
        {
          severity: 'medium',
          description: 'Analyse automatique indisponible',
          recommendation: 'Effectuer une analyse manuelle',
        },
      ],
      overall_score: 75,
      summary: 'Analyse manuelle requise',
      recommendations: ['Vérifier manuellement tous les points de contrôle'],
    });
  }
});

app.post('/openai/training', async (req, res) => {
  const { topic, difficulty } = req.body as {
    topic: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  };
  if (!openai) {
    return res.status(500).json({
      title: `Formation: ${topic}`,
      content: 'Contenu de formation en cours de génération...',
      quiz_questions: [],
      practical_tips: ['Formation personnalisée bientôt disponible'],
    });
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "Vous êtes un expert en formation pour le secteur de la grande distribution et retail. Créez du contenu de formation professionnel et pratique.",
        },
        {
          role: 'user',
          content: `Créez un module de formation complet sur "${topic}" niveau ${difficulty} pour des employés de magasin.

          Incluez:
          1. Un titre accrocheur
          2. Du contenu pédagogique structuré (500-800 mots)
          3. 5 questions de quiz avec 4 options chacune
          4. Des conseils pratiques applicables immédiatement

          Format JSON:
          {
            "title": "...",
            "content": "...",
            "quiz_questions": [{"question": "...","options": ["A","B","C","D"],"correct_answer": 0,"explanation": "..."}],
            "practical_tips": ["Conseil 1", "Conseil 2", ...]
          }`,
        },
      ],
      max_tokens: 2000,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Pas de réponse de OpenAI');
    res.json(JSON.parse(content));
  } catch (error) {
    logger.error('Erreur génération formation OpenAI:', error);
    res.status(500).json({
      title: `Formation: ${topic}`,
      content: 'Contenu de formation en cours de génération...',
      quiz_questions: [],
      practical_tips: ['Formation personnalisée bientôt disponible'],
    });
  }
});

app.post('/openai/chat', async (req, res) => {
  const { message, context = '' } = req.body as {
    message: string
    context?: string
  };
  if (!openai) {
    return res.status(500).json({
      response:
        'Assistant temporairement indisponible. Contactez le support technique.',
    });
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Vous êtes l'assistant IA d'OpsPilot, une application de gestion d'opérations terrain pour magasins et supermarchés.

          Vous aidez les employés avec:
          - Questions sur les procédures d'audit
          - Conseils sur la gestion des stocks
          - Support technique de l'application
          - Bonnes pratiques en magasin
          - Interprétation des résultats d'audit

          Répondez de manière concise, professionnelle et pratique.
          Contexte actuel: ${context}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
    });
    res.json({
      response:
        response.choices[0]?.message?.content ||
        'Désolé, je ne peux pas répondre pour le moment.',
    });
  } catch (error) {
    logger.error('Erreur assistant OpenAI:', error);
    res.status(500).json({
      response:
        'Assistant temporairement indisponible. Contactez le support technique.',
    });
  }
});

app.post('/openai/audit-report', async (req, res) => {
  const { auditData } = req.body as { auditData: any };
  if (!openai) {
    return res.status(500).json({
      report: 'Génération automatique de rapport temporairement indisponible.',
    });
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: "Générez un rapport d'audit professionnel en français pour un magasin.",
        },
        {
          role: 'user',
          content: `Générez un rapport d'audit basé sur ces données:

          Titre: ${auditData.title}
          Lieu: ${auditData.location}
          Score: ${auditData.score}/${auditData.max_score}
          Problèmes détectés: ${auditData.issues_count}
          Statut: ${auditData.status}
          Date: ${auditData.created_at}

          Le rapport doit inclure:
          1. Résumé exécutif
          2. Points forts identifiés
          3. Points d'amélioration
          4. Recommandations prioritaires
          5. Plan d'action suggéré

          Format professionnel, max 800 mots.`,
        },
      ],
      max_tokens: 1000,
    });
    res.json({
      report:
        response.choices[0]?.message?.content ||
        'Rapport en cours de génération...',
    });
  } catch (error) {
    logger.error('Erreur génération rapport OpenAI:', error);
    res.status(500).json({
      report: 'Génération automatique de rapport temporairement indisponible.',
    });
  }
});

app.use(((err, _req, res, _next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
}) as express.ErrorRequestHandler);
