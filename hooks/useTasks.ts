import { useEffect, useState, useCallback } from 'react';
import { supabase, isDemoMode, type Task } from '../lib/supabase';
import { useAuth } from './useAuth';
import { mapSupabaseError } from '../utils/error';

const DEMO_TASKS: Task[] = [
  {
    id: 'demo-task-1',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    assigned_to: 'demo-user-001',
    created_by: 'demo-user-001',
    title: 'Réapprovisionner rayon fruits et légumes',
    description: 'Vérifier les stocks et réapprovisionner les bacs vides avant 10h',
    location: 'Rayon Fruits & Légumes',
    priority: 'high',
    status: 'pending',
    estimated_time_minutes: 45,
    due_date: new Date().toISOString(),
    created_at: '2024-01-16T06:00:00Z',
    updated_at: '2024-01-16T06:00:00Z',
    completed_at: null,
  },
  {
    id: 'demo-task-2',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    assigned_to: 'demo-user-001',
    created_by: 'demo-user-001',
    title: 'Mettre à jour les étiquettes prix',
    description: 'Nouvelles étiquettes pour la promotion de la semaine',
    location: 'Tous les rayons',
    priority: 'medium',
    status: 'in_progress',
    estimated_time_minutes: 60,
    due_date: new Date().toISOString(),
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
    completed_at: null,
  },
  {
    id: 'demo-task-3',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    assigned_to: 'demo-user-001',
    created_by: 'demo-user-001',
    title: 'Nettoyage vitrine boulangerie',
    description: 'Nettoyage complet des vitrines réfrigérées',
    location: 'Boulangerie',
    priority: 'low',
    status: 'completed',
    estimated_time_minutes: 30,
    due_date: '2024-01-15T18:00:00Z',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
    completed_at: '2024-01-15T16:00:00Z',
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(isDemoMode ? DEMO_TASKS : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const { user, profile } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        mapSupabaseError('Erreur lors de la récupération des tâches', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchTasks', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData: Partial<Task>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isDemoMode) {
      const newTask: Task = {
        id: `demo-task-${Date.now()}`,
        organization_id: profile.organization_id,
        store_id: profile.store_id || profile.organization_id,
        assigned_to: taskData.assigned_to || user.id,
        created_by: user.id,
        title: taskData.title || '',
        description: taskData.description || null,
        location: taskData.location || null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        estimated_time_minutes: taskData.estimated_time_minutes || null,
        due_date: taskData.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      setTasks((prev) => [newTask, ...prev]);
      return { data: newTask, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          organization_id: profile.organization_id,
          store_id: profile.store_id || profile.organization_id,
          assigned_to: taskData.assigned_to || user.id,
          created_by: user.id,
          title: taskData.title || '',
          description: taskData.description || null,
          location: taskData.location || null,
          priority: taskData.priority || 'medium',
          status: 'pending',
          ...taskData,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur lors de la création de la tâche', error) };
      }

      setTasks((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur createTask', error) };
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (isDemoMode) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur lors de la mise à jour du statut', error) };
      }

      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur updateTaskStatus', error) };
    }
  };

  const getMyTasks = useCallback(() => {
    return tasks.filter((t) => t.assigned_to === user?.id);
  }, [tasks, user?.id]);

  const getTasksByStatus = useCallback(
    (status: string) => {
      return tasks.filter((t) => t.status === status);
    },
    [tasks],
  );

  const getTasksByPriority = useCallback(
    (priority: string) => {
      return tasks.filter((t) => t.priority === priority);
    },
    [tasks],
  );

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    getMyTasks,
    getTasksByStatus,
    getTasksByPriority,
    refetch: fetchTasks,
  };
}
