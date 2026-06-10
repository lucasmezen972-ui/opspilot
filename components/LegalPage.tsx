import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type LegalSection = { title: string; content: ReactNode };

type LegalPageProps = {
  title: string;
  updatedAt: string;
  notice?: string;
  sections: LegalSection[];
};

export default function LegalPage({
  title,
  updatedAt,
  notice,
  sections,
}: LegalPageProps) {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title, headerShown: false }} />
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={20} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.brand}>OpsPilot</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.updated}>Dernière mise à jour : {updatedAt}</Text>
          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {typeof section.content === 'string' ? (
                <Text style={styles.paragraph}>{section.content}</Text>
              ) : (
                section.content
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:privacy@opspilot.fr')}
            style={styles.contactButton}
            accessibilityRole="link"
          >
            <Text style={styles.contactButtonText}>
              Contacter OpsPilot au sujet de mes données
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

export const legalStyles = StyleSheet.create({
  paragraph: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 10,
  },
  bullet: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 6,
    paddingLeft: 8,
  },
  link: {
    color: '#1D4ED8',
    fontSize: 15,
    lineHeight: 23,
    textDecorationLine: 'underline',
  },
  placeholder: {
    color: '#9A3412',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
  },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  headerText: { flex: 1 },
  brand: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: { color: '#111827', fontSize: 22, fontWeight: '700' },
  scroll: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 820,
    padding: 20,
    paddingBottom: 48,
    width: '100%',
  },
  updated: { color: '#6B7280', fontSize: 13, marginBottom: 16 },
  notice: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  noticeText: {
    color: '#9A3412',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  paragraph: { color: '#374151', fontSize: 15, lineHeight: 23 },
  contactButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
