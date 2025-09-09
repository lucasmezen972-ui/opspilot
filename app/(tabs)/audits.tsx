import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Search, Filter, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, FileText, Camera, MapPin, ChartBar as BarChart3, TrendingUp, Play } from 'lucide-react-native';
import { useState } from 'react';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import AuditModal from '../../components/AuditModal';
import { router } from 'expo-router';

export default function AuditsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const { audits, loading, updateAuditStatus } = useAudits();
  const { hasPermission } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleAuditPress = (audit: any) => {
    setSelectedAudit(audit)
    // Navigation vers détail audit (à implémenter)
    console.log('Ouvrir audit:', audit.title)
  }

  const handleStartAudit = async (auditId: string) => {
    await updateAuditStatus(auditId, 'in_progress')
  }

  const completedAudits = audits.filter(a => a.status === 'completed').length
  const inProgressAudits = audits.filter(a => a.status === 'in_progress').length
  const pendingAudits = audits.filter(a => a.status === 'pending').length

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'À faire';
      default: return 'Inconnu';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{pendingAudits}</Text>
          <Text style={styles.quickStatLabel}>À faire</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{inProgressAudits}</Text>
          <Text style={styles.quickStatLabel}>En cours</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{completedAudits}</Text>
          <Text style={styles.quickStatLabel}>Terminés</Text>
        </View>
      </View>

      {/* Create New Audit Button */}
      {hasPermission('audits', 'create') && (
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Créer un audit</Text>
        </TouchableOpacity>
      )}

      {/* Audits List */}
      <ScrollView style={styles.auditsList}>
        {audits.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun audit</Text>
            <Text style={styles.emptySubtitle}>Créez votre premier audit pour commencer</Text>
          </View>
        ) : (
          audits.map((audit) => {
            const StatusIcon = getStatusIcon(audit.status);
            return (
              <TouchableOpacity 
                key={audit.id} 
                style={styles.auditCard}
                onPress={() => handleAuditPress(audit)}
              >
                <View style={styles.auditHeader}>
                  <View style={styles.auditTitleSection}>
                    <Text style={styles.auditTitle}>{audit.title}</Text>
                    <View style={styles.auditLocation}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.auditLocationText}>
                        {audit.location || audit.store_name || 'Localisation non définie'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.auditStatus, { backgroundColor: `${getStatusColor(audit.status)}20` }]}>
                    <StatusIcon size={16} color={getStatusColor(audit.status)} />
                    <Text style={[styles.auditStatusText, { color: getStatusColor(audit.status) }]}>
                      {getStatusText(audit.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.auditDetails}>
                  <Text style={styles.auditDate}>
                    Créé le {new Date(audit.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                  <View style={styles.auditScore}>
                    <Text style={styles.auditScoreText}>
                      Score: {audit.score ? `${audit.score}/${audit.max_score}` : '--'}
                    </Text>
                  </View>
                  {audit.issues_count > 0 && (
                    <View style={styles.auditIssues}>
                      <AlertCircle size={12} color="#F59E0B" />
                      <Text style={styles.auditIssuesText}>{audit.issues_count} problème(s)</Text>
                    </View>
                  )}
                </View>

                <View style={styles.auditActions}>
                  {audit.status === 'pending' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.startButton]}
                      onPress={() => handleStartAudit(audit.id)}
                    >
                      <Play size={16} color="#FFFFFF" />
                      <Text style={styles.startButtonText}>Commencer</Text>
                    </TouchableOpacity>
                  )}
                  
                  {audit.photos && audit.photos.length > 0 && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Camera size={16} color="#2563EB" />
                      <Text style={styles.actionButtonText}>{audit.photos.length} photo(s)</Text>
                    </TouchableOpacity>
                  )}
                  
                  {audit.status === 'completed' && (
                    <TouchableOpacity style={styles.actionButton}>
                      <BarChart3 size={16} color="#10B981" />
                      <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Voir rapport</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {hasPermission('audits', 'create') && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <Camera size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <AuditModal 
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  auditsList: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  auditTitleSection: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  auditLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditLocationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  auditStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auditStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  auditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  auditDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditScore: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  auditScoreText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  auditIssues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditIssuesText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 4,
  },
  auditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  auditIssues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditIssuesText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 4,
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  startButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    bottom: 90, // Ajuster pour éviter le chevauchement avec la barre d'onglets
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});