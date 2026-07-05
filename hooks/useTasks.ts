import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import {
  isUploadableEvidenceUri,
  uploadEvidencePhoto,
} from '../features/evidence/evidenceUpload';
import { isRecurring, nextDueDate } from '../features/tasks/taskRecurrence';
import {
  computeDurationMinutes,
  type TaskCompletionInput,
} from '../features/tasks/taskTraceability';
import { demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import { supabase, type Task } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTasks() {
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isDemoMode, session } = useAuth();

  // Mode démo local (Supabase injoignable) : store partagé entre écrans.
  const isLocalDemo = isDemoMode && !session;
  const demoTasks = useDemoCollection('tasks');
  const tasks = isLocalDemo ? demoTasks : remoteTasks;
  const setTasks = isLocalDemo
    ? (updater: (prev: Task[]) => Task[]) =>
        updateDemoCollection('tasks', updater)
    : setRemoteTasks;

  const fetchTasks = useCallback(async () => {
    if (isLocalDemo) {
      // Le store démo est déjà alimenté (et partagé) : rien à charger.
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        const msg = mapSupabaseError(
          'Erreur lors de la récupération des tâches',
          error,
        );
        setError(msg);
        return;
      }

      setRemoteTasks(data || []);
    } catch (err) {
      const msg = mapSupabaseError('Erreur fetchTasks', err);
      setError(msg);
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
        assigned_to: taskData.assigned_to ?? user.id,
        created_by: user.id,
        title: taskData.title ?? '',
        description: taskData.description ?? null,
        location: taskData.location ?? null,
        priority: taskData.priority ?? 'medium',
        status: 'pending',
        estimated_time_minutes: taskData.estimated_time_minutes ?? null,
        due_date: taskData.due_date ?? null,
        recurrence: taskData.recurrence ?? 'none',
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
          store_id: profile.store_id ?? null,
          assigned_to: taskData.assigned_to ?? user.id,
          created_by: user.id,
          title: taskData.title ?? '',
          description: taskData.description ?? null,
          location: taskData.location ?? null,
          priority: taskData.priority ?? 'medium',
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

  /**
   * À la clôture d'une tâche récurrente, génère la prochaine occurrence
   * (même contenu, échéance décalée selon la fréquence).
   */
  const spawnNextOccurrence = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !isRecurring(task.recurrence)) return;
    const from = task.due_date ? new Date(task.due_date) : new Date();
    await createTask({
      title: task.title,
      description: task.description ?? undefined,
      location: task.location ?? undefined,
      priority: task.priority,
      estimated_time_minutes: task.estimated_time_minutes ?? undefined,
      assigned_to: task.assigned_to ?? undefined,
      recurrence: task.recurrence,
      due_date: nextDueDate(task.recurrence, from) ?? undefined,
    });
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
        if (status === 'completed') await spawnNextOccurrence(id);
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
      if (status === 'completed') await spawnNextOccurrence(id);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateTaskStatus', error),
      };
    }
  };

  /** Clôture traçable : nom + matricule de l'exécutant, durée, preuve. */
  const completeTask = async (id: string, input: TaskCompletionInput) => {
    const now = new Date().toISOString();
    const task = tasks.find((t) => t.id === id);
    const completionComment = input.comment?.trim();
    const updates: Partial<Task> = {
      status: 'completed',
      completed_at: now,
      ended_at: now,
      duration_minutes: computeDurationMinutes(task?.started_at ?? null, now),
      completed_by_name: input.executantName.trim(),
      completed_by_matricule: input.matricule.trim(),
      completion_comment:
        completionComment && completionComment.length > 0
          ? completionComment
          : null,
      proof_photo_url: input.proofPhotoUrl ?? null,
      updated_at: now,
    };

    if (isLocalDemo) {
      let updated: Task | null = null;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          updated = { ...t, ...updates } as Task;
          return updated;
        }),
      );
      await spawnNextOccurrence(id);
      return { data: updated, error: null };
    }

    try {
      // Preuve photo durable : téléverse l'URI locale dans le bucket privé
      // « evidence » et persiste le chemin. Best-effort : conserve l'URI si
      // l'upload échoue, ne bloque jamais la clôture.
      const uri = input.proofPhotoUrl;
      if (uri && isUploadableEvidenceUri(uri) && profile?.organization_id) {
        const storagePath = await uploadEvidencePhoto({
          organizationId: profile.organization_id,
          entityType: 'task',
          entityId: id,
          uri,
          uploadedBy: user?.id ?? null,
        });
        if (storagePath) updates.proof_photo_url = storagePath;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        return { data: null, error: mapSupabaseError('Erreur clôture', error) };
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      await spawnNextOccurrence(id);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur completeTask', error),
      };
    }
  };

  /** Validation manager d'une tâche clôturée (preuve de contrôle). */
  const validateTask = async (id: string, validatorName: string) => {
    const now = new Date().toISOString();
    const updates: Partial<Task> = {
      validated_by: profile?.id ?? null,
      validated_by_name: validatorName,
      validated_at: now,
      updated_at: now,
    };

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

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur validation', error),
        };
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      if (profile?.organization_id) {
        await supabase.from('task_validations').insert({
          organization_id: profile.organization_id,
          task_id: id,
          validated_by: profile.id,
          validator_name: validatorName,
        });
      }
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur validateTask', error),
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
    error,
    createTask,
    updateTaskStatus,
    completeTask,
    validateTask,
    getMyTasks,
    getTasksByStatus,
    getTasksByPriority,
    refetch: fetchTasks,
  };
}
