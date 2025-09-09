import { useEffect, useState } from 'react'
import { supabase, type Permission } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchPermissions()
    }
  }, [profile])

  const fetchPermissions = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('role')

      if (error) {
        console.error('Erreur permissions:', error)
        return
      }

      setPermissions(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserPermissions = (role: string): Record<string, string[]> => {
    const userPermissions: Record<string, string[]> = {}
    
    permissions
      .filter(p => p.role === role)
      .forEach(p => {
        userPermissions[p.resource] = p.actions
      })

    return userPermissions
  }

  const hasPermission = (resource: string, action: string, role?: string): boolean => {
    const checkRole = role || profile?.role
    if (!checkRole) return false

    // Admin a tous les droits
    if (checkRole === 'admin') return true

    const permission = permissions.find(p => 
      p.role === checkRole && p.resource === resource
    )

    return permission?.actions.includes(action) || false
  }

  const canAccess = (screen: string): boolean => {
    const screenPermissions: Record<string, { resource: string, action: string }> = {
      audits: { resource: 'audits', action: 'read' },
      tasks: { resource: 'tasks', action: 'read' },
      products: { resource: 'products', action: 'read' },
      users: { resource: 'users', action: 'read' },
      reports: { resource: 'reports', action: 'read' },
      settings: { resource: 'settings', action: 'read' }
    }

    const permission = screenPermissions[screen]
    if (!permission) return true // Écrans publics

    return hasPermission(permission.resource, permission.action)
  }

  const getRestrictedMessage = (resource: string, action: string): string => {
    return `Vous n'avez pas les permissions nécessaires pour ${action} des ${resource}.`
  }

  return {
    permissions,
    loading,
    getUserPermissions,
    hasPermission,
    canAccess,
    getRestrictedMessage,
    refetch: fetchPermissions,
  }
}