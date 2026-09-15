import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

import type { Product } from '../../lib/supabase';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface StockModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (product: Product, newStock: number) => Promise<void> | void;
  onUpdate?: (
    product: Product,
    updates: Partial<Product>,
  ) => Promise<void> | void;
}

export function StockModal({
  product,
  visible,
  onClose,
  onConfirm,
  onUpdate,
}: StockModalProps) {
  const [stockValue, setStockValue] = useState('');
  const [dlcValue, setDlcValue] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (visible && product) {
      setStockValue(String(product.stock_quantity));
      setDlcValue(product.dlc ?? '');
      setPriceValue(product.price != null ? String(product.price) : '');
      setShowDetails(false);
    }
  }, [visible, product]);

  const handleConfirm = async () => {
    if (!product) {
      onClose();
      return;
    }

    const parsedStock = parseInt(stockValue || '0', 10);
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      onClose();
      return;
    }

    if (showDetails && onUpdate) {
      const updates: Partial<Product> = {
        stock_quantity: parsedStock,
      };
      const trimmedDlc = dlcValue.trim();
      if (trimmedDlc !== (product.dlc ?? '')) {
        updates.dlc = trimmedDlc || null;
      }
      const parsedPrice = priceValue.trim()
        ? parseFloat(priceValue.trim())
        : null;
      if (parsedPrice !== product.price) {
        updates.price = parsedPrice;
      }
      await onUpdate(product, updates);
    } else {
      await onConfirm(product, parsedStock);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={showDetails ? 'Modifier le produit' : 'Modifier le stock'}
    >
      <Text style={styles.productName} testID="product-stock-name">
        {product?.name}
      </Text>
      <Text style={styles.subtitle}>
        Stock actuel: {product?.stock_quantity}
      </Text>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.fieldLabel}>Stock</Text>
        <TextInput
          testID="product-stock-input"
          style={styles.input}
          value={stockValue}
          onChangeText={setStockValue}
          keyboardType="numeric"
          placeholder="Quantité en stock"
          autoFocus={!showDetails}
        />

        {showDetails && (
          <>
            <Text style={styles.fieldLabel}>
              Date limite (DLC) — AAAA-MM-JJ
            </Text>
            <TextInput
              testID="product-dlc-input"
              style={styles.input}
              value={dlcValue}
              onChangeText={setDlcValue}
              placeholder="2025-12-31"
            />
            <Text style={styles.fieldLabel}>Prix unitaire (€)</Text>
            <TextInput
              testID="product-price-input"
              style={styles.input}
              value={priceValue}
              onChangeText={setPriceValue}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </>
        )}

        {!showDetails && onUpdate && (
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowDetails(true)}
          >
            <Text style={styles.detailsToggleText}>
              Modifier aussi la DLC et le prix
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    maxHeight: 300,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 6,
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
  detailsToggle: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  detailsToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
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
