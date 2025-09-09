import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAudits } from '../../hooks/useAudits';
import { useTasks } from '../../hooks/useTasks';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { tasks } = useTasks();

  const pendingAudits = audits.filter(a => a.status !== 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard Manager</Text>
      <Text style={styles.subtitle}>Bienvenue, {profile?.full_name || 'Manager'}</Text>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Audits en cours</Text>
        <Text style={styles.statValue}>{pendingAudits}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Tâches en attente</Text>
        <Text style={styles.statValue}>{pendingTasks}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
  },
});
