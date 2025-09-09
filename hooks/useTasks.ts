import { useState } from 'react';

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const createTask = async (_data: any) => ({ data: null, error: null });
  const updateTaskStatus = async (_id: string, _status: string) => ({ data: null, error: null });
  const getMyTasks = () => tasks;
  const getTasksByStatus = (_status: string) => tasks;
  const getTasksByPriority = (_priority: string) => tasks;
  const refetch = async () => {};

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    getMyTasks,
    getTasksByStatus,
    getTasksByPriority,
    refetch,
  };
}
