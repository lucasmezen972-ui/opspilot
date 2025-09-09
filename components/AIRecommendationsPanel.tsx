import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Brain, TrendingUp, Award, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Target } from 'lucide-react-native'
import { useAIRecommendations } from '../hooks/useAIRecommendations'

export default function AIRecommendationsPanel() {
  const { recommendations, insights, loading, acceptRecommendation, dismissRecommendation } = useAIRecommendations()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return Award
      case 'competency': return Target
      case 'career_path': return TrendingUp
      case 'risk_prediction': return AlertTriangle
      case 'compliance_alert': return AlertTriangle
      case 'performance_trend': return TrendingUp
      default: return Brain
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Brain size={32} color="#2563EB" />
        <Text style={styles.loadingText}>IA en cours d'analyse...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header IA */}
      <View style={styles.aiHeader}>
        <Brain size={24} color="#2563EB" />
        <Text style={styles.aiTitle}>Recommandations IA Personnalisées</Text>
      </View>

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Recommandations pour vous</Text>
          {recommendations.map((rec, index) => {
            const IconComponent = getTypeIcon(rec.type)
            return (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationTitleSection}>
                    <IconComponent size={20} color={getPriorityColor(rec.priority)} />
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  </View>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceScore}>{Math.round(rec.confidence_score * 100)}%</Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(rec.priority)}20` }
                    ]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(rec.priority) }]}>
                        {rec.priority}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.recommendationDescription}>{rec.description}</Text>
                
                <View style={styles.impactContainer}>
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={styles.impactText}>Impact estimé: {rec.estimated_impact}</Text>
                </View>

                <View style={styles.actionItems}>
                  <Text style={styles.actionItemsTitle}>Actions recommandées:</Text>
                  {rec.action_items.map((action, actionIndex) => (
                    <View key={actionIndex} style={styles.actionItem}>
                      <View style={styles.actionBullet} />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recommendationActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => acceptRecommendation(index)}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => dismissRecommendation(index)}
                  >
                    <Text style={styles.dismissButtonText}>Plus tard</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.deadlineContainer}>
                  <Clock size={12} color="#6B7280" />
                  <Text style={styles.deadlineText}>
                    Deadline suggérée: {rec.deadline_days} jours
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Insights prédictifs */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Insights Prédictifs</Text>
          {insights.map((insight, index) => {
            const IconComponent = getTypeIcon(insight.type)
            return (
              <View key={index} style={[
                styles.insightCard,
                { borderLeftColor: getSeverityColor(insight.severity) }
              ]}>
                <View style={styles.insightHeader}>
                  <IconComponent size={20} color={getSeverityColor(insight.severity)} />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: `${getSeverityColor(insight.severity)}20` }
                  ]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(insight.severity) }]}>
                      {insight.severity}
                    </Text>
                  </View>
                </View>

                <Text style={styles.insightDescription}>{insight.description}</Text>

                <View style={styles.insightMeta}>
                  <Text style={styles.confidenceText}>
                    Fiabilité: {Math.round(insight.confidence_level * 100)}%
                  </Text>
                  <Text style={styles.timelineText}>
                    Horizon: {insight.timeline === 'immediate' ? 'Immédiat' : 
                              insight.timeline === 'short_term' ? 'Court terme' : 'Long terme'}
                  </Text>
                </View>

                <View style={styles.impactPrediction}>
                  <Text style={styles.impactTitle}>Impact prédit:</Text>
                  <Text style={styles.impactDescription}>{insight.predicted_impact}</Text>
                </View>

                <View style={styles.kpisContainer}>
                  <Text style={styles.kpisTitle}>KPIs impactés:</Text>
                  <View style={styles.kpisList}>
                    {Object.entries(insight.kpis_impact).map(([kpi, value]) => (
                      <View key={kpi} style={styles.kpiItem}>
                        <Text style={styles.kpiLabel}>{kpi.replace('_', ' ')}</Text>
                        <Text style={styles.kpiValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.recommendedActions}>
                  <Text style={styles.actionsTitle}>Actions recommandées:</Text>
                  {insight.recommended_actions.slice(0, 3).map((action, actionIndex) => (
                    <TouchableOpacity key={actionIndex} style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceScore: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  impactText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    marginLeft: 6,
  },
  actionItems: {
    marginBottom: 16,
  },
  actionItemsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  recommendationActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  timelineText: {
    fontSize: 12,
    color: '#6B7280',
  },
  impactPrediction: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  impactDescription: {
    fontSize: 12,
    color: '#92400E',
  },
  kpisContainer: {
    marginBottom: 12,
  },
  kpisTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  kpisList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiItem: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#166534',
    marginRight: 4,
    textTransform: 'capitalize',
  },
  kpiValue: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  recommendedActions: {
    marginTop: 8,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
})