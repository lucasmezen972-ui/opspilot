// openai-proxy — server-side proxy for OpenAI calls.
// Keeps the API key on the server; the client sends only the action + payload.
// Auth: manual JWT verification (verify_jwt=false for CORS).
// Secret requis : OPENAI_API_KEY (Supabase Dashboard → Settings → Edge Functions)
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type Action =
  | 'analyze_audit_image'
  | 'generate_training_content'
  | 'generate_audit_report'
  | 'chat_assistant';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!OPENAI_API_KEY) {
    return json({ error: 'OpenAI non configuré sur le serveur' }, 503);
  }

  const token = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return json({ error: 'Non authentifié' }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: 'Session invalide' }, 401);
  }

  const { data: allowed, error: rateError } = await admin.rpc(
    'check_ai_rate_limit',
    {
      rate_key: `openai-proxy:${userData.user.id}`,
      max_requests: 30,
      window_seconds: 300,
    },
  );
  if (rateError) {
    console.error('Rate limit indisponible', rateError.message);
    return json({ error: 'Service IA temporairement indisponible' }, 503);
  }
  if (!allowed) {
    return json(
      { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
      429,
    );
  }

  let body: { action: Action; payload: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    switch (body.action) {
      case 'analyze_audit_image':
        return json(await analyzeAuditImage(openai, body.payload as any));
      case 'generate_training_content':
        return json(await generateTrainingContent(openai, body.payload as any));
      case 'generate_audit_report':
        return json(await generateAuditReport(openai, body.payload as any));
      case 'chat_assistant':
        return json(await chatAssistant(openai, body.payload as any));
      default:
        return json({ error: `Action inconnue : ${body.action}` }, 400);
    }
  } catch (err) {
    console.error('OpenAI proxy error', err);
    return json({ error: 'Erreur du service IA' }, 502);
  }
});

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

async function analyzeAuditImage(
  openai: OpenAI,
  payload: { imageUrl: string; auditType?: string },
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analysez cette photo d'audit ${payload.auditType ?? 'general'} dans un contexte de magasin/supermarché.

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
              }`,
          },
          {
            type: 'image_url',
            image_url: { url: payload.imageUrl },
          },
        ],
      },
    ],
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { error: 'Pas de réponse' };

  return safeJsonParse(content, {
    issues: [],
    overall_score: 0,
    summary: 'Réponse IA illisible. Analyse manuelle requise.',
    recommendations: [],
  });
}

async function generateTrainingContent(
  openai: OpenAI,
  payload: { topic: string; difficulty: string },
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'Vous êtes un expert en formation pour le secteur de la grande distribution et retail. Créez du contenu de formation professionnel et pratique.',
      },
      {
        role: 'user',
        content: `Créez un module de formation complet sur "${payload.topic}" niveau ${payload.difficulty} pour des employés de magasin.

          Incluez:
          1. Un titre accrocheur
          2. Du contenu pédagogique structuré (500-800 mots)
          3. 5 questions de quiz avec 4 options chacune
          4. Des conseils pratiques applicables immédiatement

          Format JSON:
          {
            "title": "...",
            "content": "...",
            "quiz_questions": [
              {
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": 0,
                "explanation": "..."
              }
            ],
            "practical_tips": ["Conseil 1", "Conseil 2", ...]
          }`,
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { error: 'Pas de réponse' };

  return safeJsonParse(content, {
    title: `Formation: ${payload.topic}`,
    content: 'Réponse IA illisible.',
    quiz_questions: [],
    practical_tips: [],
  });
}

async function generateAuditReport(
  openai: OpenAI,
  payload: {
    title: string;
    location: string;
    score: number;
    max_score: number;
    issues_count: number;
    status: string;
    created_at: string;
  },
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          "Générez un rapport d'audit professionnel en français pour un magasin.",
      },
      {
        role: 'user',
        content: `Générez un rapport d'audit basé sur ces données:

          Titre: ${payload.title}
          Lieu: ${payload.location}
          Score: ${payload.score}/${payload.max_score}
          Problèmes détectés: ${payload.issues_count}
          Statut: ${payload.status}
          Date: ${payload.created_at}

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

  return {
    report:
      response.choices[0]?.message?.content ??
      'Rapport en cours de génération...',
  };
}

async function chatAssistant(
  openai: OpenAI,
  payload: { userMessage: string; context?: string },
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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
          Contexte actuel: ${payload.context ?? ''}`,
      },
      {
        role: 'user',
        content: payload.userMessage,
      },
    ],
    max_tokens: 500,
  });

  return {
    reply:
      response.choices[0]?.message?.content ??
      'Désolé, je ne peux pas répondre pour le moment.',
  };
}
