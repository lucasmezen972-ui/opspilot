import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { TrendingUp, TriangleAlert as AlertTriangle, Target, Award, Brain, Shield, Clock, ChartBar as BarChart3 } from 'lucide-react-native'
import { useAdvancedLMS } from '../hooks/useAdvancedLMS'
import { useAdvancedAudit } from '../hooks/useAdvancedAudit'
import { useAuth } from '../hooks/useAuth'
import AIRecommendationsPanel from './AIRecommendationsPanel'

export default function AdvancedDashboard() {
  const { profile } = useAuth()
  const { recommendations, competencies, learningPaths } = useAdvancedLMS()
  const { capas, generatePredictiveInsights } = useAdvancedAudit()
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => {
    const predictiveInsights = generatePredictiveInsights()
    setInsights(predictiveInsights)
  }, [capas])

  const getCompetencyGap = () => {
    const gaps = competencies.filter(c => c.current_level < c.target_level)
    return gaps.length
  }

  const getPendingCapas = () => {
    return capas.filter(c => c.status === 'open' || c.status === 'in_progress').length
  }

  const getOverdueCapas = () => {
    return capas.filter(c => 
      c.status !== 'closed' && new Date(c.due_date) < new Date()
    ).length
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header intelligente */}
      <View style={styles.intelligentHeader}>
        <Text style={styles.welcomeText}>
          <Text>Bonjour </Text>
          <Text>{profile?.full_name?.split(' ')[0] || 'Utilisateur'}</Text>
          <Text> 👋</Text>
        </Text>
        <Text style={styles.roleText}>
          <Text>{profile?.role === 'admin' ? 'Administrateur' : 
           profile?.role === 'manager' ? 'Responsable' : 'Employé'}</Text>
          <Text> • Niveau </Text>
          <Text>{profile?.level || 1}</Text>
        </Text>
        
        {insights.length > 0 && (
          <View style={styles.aiInsightBanner}>
            <Brain size={16} color="#7C3AED" />
            <Text style={styles.aiInsightText}>
              {insights[0].message}
            </Text>
          </View>
        )}
      </View>

      {/* Métriques clés */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Target size={24} color="#10B981" />
          <Text style={styles.metricValue}>{competencies.length - getCompetencyGap()}/{competencies.length}</Text>
          <Text style={styles.metricLabel}>Compétences maîtrisées</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Shield size={24} color="#EF4444" />
          <Text style={styles.metricValue}>{getPendingCapas()}</Text>
          <Text style={styles.metricLabel}>CAPA en cours</Text>
          {getOverdueCapas() > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertText}>{getOverdueCapas()} en retard</Text>
            </View>
          )}
        </View>

      {/* Panel IA intégré */}
      <AIRecommendationsPanel />
        
        <View style={styles.metricCard}>
          <Award size={24} color="#F59E0B" />
          <Text style={styles.metricValue}>{profile?.completed_trainings || 0}</Text>
          <Text style={styles.metricLabel}>Certifications</Text>
        </View>
        
        <View style={styles.metricCard}>
          <TrendingUp size={24} color="#2563EB" />
          <Text style={styles.metricValue}>{profile?.avg_score || 0}%</Text>
          <Text style={styles.metricLabel}>Performance</Text>
        </View>
      </View>

      {/* Recommandations IA */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={20} color="#7C3AED" />
          <Text style={styles.sectionTitle}>Recommandations intelligentes</Text>
        </View>
        
        {recommendations.filter(r => r.status === 'pending').map((rec) => (
          <TouchableOpacity key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <View style={styles.confidenceScore}>
                <Text style={styles.confidenceText}>{Math.round(rec.confidence_score * 100)}%</Text>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
            
            <View style={styles.recommendationActions}>
              <TouchableOpacity style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dismissButton}>
                <Text style={styles.dismissButtonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parcours personnalisés */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Vos parcours personnalisés</Text>
        </View>
        
        {learningPaths.slice(0, 3).map((path) => (
          <TouchableOpacity key={path.id} style={styles.pathCard}>
            <View style={styles.pathHeader}>
              <Text style={styles.pathTitle}>{path.name}</Text>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(path.difficulty_level) }
              ]}>
                <Text style={styles.difficultyText}>{getDifficultyText(path.difficulty_level)}</Text>
              </View>
            </View>
            
            <Text style={styles.pathDescription}>{path.description}</Text>
            
            <View style={styles.pathMeta}>
              <View style={styles.pathMetaItem}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.pathMetaText}>{path.estimated_duration_hours}h</Text>
              </View>
              {path.is_mandatory && (
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryText}>Obligatoire</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Insights prédictifs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>Analytics prédictifs</Text>
        </View>
        
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <AlertTriangle size={16} color="#F59E0B" />
            <View style={styles.insightContent}>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              <View style={styles.insightActions}>
                {insight.actions.slice(0, 2).map((action: string, i: number) => (
                  <TouchableOpacity key={i} style={styles.insightAction}>
                    <Text style={styles.insightActionText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'beginner': return '#10B98120'
    case 'intermediate': return '#F59E0B20'
    case 'advanced': return '#EF444420'
    case 'expert': return '#7C3AED20'
    default: return '#6B728020'
  }
}

const getDifficultyText = (level: string) => {
  switch (level) {
    case 'beginner': return 'Débutant'
    case 'intermediate': return 'Intermédiaire'
    case 'advanced': return 'Avancé'
    case 'expert': return 'Expert'
    default: return 'Standard'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  intelligentHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  roleText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  aiInsightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  aiInsightText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  alertText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  confidenceScore: {
    backgroundColor: '#7C3AED20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  recommendationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pathTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pathDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  pathMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  mandatoryBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mandatoryText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightMessage: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  insightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  insightAction: {
    backgroundColor: '#F59E0B10',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  insightActionText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
})