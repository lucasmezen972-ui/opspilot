import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface AnalyticsData {
  totalAudits: number
  avgScore: number
  completionRate: number
  productivityTrend: number
  topPerformers: Array<{
    id: string
    name: string
    score: number
    audits: number
  }>
  auditsByStatus: {
    pending: number
    in_progress: number
    completed: number
  }
  tasksByPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  monthlyStats: Array<{
    month: string
    audits: number
    score: number
  }>
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { profile, hasPermission } = useAuth()

  useEffect(() => {
    if (profile?.organization_id && hasPermission('reports', 'read')) {
      fetchAnalytics()
    }
  }, [profile])

  const fetchAnalytics = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)

      // Récupérer toutes les données nécessaires en parallèle
      const [auditsData, tasksData, profilesData] = await Promise.all([
        fetchAuditAnalytics(),
        fetchTaskAnalytics(),
        fetchProfileAnalytics()
      ])

      const analyticsData: AnalyticsData = {
        totalAudits: auditsData.total,
        avgScore: auditsData.avgScore,
        completionRate: auditsData.completionRate,
        productivityTrend: auditsData.trend,
        topPerformers: profilesData.topPerformers,
        auditsByStatus: auditsData.byStatus,
        tasksByPriority: tasksData.byPriority,
        monthlyStats: auditsData.monthly
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Erreur analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditAnalytics = async () => {
    const { data: audits } = await supabase
      .from('audits')
      .select('*')
      .eq('organization_id', profile?.organization_id)

    const total = audits?.length || 0
    const completed = audits?.filter(a => a.status === 'completed') || []
    const avgScore = completed.length > 0 
      ? Math.round(completed.reduce((sum, a) => sum + (a.score || 0), 0) / completed.length)
      : 0
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0

    // Calcul trend (comparaison avec le mois précédent)
    const thisMonth = new Date().getMonth()
    const lastMonth = thisMonth - 1
    const thisMonthAudits = audits?.filter(a => new Date(a.created_at).getMonth() === thisMonth) || []
    const lastMonthAudits = audits?.filter(a => new Date(a.created_at).getMonth() === lastMonth) || []
    const trend = lastMonthAudits.length > 0 
      ? Math.round(((thisMonthAudits.length - lastMonthAudits.length) / lastMonthAudits.length) * 100)
      : 0

    // Stats par statut
    const byStatus = {
      pending: audits?.filter(a => a.status === 'pending').length || 0,
      in_progress: audits?.filter(a => a.status === 'in_progress').length || 0,
      completed: audits?.filter(a => a.status === 'completed').length || 0
    }

    // Stats mensuelles (6 derniers mois)
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('fr-FR', { month: 'short' })
      const monthAudits = audits?.filter(a => 
        new Date(a.created_at).getMonth() === date.getMonth() &&
        new Date(a.created_at).getFullYear() === date.getFullYear()
      ) || []
      const monthCompleted = monthAudits.filter(a => a.status === 'completed')
      const monthScore = monthCompleted.length > 0
        ? Math.round(monthCompleted.reduce((sum, a) => sum + (a.score || 0), 0) / monthCompleted.length)
        : 0

      monthly.push({
        month,
        audits: monthAudits.length,
        score: monthScore
      })
    }

    return {
      total,
      avgScore,
      completionRate,
      trend,
      byStatus,
      monthly
    }
  }

  const fetchTaskAnalytics = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('priority')
      .eq('organization_id', profile?.organization_id)

    const byPriority = {
      low: tasks?.filter(t => t.priority === 'low').length || 0,
      medium: tasks?.filter(t => t.priority === 'medium').length || 0,
      high: tasks?.filter(t => t.priority === 'high').length || 0,
      urgent: tasks?.filter(t => t.priority === 'urgent').length || 0
    }

    return { byPriority }
  }

  const fetchProfileAnalytics = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avg_score, total_audits')
      .eq('organization_id', profile?.organization_id)
      .order('avg_score', { ascending: false })
      .limit(10)

    const topPerformers = profiles?.map(p => ({
      id: p.id,
      name: p.full_name || p.id,
      score: p.avg_score,
      audits: p.total_audits
    })) || []

    return { topPerformers }
  }

  const generatePerformanceReport = async (userId: string, dateFrom: string, dateTo: string) => {
    if (!hasPermission('reports', 'create')) {
      return { error: 'Permission insuffisante' }
    }

    try {
      // Récupérer les données de performance
      const { data: audits } = await supabase
        .from('audits')
        .select('*')
        .eq('auditor_id', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)

      const reportData = {
        user_id: userId,
        period: { from: dateFrom, to: dateTo },
        audits: {
          total: audits?.length || 0,
          completed: audits?.filter(a => a.status === 'completed').length || 0,
          avg_score: audits?.length ? Math.round(audits.reduce((sum, a) => sum + (a.score || 0), 0) / audits.length) : 0
        },
        tasks: {
          total: tasks?.length || 0,
          completed: tasks?.filter(t => t.status === 'completed').length || 0,
          on_time: tasks?.filter(t => 
            t.completed_at && t.due_date && 
            new Date(t.completed_at) <= new Date(t.due_date)
          ).length || 0
        }
      }

      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          organization_id: profile?.organization_id,
          store_id: profile?.store_id,
          generated_by: profile?.id,
          report_type: 'performance',
          title: `Rapport de performance - ${new Date().toLocaleDateString()}`,
          data: reportData,
          date_from: dateFrom,
          date_to: dateTo
        })
        .select()
        .single()

      if (error) return { error }

      return { data: report }
    } catch (error) {
      console.error('Erreur rapport:', error)
      return { error }
    }
  }

  const createNotification = async (title: string, content: string, type: 'info' | 'warning' | 'error' | 'success') => {
    if (!profile?.organization_id) return

    try {
      await supabase
        .from('notifications')
        .insert({
          organization_id: profile.organization_id,
          user_id: profile.id,
          title,
          content,
          notification_type: type
        })
    } catch (error) {
      console.error('Erreur notification:', error)
    }
  }

  return {
    analytics,
    loading,
    generatePerformanceReport,
    refetch: fetchAnalytics,
  }
}