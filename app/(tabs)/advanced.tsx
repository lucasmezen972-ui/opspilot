import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Brain, Shield, ChartBar as BarChart3, Settings } from 'lucide-react-native'
import AdvancedDashboard from '../../components/AdvancedDashboard'
import SecurityConfig from '../../components/SecurityConfig'

export default function AdvancedScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'analytics' | 'settings'>('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdvancedDashboard />
      case 'security':
        return <SecurityConfig />
      case 'analytics':
        return (
          <View style={styles.placeholder}>
            <BarChart3 size={48} color="#9CA3AF" />
            <Text style={styles.placeholderTitle}>Analytics Avancés</Text>
            <Text style={styles.placeholderSubtitle}>
              Tableaux de bord prédictifs, métriques de performance et insights IA
            </Text>
          </View>
        )
      case 'settings':
        return (
          <View style={styles.placeholder}>
            <Settings size={48} color="#9CA3AF" />
            <Text style={styles.placeholderTitle}>Paramètres Avancés</Text>
            <Text style={styles.placeholderSubtitle}>
              Configuration des parcours, workflows CAPA et intégrations
            </Text>
          </View>
        )
      default:
        return <AdvancedDashboard />
    }
  }

  return (
    <View style={styles.container}>
      {/* Tabs de navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Brain size={16} color={activeTab === 'dashboard' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
              Dashboard IA
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
          >
            <Shield size={16} color={activeTab === 'security' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
              Sécurité
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} color={activeTab === 'analytics' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={16} color={activeTab === 'settings' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Config
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 60,
    paddingBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
})