import { useEffect, useState } from 'react'
import { supabase, type Audit } from '../lib/supabase'
import { useAuth } from './useAuth'
import { isOnline, loadOfflineAudits, setOfflineAudits, queueAudit, queuePhoto } from '../lib/offline'

let Location: typeof import('expo-location') | undefined
try {
  Location = require('expo-location')
} catch {}

const getCurrentLocation = async () => {
  if (!Location) return undefined
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return undefined
    const { coords } = await Location.getCurrentPositionAsync({})
    return { latitude: coords.latitude, longitude: coords.longitude }
  } catch (err) {
    console.warn('Erreur localisation', err)
    return undefined
  }
}

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAudits()
    }
  }, [profile])

  const fetchAudits = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      if (await isOnline()) {
        const { data, error } = await supabase
          .from('audits')
          .select(`
            *,
            profiles(full_name),
            stores(name)
          `)
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erreur lors de la récupération des audits:', error)
          return
        }

        setAudits(data || [])
        await setOfflineAudits(data || [])
      } else {
        const local = await loadOfflineAudits()
        setAudits(local)
      }
    } catch (error) {
      console.error('Erreur:', error)
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
    if (!profile?.organization_id || !profile?.store_id) return { error: 'Organisation ou magasin non défini' }

    try {
      if (await isOnline()) {
        const { data, error } = await supabase
          .from('audits')
          .insert({
            ...auditData,
            organization_id: profile.organization_id,
            store_id: profile.store_id,
            auditor_id: profile.id,
            status: 'pending',
            max_score: 100,
            issues_count: 0,
            photos: [],
          })
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de la création de l\'audit:', error)
          return { error }
        }

        setAudits([data, ...audits])
        await setOfflineAudits([data, ...audits])
        return { data }
      } else {
        const offlineId = `offline-${Date.now()}`
        const localAudit: Audit & { local_id: string } = {
          ...auditData,
          organization_id: profile.organization_id,
          store_id: profile.store_id,
          auditor_id: profile.id,
          status: 'pending',
          max_score: 100,
          issues_count: 0,
          photos: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          local_id: offlineId,
          id: offlineId,
        }
        setAudits([localAudit, ...audits])
        await queueAudit(localAudit)
        return { data: localAudit }
      }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const updateAuditStatus = async (auditId: string, status: Audit['status'], additionalData?: Partial<Audit>) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      if (status === 'in_progress' && !additionalData?.started_at) {
        updateData.started_at = new Date().toISOString()
      }

      if (status === 'completed' && !additionalData?.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      if (status === 'completed') {
        const { data: responses, error: respError } = await supabase
          .from('audit_responses')
          .select('score, audit_items(points)')
          .eq('audit_id', auditId)

        if (!respError && responses) {
          let total = 0
          let max = 0
          let issues = 0
          ;(responses as { score: number | null; audit_items: { points: number }[] }[]).forEach(r => {
            const itemMax = r.audit_items[0]?.points ?? 0
            const s = r.score ?? 0
            total += s
            max += itemMax
            if (s < itemMax) issues++
          })
          updateData.score = total
          updateData.max_score = max
          updateData.issues_count = issues
        }
      }

      if (status === 'in_progress') {
        const loc = await getCurrentLocation()
        if (loc) {
          updateData.start_latitude = loc.latitude
          updateData.start_longitude = loc.longitude
        }
      }

      if (status === 'completed') {
        const loc = await getCurrentLocation()
        if (loc) {
          updateData.end_latitude = loc.latitude
          updateData.end_longitude = loc.longitude
        }
      }

      if (await isOnline()) {
        const { data, error } = await supabase
          .from('audits')
          .update(updateData)
          .eq('id', auditId)
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de la mise à jour de l\'audit:', error)
          return { error }
        }

        setAudits(audits.map(a => a.id === auditId ? data : a))

        if (status === 'completed' && profile) {
          await updateProfileStats()
        }

        await setOfflineAudits(audits.map(a => a.id === auditId ? data : a))
        return { data }
      } else {
        const existing = audits.find(a => a.id === auditId)
        if (!existing) return { error: 'Audit non trouvé' }
        const localUpdated = { ...existing, ...updateData }
        setAudits(audits.map(a => a.id === auditId ? localUpdated : a))
        await queueAudit(localUpdated)
        return { data: localUpdated }
      }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const updateProfileStats = async () => {
    if (!profile) return

    try {
      const { data: completedAudits } = await supabase
        .from('audits')
        .select('score')
        .eq('auditor_id', profile.id)
        .eq('status', 'completed')

      if (completedAudits && completedAudits.length > 0) {
        const totalAudits = completedAudits.length
        const avgScore = completedAudits
          .filter(a => a.score !== null)
          .reduce((sum, a) => sum + (a.score || 0), 0) / totalAudits

        await supabase
          .from('profiles')
          .update({
            total_audits: totalAudits,
            avg_score: Math.round(avgScore * 100) / 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stats:', error)
    }
  }

  const addPhotoToAudit = async (auditId: string, photoUrl: string) => {
    const audit = audits.find(a => a.id === auditId)
    if (!audit) return { error: 'Audit non trouvé' }

    try {
      const updatedPhotos = [...audit.photos, photoUrl]

      if (await isOnline()) {
        const { data, error } = await supabase
          .from('audits')
          .update({
            photos: updatedPhotos,
            updated_at: new Date().toISOString()
          })
          .eq('id', auditId)
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de l\'ajout de la photo:', error)
          return { error }
        }

        setAudits(audits.map(a => a.id === auditId ? data : a))
        await setOfflineAudits(audits.map(a => a.id === auditId ? data : a))
        return { data }
      } else {
        await queuePhoto(auditId, photoUrl)
        const localAudit = audits.find(a => a.id === auditId)
        if (localAudit) {
          const updated = { ...localAudit, photos: updatedPhotos }
          const updatedList = audits.map(a => a.id === auditId ? updated : a)
          setAudits(updatedList)
          await setOfflineAudits(updatedList)
          return { data: updated }
        }
        return { error: 'Audit non trouvé' }
      }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  return {
    audits,
    loading,
    createAudit,
    updateAuditStatus,
    addPhotoToAudit,
    refetch: fetchAudits,
  }
}