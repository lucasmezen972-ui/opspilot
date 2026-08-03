import { Megaphone, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  level: 'info' | 'warning' | 'success';
}

const LEVEL_COLORS: Record<Announcement['level'], { bg: string; fg: string }> =
  {
    info: { bg: '#EFF6FF', fg: '#1D4ED8' },
    warning: { bg: '#FFFBEB', fg: '#B45309' },
    success: { bg: '#F0FDF4', fg: '#15803D' },
  };

const DISMISSED_KEY = 'opspilot_dismissed_announcements';

function getDismissed(): string[] {
  try {
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    return JSON.parse(
      (typeof window !== 'undefined' &&
        window.localStorage?.getItem(DISMISSED_KEY)) ||
        '[]',
    );
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify([...getDismissed(), id].slice(-50)),
      );
    }
  } catch {
    /* no-op */
  }
}

/**
 * Bannière des annonces publiées depuis le back-office (globales ou pour
 * l'organisation de l'utilisateur). RLS : announcements_select.
 * Invisible en démo locale (pas de session) et fermable (localStorage).
 */
export default function AnnouncementBanner() {
  const { session } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hidden, setHidden] = useState<string[]>(getDismissed());

  useEffect(() => {
    if (!session) return;
    supabase
      .from('announcements')
      .select('id, title, body, level')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (!error && data) setAnnouncements(data as Announcement[]);
      });
  }, [session]);

  const visible = announcements.filter((a) => !hidden.includes(a.id));
  if (visible.length === 0) return null;
  const a = visible[0]!;
  const colors = LEVEL_COLORS[a.level] ?? LEVEL_COLORS.info;

  return (
    <View
      testID="announcement-banner"
      style={[styles.banner, { backgroundColor: colors.bg }]}
    >
      <Megaphone size={16} color={colors.fg} />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: colors.fg }]}>{a.title}</Text>
        {!!a.body && (
          <Text style={[styles.body, { color: colors.fg }]} numberOfLines={2}>
            {a.body}
          </Text>
        )}
      </View>
      <TouchableOpacity
        testID="announcement-dismiss"
        onPress={() => {
          dismiss(a.id);
          setHidden(getDismissed());
        }}
        hitSlop={8}
      >
        <X size={16} color={colors.fg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 50,
  },
  texts: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  body: { fontSize: 12, marginTop: 1 },
});
