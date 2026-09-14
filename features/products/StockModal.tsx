import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';

import { modalStyles } from './modalStyles';
import type { Product } from '../../lib/supabase';

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
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>
              {showDetails ? 'Modifier le produit' : 'Modifier le stock'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.productName} testID="product-stock-name">
            {product?.name}
          </Text>

          <ScrollView style={styles.scrollContent}>
            <Text style={styles.fieldLabel}>Stock</Text>
            <TextInput
              testID="product-stock-input"
              style={modalStyles.modalInput}
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
                  style={modalStyles.modalInput}
                  value={dlcValue}
                  onChangeText={setDlcValue}
                  placeholder="2025-12-31"
                />
                <Text style={styles.fieldLabel}>Prix unitaire (€)</Text>
                <TextInput
                  testID="product-price-input"
                  style={modalStyles.modalInput}
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

          <View style={modalStyles.modalActions}>
            <TouchableOpacity
              style={modalStyles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={modalStyles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="product-stock-confirm"
              style={modalStyles.modalConfirmButton}
              onPress={handleConfirm}
            >
              <Text style={modalStyles.modalConfirmText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  productName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  scrollContent: {
    maxHeight: 300,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  detailsToggle: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  detailsToggleText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
});
