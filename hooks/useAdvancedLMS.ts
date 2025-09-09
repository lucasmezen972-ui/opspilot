import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { LearningPath, AdvancedTraining, UserCompetency, SmartRecommendation } from '../lib/types/advanced'

export function useAdvancedLMS() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([])
  const [competencies, setCompetencies] = useState<UserCompetency[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchLearningData()
      generateSmartRecommendations()
    }
  }, [profile])

  const fetchLearningData = async () => {
    try {
      setLoading(true)

      // Récupérer les parcours disponibles
      const { data: pathsData } = await supabase
        .from('learning_paths')
        .select(`
          *,
          steps:learning_path_steps(
            *,
            training:trainings(*)
          )
        `)
        .contains('target_roles', [profile?.role])
        .eq('organization_id', profile?.organization_id)

      // Récupérer les compétences utilisateur
      const { data: competenciesData } = await supabase
        .from('user_competencies')
        .select('*')
        .eq('user_id', profile?.id)

      setLearningPaths(pathsData || [])
      setCompetencies(competenciesData || [])
    } catch (error) {
      console.error('Erreur récupération données LMS:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSmartRecommendations = async () => {
    try {
      // Simulation d'IA - à remplacer par une vraie API
      const mockRecommendations: SmartRecommendation[] = [
        {
          id: '1',
          user_id: profile?.id || '',
          type: 'training',
          title: 'Formation recommandée : Communication client avancée',
          description: 'Basé sur vos performances récentes, cette formation vous aiderait à améliorer votre score de 15%',
          confidence_score: 0.87,
          data: { training_id: 'comm-advanced', estimated_impact: '+15%' },
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: profile?.id || '',
          type: 'competency',
          title: 'Compétence à développer : Gestion des stocks',
          description: 'Écart identifié de 2 niveaux avec votre objectif cible',
          confidence_score: 0.92,
          data: { competency: 'stock_management', gap_level: 2 },
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]

      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Erreur génération recommandations:', error)
    }
  }

  const enrollInPath = async (pathId: string) => {
    try {
      const { error } = await supabase
        .from('user_learning_paths')
        .insert({
          user_id: profile?.id,
          path_id: pathId,
          status: 'in_progress',
          enrolled_at: new Date().toISOString()
        })

      if (error) throw error

      // Créer les progressions pour chaque étape
      const path = learningPaths.find(p => p.id === pathId)
      // Logique d'inscription aux étapes...
      
      return { success: true }
    } catch (error) {
      console.error('Erreur inscription parcours:', error)
      return { error }
    }
  }

  const updateCompetency = async (competencyId: string, newLevel: number, evidence: string[]) => {
    try {
      const { error } = await supabase
        .from('user_competencies')
        .update({
          current_level: newLevel,
          last_assessed: new Date().toISOString(),
          evidence
        })
        .eq('id', competencyId)

      if (error) throw error
      
      await fetchLearningData() // Refresh data
      return { success: true }
    } catch (error) {
      console.error('Erreur mise à jour compétence:', error)
      return { error }
    }
  }

  const acceptRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return { error: 'Recommandation non trouvée' }

    if (recommendation.type === 'training' && recommendation.data.training_id) {
      // Auto-inscription à la formation
      // Logique d'inscription...
    }

    setRecommendations(prev => 
      prev.map(r => r.id === recommendationId ? { ...r, status: 'accepted' } : r)
    )
  }

  return {
    learningPaths,
    recommendations,
    competencies,
    loading,
    enrollInPath,
    updateCompetency,
    acceptRecommendation,
    refetch: fetchLearningData
  }
}