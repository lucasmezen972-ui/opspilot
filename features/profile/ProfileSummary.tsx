import { User, Star } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { shadow } from '../../shared/styles/tokens';

interface ProfileSummaryProps {
  name: string;
  role: string;
  email: string;
  level: number;
}

/** Carte d'en-tête du profil : avatar, identité, rôle et niveau. */
export function ProfileSummary({
  name,
  role,
  email,
  level,
}: ProfileSummaryProps) {
  return (
    <View style={styles.section}>
      <View style={styles.avatar}>
        <User size={32} color="#2563EB" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
        <Text style={styles.location}>{email}</Text>
      </View>
      <View style={styles.levelBadge}>
        <Star size={16} color="#F59E0B" />
        <Text style={styles.levelText}>Niveau {level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    ...shadow.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
