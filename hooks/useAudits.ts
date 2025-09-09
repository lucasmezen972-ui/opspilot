import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAudits() {
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchAudits()
    }
  }, [profile])

  const fetchAudits = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📊 Récupération des audits...')
      
      const { data, error: fetchError } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erreur récupération audits:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ Audits récupérés:', data?.length || 0)
      setAudits(data || [])
    } catch (error: any) {
      console.error('❌ Erreur inattendue audits:', error)
      setError(error.message || 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  const createAudit = async (auditData: {
    title: string
    description?: string
    location?: string
    due_date?: string
  }) => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      console.log('🆕 Création audit:', auditData.title)
      
      const { data, error: createError } = await supabase
        .from('audits')
        .insert({
          organization_id: profile.organization_id || '550e8400-e29b-41d4-a716-446655440000',
          store_id: profile.store_id || '550e8400-e29b-41d4-a716-446655440001',
          auditor_id: profile.id,
          title: auditData.title,
          description: auditData.description,
          location: auditData.location,
          status: 'pending',
          max_score: 100,
          issues_count: 0,
          due_date: auditData.due_date
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Erreur création audit:', createError)
        return { error: createError.message }
      }

      console.log('✅ Audit créé:', data)
      setAudits([data, ...audits])
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue création audit:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const updateAuditStatus = async (auditId: string, status: string, score?: number) => {
    try {
      console.log('🔄 Mise à jour audit:', auditId, status)
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      if (score !== undefined) {
        updateData.score = score
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('audits')
        .update(updateData)
        .eq('id', auditId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erreur mise à jour audit:', updateError)
        return { error: updateError.message }
      }

      console.log('✅ Audit mis à jour:', data)
      setAudits(audits.map(a => a.id === auditId ? data : a))
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue mise à jour audit:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const addPhotoToAudit = async (auditId: string, imageUrl: string, comment?: string) => {
    try {
      console.log('📸 Ajout photo à audit:', auditId)
      
      const { data, error: photoError } = await supabase
        .from('audit_photos')
        .insert({
          organization_id: profile?.organization_id,
          audit_id: auditId,
          image_url: imageUrl,
          comment: comment || 'Photo ajoutée depuis l\'application',
          uploaded_by: profile?.id
        })
        .select()
        .single()

      if (photoError) {
        console.error('❌ Erreur ajout photo:', photoError)
        return { error: photoError.message }
      }

      console.log('✅ Photo ajoutée:', data)
      await fetchAudits()
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue ajout photo:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  return {
    audits,
    loading,
    error,
    createAudit,
    updateAuditStatus,
    addPhotoToAudit,
    refetch: fetchAudits,
  }
}