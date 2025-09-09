import { useEffect, useState } from 'react'
import { supabase, type Task } from '../lib/supabase'
import { useAuth } from './useAuth'
import { isOnline, loadOfflineTasks, setOfflineTasks, queueTask } from '../lib/offline'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTasks()
    }
  }, [profile])

  const fetchTasks = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      if (await isOnline()) {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            assigned_profile:profiles!tasks_assigned_to_fkey(full_name),
            creator_profile:profiles!tasks_created_by_fkey(full_name),
            stores(name)
          `)
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erreur lors de la récupération des tâches:', error)
          return
        }

        setTasks(data || [])
        await setOfflineTasks(data || [])
      } else {
        const local = await loadOfflineTasks()
        setTasks(local)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: {
    title: string
    description?: string
    location?: string
    priority: Task['priority']
    assigned_to: string
    estimated_time_minutes?: number
    due_date?: string
  }) => {
    if (!profile?.organization_id || !profile?.store_id) return { error: 'Organisation ou magasin non défini' }

    try {
      if (await isOnline()) {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            organization_id: profile.organization_id,
            store_id: profile.store_id,
            created_by: profile.id,
            status: 'pending',
          })
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de la création de la tâche:', error)
          return { error }
        }

        setTasks([data, ...tasks])
        await setOfflineTasks([data, ...tasks])
        return { data }
      } else {
        const offlineId = `offline-${Date.now()}`
        const localTask: any = {
          ...taskData,
          organization_id: profile.organization_id,
          store_id: profile.store_id,
          created_by: profile.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          local_id: offlineId,
          id: offlineId,
        }
        setTasks([localTask, ...tasks])
        await queueTask(localTask)
        return { data: localTask }
      }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      if (await isOnline()) {
        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId)
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de la mise à jour de la tâche:', error)
          return { error }
        }

        setTasks(tasks.map(t => t.id === taskId ? data : t))
        await setOfflineTasks(tasks.map(t => t.id === taskId ? data : t))
        return { data }
      } else {
        const existing: any = tasks.find(t => t.id === taskId)
        if (!existing) return { error: 'Tâche introuvable' }
        const localUpdated = { ...existing, ...updateData }
        setTasks(tasks.map(t => t.id === taskId ? localUpdated : t))
        await queueTask(localUpdated)
        return { data: localUpdated }
      }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const getMyTasks = () => {
    return tasks.filter(task => task.assigned_to === profile?.id)
  }

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  const getTasksByPriority = (priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority)
  }

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    getMyTasks,
    getTasksByStatus,
    getTasksByPriority,
    refetch: fetchTasks,
  }
}