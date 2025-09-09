import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchTasks()
    }
  }, [profile])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📋 Récupération des tâches...')
      
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erreur récupération tâches:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ Tâches récupérées:', data?.length || 0)
      setTasks(data || [])
    } catch (error: any) {
      console.error('❌ Erreur inattendue tâches:', error)
      setError(error.message || 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: {
    title: string
    description?: string
    assigned_to?: string
    priority?: string
    due_date?: string
    location?: string
  }) => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      console.log('🆕 Création tâche:', taskData.title)
      
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert({
          organization_id: profile.organization_id || '550e8400-e29b-41d4-a716-446655440000',
          store_id: profile.store_id || '550e8400-e29b-41d4-a716-446655440001',
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assigned_to || profile.id,
          created_by: profile.id,
          status: 'pending',
          priority: taskData.priority || 'medium',
          location: taskData.location,
          due_date: taskData.due_date
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Erreur création tâche:', createError)
        return { error: createError.message }
      }

      console.log('✅ Tâche créée:', data)
      setTasks([data, ...tasks])
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue création tâche:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      console.log('🔄 Mise à jour tâche:', taskId, status)
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erreur mise à jour tâche:', updateError)
        return { error: updateError.message }
      }

      console.log('✅ Tâche mise à jour:', data)
      setTasks(tasks.map(t => t.id === taskId ? data : t))
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue mise à jour tâche:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const getMyTasks = () => {
    return tasks.filter(task => task.assigned_to === profile?.id)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const getTasksByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority)
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    getMyTasks,
    getTasksByStatus,
    getTasksByPriority,
    refetch: fetchTasks,
  }
}