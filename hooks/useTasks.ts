import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { getDemoTasks, demoId } from '../lib/demoData';
import { supabase, type Task } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, isDemoMode, session } = useAuth();

  // Mode démo local (Supabase injoignable) : données en mémoire, jamais vides.
  const isLocalDemo = isDemoMode && !session;

  const fetchTasks = useCallback(async () => {
    if (isLocalDemo) {
      setTasks(getDemoTasks());
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
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData: Partial<Task>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isLocalDemo) {
      const now = new Date().toISOString();
      const data: Task = {
        id: demoId('demo-task'),
        organization_id: profile.organization_id,
        store_id: profile.store_id ?? null,
        assigned_to: taskData.assigned_to || user.id,
        created_by: user.id,
        title: taskData.title || '',
        description: taskData.description ?? null,
        location: taskData.location ?? null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        estimated_time_minutes: taskData.estimated_time_minutes ?? null,
        due_date: taskData.due_date ?? null,
        created_at: now,
        updated_at: now,
        completed_at: null,
      };
      setTasks((prev) => [data, ...prev]);
      return { data, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          organization_id: profile.organization_id,
          store_id: profile.store_id || null,
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
        return {
          data: null,
          error: mapSupabaseError(
            'Erreur lors de la création de la tâche',
            error,
          ),
        };
      }

      setTasks((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur createTask', error),
      };
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      if (isLocalDemo) {
        let updated: Task | null = null;
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t;
            updated = { ...t, ...updates } as Task;
            return updated;
          }),
        );
        return { data: updated, error: null };
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            'Erreur lors de la mise à jour du statut',
            error,
          ),
        };
      }

      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateTaskStatus', error),
      };
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
