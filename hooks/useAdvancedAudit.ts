import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { RiskAssessment, CAPA, AuditFinding } from '../lib/types/advanced'

export function useAdvancedAudit() {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [capas, setCapas] = useState<CAPA[]>([])
  const [findings, setFindings] = useState<AuditFinding[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchAdvancedAuditData()
    }
  }, [profile])

  const fetchAdvancedAuditData = async () => {
    try {
      setLoading(true)

      const [riskData, capaData, findingsData] = await Promise.all([
        supabase.from('risk_assessments').select('*'),
        supabase.from('capas').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('audit_findings').select('*')
      ])

      setRiskAssessments(riskData.data || [])
      setCapas(capaData.data || [])
      setFindings(findingsData.data || [])
    } catch (error) {
      console.error('Erreur récupération données audit avancées:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRiskAssessment = async (auditId: string, riskData: Partial<RiskAssessment>) => {
    try {
      const riskScore = (riskData.probability || 1) * (riskData.impact || 1)
      
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert({
          audit_id: auditId,
          risk_category: riskData.risk_category,
          probability: riskData.probability,
          impact: riskData.impact,
          risk_score: riskScore,
          mitigation_actions: riskData.mitigation_actions || [],
          risk_owner: riskData.risk_owner || profile?.id,
          review_date: riskData.review_date
        })
        .select()
        .single()

      if (error) throw error

      setRiskAssessments(prev => [...prev, data])
      return { data }
    } catch (error) {
      console.error('Erreur création évaluation risque:', error)
      return { error }
    }
  }

  const createCAPA = async (findingId: string, capaData: Partial<CAPA>) => {
    try {
      const { data, error } = await supabase
        .from('capas')
        .insert({
          organization_id: profile?.organization_id,
          audit_id: capaData.audit_id,
          finding_id: findingId,
          type: capaData.type || 'corrective',
          description: capaData.description,
          root_cause_analysis: capaData.root_cause_analysis,
          action_plan: capaData.action_plan,
          assigned_to: capaData.assigned_to || profile?.id,
          due_date: capaData.due_date,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      setCapas(prev => [...prev, data])

      // Notification automatique à l'assigné
      await createCAPANotification(data)
      
      return { data }
    } catch (error) {
      console.error('Erreur création CAPA:', error)
      return { error }
    }
  }

  const updateCAPAStatus = async (capaId: string, status: CAPA['status'], verificationData?: any) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'closed' && verificationData) {
        updateData.effectiveness_verified = verificationData.verified
        updateData.verification_date = new Date().toISOString()
        updateData.verified_by = profile?.id
      }

      const { data, error } = await supabase
        .from('capas')
        .update(updateData)
        .eq('id', capaId)
        .select()
        .single()

      if (error) throw error

      setCapas(prev => prev.map(c => c.id === capaId ? data : c))
      return { data }
    } catch (error) {
      console.error('Erreur mise à jour CAPA:', error)
      return { error }
    }
  }

  const createCAPANotification = async (capa: CAPA) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          organization_id: profile?.organization_id,
          user_id: capa.assigned_to,
          title: 'Nouvelle action corrective/préventive assignée',
          content: `CAPA: ${capa.description}. Échéance: ${new Date(capa.due_date).toLocaleDateString()}`,
          notification_type: 'info',
          action_url: `/audits/capa/${capa.id}`,
          data: { capa_id: capa.id, audit_id: capa.audit_id }
        })
    } catch (error) {
      console.error('Erreur notification CAPA:', error)
    }
  }

  const generatePredictiveInsights = () => {
    // Analyse prédictive basée sur les données historiques
    const insights = []

    // Analyser les tendances de risque
    const riskTrend = analyzeRiskTrend()
    if (riskTrend.declining) {
      insights.push({
        type: 'risk_prediction',
        message: `Tendance à la hausse des risques de niveau ${riskTrend.category}. Audit préventif recommandé dans 2 semaines.`,
        confidence: 0.82,
        actions: ['Programmer audit préventif', 'Renforcer formation équipe', 'Réviser procédures']
      })
    }

    // Analyser les CAPA en retard
    const overdueCapas = capas.filter(c => 
      c.status !== 'closed' && new Date(c.due_date) < new Date()
    )
    if (overdueCapas.length > 0) {
      insights.push({
        type: 'capa_alert',
        message: `${overdueCapas.length} CAPA(s) en retard. Risque d'escalade réglementaire.`,
        confidence: 1.0,
        actions: ['Relancer les responsables', 'Réviser les échéances', 'Escalader si nécessaire']
      })
    }

    return insights
  }

  const analyzeRiskTrend = () => {
    // Simulation d'analyse - à remplacer par une vraie logique
    const recentRisks = riskAssessments.filter(r => 
      new Date(r.review_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    const avgRiskScore = recentRisks.reduce((sum, r) => sum + r.risk_score, 0) / recentRisks.length
    
    return {
      declining: avgRiskScore > 15,
      category: avgRiskScore > 20 ? 'high' : avgRiskScore > 10 ? 'medium' : 'low',
      trend: avgRiskScore
    }
  }

  return {
    riskAssessments,
    capas,
    findings,
    loading,
    createRiskAssessment,
    createCAPA,
    updateCAPAStatus,
    generatePredictiveInsights,
    refetch: fetchAdvancedAuditData
  }
}