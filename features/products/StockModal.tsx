import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import type { Product } from '../../lib/supabase';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface StockModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (product: Product, newStock: number) => Promise<void> | void;
}

export function StockModal({
  product,
  visible,
  onClose,
  onConfirm,
}: StockModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible && product) {
      setValue(String(product.stock_quantity));
    }
  }, [visible, product]);

  const handleConfirm = async () => {
    const parsed = parseInt(value || '0', 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && product) {
      await onConfirm(product, parsed);
    } else {
      onClose();
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title="Modifier le stock">
      <Text style={styles.productName} testID="product-stock-name">
        {product?.name}
      </Text>
      <Text style={styles.subtitle}>
        Stock actuel: {product?.stock_quantity}
      </Text>
      <TextInput
        testID="product-stock-input"
        style={styles.input}
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        placeholder="Nouveau stock"
        autoFocus
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="product-stock-confirm"
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  productName: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundAlt,
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  confirmButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
