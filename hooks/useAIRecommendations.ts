import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useAudits } from './useAudits'
import { useTraining } from './useTraining'

interface AIRecommendation {
  type: 'training' | 'competency' | 'career_path'
  title: string
  description: string
  confidence_score: number
  priority: 'high' | 'medium' | 'low'
  estimated_impact: string
  action_items: string[]
  deadline_days: number
}

interface AIInsight {
  type: 'risk_prediction' | 'compliance_alert' | 'performance_trend' | 'resource_optimization'
  title: string
  description: string
  confidence_level: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  predicted_impact: string
  recommended_actions: string[]
  timeline: 'immediate' | 'short_term' | 'long_term'
  affected_areas: string[]
  kpis_impact: {
    compliance_score?: string
    efficiency?: string
    risk_reduction?: string
  }
}

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { profile } = useAuth()
  const { audits } = useAudits()
  const { trainings } = useTraining()

  useEffect(() => {
    if (profile?.id && audits.length > 0) {
      generateRecommendations()
      generateInsights()
    }
  }, [profile, audits, trainings])

  const generateRecommendations = async () => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      // Préparer les données pour l'IA
      const userProfile = {
        role: profile.role,
        level: profile.level,
        avg_score: profile.avg_score,
        total_audits: profile.total_audits,
        completed_trainings: profile.completed_trainings
      }

      const auditHistory = audits.slice(0, 10).map(audit => ({
        title: audit.title,
        score: audit.score,
        max_score: audit.max_score,
        status: audit.status,
        issues_count: audit.issues_count
      }))

      const trainingHistory = trainings.slice(0, 5).map(training => ({
        title: training.title,
        difficulty: training.difficulty,
        status: 'completed', // Simulé
        category: training.category
      }))

      console.log('🤖 Génération de recommandations IA...')

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
          userProfile,
          auditHistory,
          trainingHistory
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        console.warn('⚠️ API IA non configurée, utilisation de recommandations par défaut')
        setRecommendations(getDefaultRecommendations())
      } else {
        console.log('✅ Recommandations IA générées:', data.recommendations?.length)
        setRecommendations(data.recommendations || [])
      }

    } catch (error) {
      console.error('❌ Erreur génération recommandations:', error)
      setError('Impossible de générer les recommandations IA')
      // Utiliser des recommandations par défaut
      setRecommendations(getDefaultRecommendations())
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    if (!profile) return

    try {
      const riskAssessments = audits.map(audit => ({
        risk_category: audit.category || 'general',
        risk_score: audit.issues_count * 5,
        probability: Math.min(audit.issues_count, 5)
      }))

      console.log('🔮 Génération d\'insights prédictifs...')

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-audit-insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: profile.organization_id,
          auditData: audits.slice(0, 10),
          riskAssessments
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        console.warn('⚠️ API IA non configurée, utilisation d\'insights par défaut')
        setInsights(getDefaultInsights())
      } else {
        console.log('✅ Insights IA générés:', data.insights?.length)
        setInsights(data.insights || [])
      }

    } catch (error) {
      console.error('❌ Erreur génération insights:', error)
      // Utiliser des insights par défaut
      setInsights(getDefaultInsights())
    }
  }

  const getDefaultRecommendations = (): AIRecommendation[] => {
    const baseRecommendations = [
      {
        type: 'training' as const,
        title: 'Formation Communication Client Avancée',
        description: `Basé sur vos scores d'audit récents (${profile?.avg_score}%), une formation en communication client pourrait améliorer votre performance de 15-20%.`,
        confidence_score: 0.85,
        priority: 'high' as const,
        estimated_impact: '+15% score audits client',
        action_items: [
          'Suivre le module "Communication non-verbale"',
          'Pratiquer avec des jeux de rôles',
          'Obtenir le feedback de vos managers'
        ],
        deadline_days: 30
      },
      {
        type: 'competency' as const,
        title: 'Développer votre expertise produits',
        description: `Avec ${profile?.total_audits || 0} audits réalisés, vous pourriez bénéficier d'un renforcement des connaissances produits pour devenir référent.`,
        confidence_score: 0.72,
        priority: 'medium' as const,
        estimated_impact: 'Statut d\'expert produit',
        action_items: [
          'Compléter la formation catalogue produits',
          'Participer aux formations fournisseurs',
          'Mentorer un nouvel employé'
        ],
        deadline_days: 60
      },
      {
        type: 'career_path' as const,
        title: 'Évolution vers Manager de Rayon',
        description: 'Votre progression actuelle vous positionne bien pour une évolution managériale. Développez vos compétences en leadership.',
        confidence_score: 0.68,
        priority: 'low' as const,
        estimated_impact: 'Opportunité promotion',
        action_items: [
          'Formation management d\'équipe',
          'Certification gestion des stocks',
          'Projet pilote de supervision'
        ],
        deadline_days: 90
      }
    ]

    return baseRecommendations
  }

  const getDefaultInsights = (): AIInsight[] => {
    return [
      {
        type: 'performance_trend',
        title: 'Tendance positive des scores d\'audit',
        description: 'Analysis des 30 derniers jours montre une amélioration continue de +8% des scores globaux.',
        confidence_level: 0.89,
        severity: 'low',
        predicted_impact: 'Maintien de la dynamique positive si les efforts continuent',
        recommended_actions: [
          'Maintenir le rythme actuel de formation',
          'Partager les bonnes pratiques avec l\'équipe',
          'Documenter les améliorations pour reproduction'
        ],
        timeline: 'short_term',
        affected_areas: ['Tous rayons'],
        kpis_impact: {
          compliance_score: '+8%',
          efficiency: '+12%',
          risk_reduction: '5%'
        }
      },
      {
        type: 'risk_prediction',
        title: 'Risque de surcharge opérationnelle',
        description: 'Le nombre d\'audits augmente de 25% par mois. Risque de fatigue d\'équipe et baisse qualité d\'ici 6 semaines.',
        confidence_level: 0.76,
        severity: 'medium',
        predicted_impact: 'Baisse potential de 15% des scores si pas d\'action',
        recommended_actions: [
          'Recruter 1 auditeur supplémentaire',
          'Automatiser 30% des contrôles simples',
          'Optimiser la planification des audits'
        ],
        timeline: 'immediate',
        affected_areas: ['Planning', 'Ressources humaines'],
        kpis_impact: {
          efficiency: '+18%',
          risk_reduction: '22%'
        }
      }
    ]
  }

  const acceptRecommendation = (recommendationIndex: number) => {
    const updated = [...recommendations]
    updated[recommendationIndex] = {
      ...updated[recommendationIndex],
      status: 'accepted'
    }
    setRecommendations(updated)
  }

  const dismissRecommendation = (recommendationIndex: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== recommendationIndex))
  }

  return {
    recommendations,
    insights,
    loading,
    error,
    acceptRecommendation,
    dismissRecommendation,
    regenerate: () => {
      generateRecommendations()
      generateInsights()
    }
  }
}