const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface AuditAnalysis {
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    recommendation: string
    location?: string
  }>
  overall_score: number
  summary: string
  recommendations: string[]
}

export interface TrainingContent {
  title: string
  content: string
  quiz_questions: Array<{
    question: string
    options: string[]
    correct_answer: number
    explanation: string
  }>
  practical_tips: string[]
}

// Analyse d'image d'audit via le serveur
export const analyzeAuditImage = async (
  imageUrl: string,
  auditType: string = 'general',
): Promise<AuditAnalysis> => {
  const res = await fetch(`${API_URL}/openai/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, auditType }),
  })
  if (!res.ok) throw new Error('Analyse IA indisponible')
  return (await res.json()) as AuditAnalysis
}

// Génération de contenu de formation via le serveur
export const generateTrainingContent = async (
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
): Promise<TrainingContent> => {
  const res = await fetch(`${API_URL}/openai/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty }),
  })
  if (!res.ok) throw new Error('Erreur génération formation')
  return (await res.json()) as TrainingContent
}

// Assistant conversationnel
export const getChatAssistantResponse = async (
  userMessage: string,
  context: string = '',
): Promise<string> => {
  const res = await fetch(`${API_URL}/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, context }),
  })
  if (!res.ok) throw new Error('Assistant IA indisponible')
  const data = await res.json()
  return data.response as string
}

// Génération automatique de rapports d'audit
export const generateAuditReport = async (auditData: any): Promise<string> => {
  const res = await fetch(`${API_URL}/openai/audit-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auditData }),
  })
  if (!res.ok) throw new Error('Erreur génération rapport')
  const data = await res.json()
  return data.report as string
}

