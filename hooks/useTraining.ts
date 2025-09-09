import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTraining() {
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTrainings()
    }
  }, [profile])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🎓 Récupération des formations...')
      
      const { data, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('organization_id', profile?.organization_id || '550e8400-e29b-41d4-a716-446655440000')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erreur récupération formations:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ Formations récupérées:', data?.length || 0)
      setTrainings(data || [])
    } catch (error: any) {
      console.error('❌ Erreur inattendue formations:', error)
      setError(error.message || 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  const startTraining = async (trainingId: string) => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      console.log('🎓 Démarrage formation:', trainingId)
      
      const { data, error: progressError } = await supabase
        .from('user_training_progress')
        .upsert({
          user_id: profile.id,
          training_id: trainingId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,training_id'
        })
        .select()
        .single()

      if (progressError) {
        console.error('❌ Erreur démarrage formation:', progressError)
        return { error: progressError.message }
      }

      console.log('✅ Formation démarrée:', data)
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue démarrage formation:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const updateProgress = async (trainingId: string, progress: number, score?: number) => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      console.log('📈 Mise à jour progression formation:', trainingId, progress)
      
      const updateData: any = {
        progress_percentage: progress,
        updated_at: new Date().toISOString()
      }

      if (progress >= 100) {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        updateData.score = score || 100
      }

      const { data, error: updateError } = await supabase
        .from('user_training_progress')
        .update(updateData)
        .eq('user_id', profile.id)
        .eq('training_id', trainingId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erreur mise à jour progression:', updateError)
        return { error: updateError.message }
      }

      console.log('✅ Progression mise à jour:', data)

      // Si formation complétée, mettre à jour le profil utilisateur
      if (progress >= 100) {
        await updateUserTrainingCount()
      }

      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue mise à jour progression:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const getUserProgress = async (trainingId: string) => {
    if (!profile?.id) return null

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('training_id', trainingId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur récupération progression:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Erreur inattendue récupération progression:', error)
      return null
    }
  }

  const updateUserTrainingCount = async () => {
    if (!profile?.id) return

    try {
      const { data: completedTrainings } = await supabase
        .from('user_training_progress')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'completed')

      const completedCount = completedTrainings?.length || 0

      await supabase
        .from('profiles')
        .update({ completed_trainings: completedCount })
        .eq('id', profile.id)
    } catch (error) {
      console.error('❌ Erreur mise à jour compteur formations:', error)
    }
  }

  const getCompletedTrainings = () => {
    // Retourne une liste simulée pour la démo
    return trainings.slice(0, 2).map(training => ({
      ...training,
      completed_at: new Date().toISOString(),
      score: 85 + Math.floor(Math.random() * 15)
    }))
  }

  const getInProgressTrainings = () => {
    // Retourne une formation en cours pour la démo
    return trainings.slice(2, 3).map(training => ({
      ...training,
      progress: 65,
      started_at: new Date().toISOString()
    }))
  }

  return {
    trainings,
    loading,
    error,
    startTraining,
    updateProgress,
    getUserProgress,
    getCompletedTrainings,
    getInProgressTrainings,
    refetch: fetchTrainings,
  }
}