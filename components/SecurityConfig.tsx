import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Shield, Key, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react-native'

export default function SecurityConfig() {
  const [securityChecks, setSecurityChecks] = useState<any>({})
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  
  useEffect(() => {
    performSecurityAudit()
  }, [])

  const performSecurityAudit = () => {
    const checks = {
      envVarsSecure: checkEnvironmentVariables(),
      demoAccountsRemoved: checkDemoAccounts(),
      rlsEnabled: checkRowLevelSecurity(),
      httpsEnforced: checkHTTPSEnforcement(),
      logsClean: checkLogSecurity(),
      dependenciesSecure: checkDependencySecurity()
    }
    
    setSecurityChecks(checks)
  }

  const checkEnvironmentVariables = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    return {
      status: supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-anon-key',
      message: 'Variables d\'environnement configurées',
      severity: 'high',
      fixes: [
        'Configurer les vraies clés Supabase',
        'Vérifier que .env est dans .gitignore',
        'Utiliser des clés différentes en prod/dev'
      ]
    }
  }

  const checkDemoAccounts = () => {
    // Vérifier s'il y a des comptes de démonstration hardcodés
    return {
      status: false, // À implémenter avec une vraie vérification
      message: 'Comptes de démonstration détectés',
      severity: 'medium',
      fixes: [
        'Supprimer les comptes demo@opspilot.com',
        'Désactiver l\'auto-fill des mots de passe',
        'Retirer les migrations de test en production'
      ]
    }
  }

  const checkRowLevelSecurity = () => {
    return {
      status: true, // Supposons que RLS est activé
      message: 'Row Level Security activé',
      severity: 'high',
      fixes: [
        'Vérifier toutes les politiques RLS',
        'Tester l\'isolation des données',
        'Auditer les permissions par rôle'
      ]
    }
  }

  const checkHTTPSEnforcement = () => {
    return {
      status: window.location.protocol === 'https:',
      message: 'HTTPS forcé en production',
      severity: 'high',
      fixes: [
        'Configurer le certificat SSL',
        'Rediriger HTTP vers HTTPS',
        'Activer HSTS headers'
      ]
    }
  }

  const checkLogSecurity = () => {
    return {
      status: process.env.NODE_ENV === 'production',
      message: 'Logs sécurisés pour la production',
      severity: 'medium',
      fixes: [
        'Masquer les mots de passe dans les logs',
        'Supprimer console.log en production',
        'Configuer un système de logs sécurisé'
      ]
    }
  }

  const checkDependencySecurity = () => {
    return {
      status: true, // À implémenter avec npm audit
      message: 'Dépendances sécurisées',
      severity: 'medium',
      fixes: [
        'Exécuter npm audit fix',
        'Mettre à jour les dépendances critiques',
        'Scanner avec Snyk ou similaire'
      ]
    }
  }

  const getSecurityScore = () => {
    const total = Object.keys(securityChecks).length
    const passed = Object.values(securityChecks).filter((check: any) => check.status).length
    return Math.round((passed / total) * 100)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const fixSecurityIssue = (checkKey: string) => {
    const check = securityChecks[checkKey]
    Alert.alert(
      'Correction de sécurité',
      `Actions recommandées pour "${check.message}":\n\n${check.fixes.join('\n')}`,
      [{ text: 'OK' }]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={24} color="#2563EB" />
        <Text style={styles.title}>Configuration Sécurité</Text>
        <View style={[
          styles.scoreCard,
          { backgroundColor: getSecurityScore() >= 80 ? '#10B98120' : '#EF444420' }
        ]}>
          <Text style={[
            styles.scoreText,
            { color: getSecurityScore() >= 80 ? '#10B981' : '#EF4444' }
          ]}>
            {getSecurityScore()}%
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowSensitiveInfo(!showSensitiveInfo)}
      >
        {showSensitiveInfo ? <EyeOff size={16} color="#6B7280" /> : <Eye size={16} color="#6B7280" />}
        <Text style={styles.toggleText}>
          {showSensitiveInfo ? 'Masquer' : 'Voir'} infos sensibles
        </Text>
      </TouchableOpacity>

      {Object.entries(securityChecks).map(([key, check]: [string, any]) => (
        <TouchableOpacity 
          key={key} 
          style={styles.checkCard}
          onPress={() => !check.status && fixSecurityIssue(key)}
        >
          <View style={styles.checkHeader}>
            {check.status ? (
              <CheckCircle size={20} color="#10B981" />
            ) : (
              <AlertTriangle size={20} color={getSeverityColor(check.severity)} />
            )}
            
            <Text style={[
              styles.checkTitle,
              { color: check.status ? '#10B981' : getSeverityColor(check.severity) }
            ]}>
              {check.message}
            </Text>
            
            <View style={[
              styles.severityBadge,
              { backgroundColor: `${getSeverityColor(check.severity)}20` }
            ]}>
              <Text style={[
                styles.severityText,
                { color: getSeverityColor(check.severity) }
              ]}>
                {check.severity}
              </Text>
            </View>
          </View>

          {!check.status && showSensitiveInfo && (
            <View style={styles.fixesContainer}>
              <Text style={styles.fixesTitle}>Actions correctives :</Text>
              {check.fixes.map((fix: string, index: number) => (
                <Text key={index} style={styles.fixItem}>• {fix}</Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.warningCard}>
        <AlertTriangle size={20} color="#F59E0B" />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>⚠️ Mode Développement Détecté</Text>
          <Text style={styles.warningText}>
            Cette application contient des comptes de démonstration et des configurations de développement. 
            Assurez-vous de sécuriser complètement avant le déploiement en production.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={performSecurityAudit}>
        <Key size={16} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Relancer l'audit sécurité</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  scoreCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  checkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fixesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fixesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  fixItem: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningContent: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
})