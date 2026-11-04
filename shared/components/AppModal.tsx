import { X } from 'lucide-react-native';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

import { colors, radius, spacing, shadow, zIndex } from '../styles/tokens';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  testID?: string;
  maxWidth?: number;
  scrollable?: boolean;
  closeLabel?: string;
}

/** Modale premium tokenisée : overlay, carte centrée, en-tête + fermeture. */
export function AppModal({
  visible,
  onClose,
  title,
  children,
  testID,
  maxWidth = 460,
  scrollable = false,
  closeLabel = 'Fermer',
}: AppModalProps) {
  const { height } = useWindowDimensions();
  const titleId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);
  // RN Web's trap can remember the auto-focused field instead of the opener.
  // Remember focus outside dialogs while closed, then restore after dismissal.
  useEffect(() => {
    if (Platform.OS !== 'web' || visible) return;
    const remember = (target: EventTarget | null) => {
      if (
        target instanceof HTMLElement &&
        target !== document.body &&
        !target.closest('[aria-modal="true"]')
      )
        returnFocus.current = target;
    };
    remember(document.activeElement);
    const listener = (event: FocusEvent) => remember(event.target);
    document.addEventListener('focusin', listener);
    return () => document.removeEventListener('focusin', listener);
  }, [visible]);
  return (
    <Modal
      accessibilityLabel={title ?? 'Fenêtre'}
      aria-labelledby={title ? titleId : undefined}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => {
        if (Platform.OS === 'web')
          requestAnimationFrame(() => {
            if (
              returnFocus.current?.isConnected &&
              !document.querySelector('[role="dialog"][aria-modal="true"]')
            ) {
              returnFocus.current.focus({ preventScroll: true });
            }
          });
      }}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay} testID={testID}>
          <View
            style={[
              styles.card,
              { maxWidth, maxHeight: Math.max(160, height - 32) },
            ]}
          >
            {title && (
              <View style={styles.header}>
                <Text
                  nativeID={titleId}
                  accessibilityRole="header"
                  style={styles.title}
                >
                  {title}
                </Text>
                <TouchableOpacity
                  testID={testID ? `${testID}-close` : undefined}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={closeLabel}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flexShrink: 1 },
  scrollContent: { gap: spacing.lg, paddingBottom: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: zIndex.modal,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    paddingRight: 8,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
  },
});
