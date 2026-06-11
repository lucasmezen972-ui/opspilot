import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';

import { modalStyles } from './modalStyles';
import type { Product } from '../../lib/supabase';

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
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Modifier le stock</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.productName} testID="product-stock-name">
            {product?.name}
          </Text>
          <Text style={styles.modalSubtitle}>
            Stock actuel: {product?.stock_quantity}
          </Text>
          <TextInput
            testID="product-stock-input"
            style={modalStyles.modalInput}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder="Nouveau stock"
            autoFocus
          />
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
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
});
