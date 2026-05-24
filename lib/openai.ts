import OpenAI from 'openai';

import { mapOpenAIError } from '../utils/error';

const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey || 'sk-placeholder',
  dangerouslyAllowBrowser: true,
});

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

// Analyse d'image d'audit avec OpenAI Vision
export const analyzeAuditImage = async (
  imageUrl: string,
  auditType: string = 'general',
): Promise<AuditAnalysis> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
              }`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Pas de réponse de OpenAI');

    const analysis = JSON.parse(content) as AuditAnalysis;
    return analysis;
  } catch (error) {
    const message = mapOpenAIError('Erreur analyse OpenAI', error);
    return {
      issues: [
        {
          severity: 'medium',
          description: message,
          recommendation: 'Effectuer une analyse manuelle',
        },
      ],
      overall_score: 75,
      summary: message,
      recommendations: ['Vérifier manuellement tous les points de contrôle'],
    };
  }
};

// Génération de contenu de formation avec OpenAI
export const generateTrainingContent = async (
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
): Promise<TrainingContent> => {
  try {
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
    if (!content) throw new Error('Pas de réponse de OpenAI');

    return JSON.parse(content) as TrainingContent;
  } catch (error) {
    const message = mapOpenAIError('Erreur génération formation OpenAI', error);
    return {
      title: `Formation: ${topic}`,
      content: message,
      quiz_questions: [],
      practical_tips: [message],
    };
  }
};

// Assistant conversationnel pour le support
export const getChatAssistantResponse = async (
  userMessage: string,
  context: string = '',
): Promise<string> => {
  try {
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
          Contexte actuel: ${context}`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 500,
    });

    return (
      response.choices[0]?.message?.content ||
      'Désolé, je ne peux pas répondre pour le moment.'
    );
  } catch (error) {
    return mapOpenAIError('Erreur assistant OpenAI', error);
  }
};

// Génération automatique de rapports d'audit
export const generateAuditReport = async (auditData: any): Promise<string> => {
  try {
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

    return (
      response.choices[0]?.message?.content ||
      'Rapport en cours de génération...'
    );
  } catch (error) {
    return mapOpenAIError('Erreur génération rapport OpenAI', error);
  }
};

export { openai };
