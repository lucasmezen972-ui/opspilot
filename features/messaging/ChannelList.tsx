import { Hash, Megaphone, Store, Wheat } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Channel } from '../../lib/supabase';
import { colors } from '../../shared/styles/tokens';

const CHANNEL_ICONS = {
  general: Hash,
  announcement: Megaphone,
  store: Store,
  department: Wheat,
} as const;

interface Props {
  channels: Channel[];
  activeChannelId: string | null;
  getUnreadCount: (channelId: string) => number;
  onSelect: (channelId: string) => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  getUnreadCount,
  onSelect,
}: Props) {
  return (
    <View style={styles.container} testID="channel-list">
      <Text style={styles.header}>Canaux</Text>
      {channels.map((ch) => {
        const Icon = CHANNEL_ICONS[ch.type] ?? Hash;
        const unread = getUnreadCount(ch.id);
        const active = ch.id === activeChannelId;
        return (
          <TouchableOpacity
            key={ch.id}
            style={[styles.row, active && styles.rowActive]}
            onPress={() => onSelect(ch.id)}
            testID={`channel-item-${ch.id}`}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Icon size={16} color={active ? '#FFFFFF' : colors.textMuted} />
            </View>
            <View style={styles.info}>
              <Text
                style={[styles.name, active && styles.nameActive]}
                numberOfLines={1}
              >
                {ch.name}
              </Text>
              {ch.description ? (
                <Text style={styles.desc} numberOfLines={1}>
                  {ch.description}
                </Text>
              ) : null}
            </View>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
    marginBottom: 2,
  },
  rowActive: {
    backgroundColor: colors.primarySoft,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  nameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  desc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
