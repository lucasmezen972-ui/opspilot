import { supabase } from './supabase';

export interface AuditAnalysis {
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    location?: string;
  }[];
  overall_score: number;
  summary: string;
  recommendations: string[];
}

export interface TrainingContent {
  title: string;
  content: string;
  quiz_questions: {
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }[];
  practical_tips: string[];
}

async function callOpenAIProxy<T>(
  action: string,
  payload: Record<string, unknown>,
  fallback: T,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return fallback;

  // `||` intentionnel : en CI le secret peut être une chaîne vide.
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
  const url =
    (process.env.EXPO_PUBLIC_SUPABASE_URL ||
      'https://hpqfmuzkkxrqoqoabjmb.supabase.co') +
    '/functions/v1/openai-proxy';
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) return fallback;
  return (await res.json()) as T;
}

export const analyzeAuditImage = async (
  imageUrl: string,
  auditType: string = 'general',
): Promise<AuditAnalysis> => {
  return callOpenAIProxy<AuditAnalysis>(
    'analyze_audit_image',
    { imageUrl, auditType },
    {
      issues: [],
      overall_score: 0,
      summary: 'Service IA indisponible. Analyse manuelle requise.',
      recommendations: [],
    },
  );
};

export const generateTrainingContent = async (
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
): Promise<TrainingContent> => {
  return callOpenAIProxy<TrainingContent>(
    'generate_training_content',
    { topic, difficulty },
    {
      title: `Formation: ${topic}`,
      content: 'Service IA indisponible. Contenu indisponible.',
      quiz_questions: [],
      practical_tips: [],
    },
  );
};

export const getChatAssistantResponse = async (
  userMessage: string,
  context: string = '',
): Promise<string> => {
  const result = await callOpenAIProxy<{ reply?: string; error?: string }>(
    'chat_assistant',
    { userMessage, context },
    { error: 'Service IA indisponible' },
  );
  return (
    result.reply ??
    result.error ??
    "L'assistant IA n'est pas disponible actuellement."
  );
};

export const generateAuditReport = async (
  auditData: Record<string, unknown>,
): Promise<string> => {
  const result = await callOpenAIProxy<{ report?: string; error?: string }>(
    'generate_audit_report',
    auditData,
    { error: 'Service IA indisponible' },
  );
  return result.report ?? result.error ?? 'Génération IA indisponible.';
};
