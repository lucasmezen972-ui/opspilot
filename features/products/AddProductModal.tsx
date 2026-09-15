import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';

export interface NewProductPayload {
  name: string;
  category: string | null;
  stock_quantity: number;
  min_stock: number | null;
  price: number | null;
  dlc: string | null;
  barcode: string | null;
}

interface AddProductModalProps {
  visible: boolean;
  prefillBarcode: string;
  onClose: () => void;
  onSubmit: (payload: NewProductPayload) => Promise<void> | void;
}

export function AddProductModal({
  visible,
  prefillBarcode,
  onClose,
  onSubmit,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('');
  const [price, setPrice] = useState('');
  const [dlcDays, setDlcDays] = useState('');
  const [barcode, setBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setCategory('');
      setStock('0');
      setMinStock('');
      setPrice('');
      setDlcDays('');
      setBarcode(prefillBarcode);
      setSubmitting(false);
    }
  }, [visible, prefillBarcode]);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const days = parseInt(dlcDays, 10);
      const parsedPrice = parseFloat(price.replace(',', '.'));
      const parsedStock = parseInt(stock, 10);
      const parsedMinStock = parseInt(minStock, 10);
      await onSubmit({
        name: name.trim(),
        category: category.trim() || null,
        stock_quantity:
          Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 0,
        min_stock: Number.isFinite(parsedMinStock) ? parsedMinStock : null,
        price:
          Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null,
        dlc:
          Number.isFinite(days) && days > 0
            ? new Date(Date.now() + days * 86400000).toISOString()
            : null,
        barcode: barcode.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Ajouter un produit"
      testID="product-add-modal"
    >
      <TextInput
        testID="product-add-name"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nom du produit *"
        autoFocus
      />
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Catégorie (ex : Crèmerie)"
      />
      <TextInput
        style={styles.input}
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
        placeholder="Stock initial"
      />
      <TextInput
        style={styles.input}
        value={minStock}
        onChangeText={setMinStock}
        keyboardType="numeric"
        placeholder="Seuil d'alerte stock bas (optionnel)"
      />
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="Prix (€)"
      />
      <TextInput
        style={styles.input}
        value={dlcDays}
        onChangeText={setDlcDays}
        keyboardType="numeric"
        placeholder="DLC dans X jours (vide = sans DLC)"
      />
      <TextInput
        testID="product-add-barcode"
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        keyboardType="numeric"
        placeholder="Code-barres (optionnel)"
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="product-add-submit"
          style={[styles.confirmButton, submitting && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.confirmText}>
            {submitting ? 'Ajout…' : 'Ajouter'}
          </Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
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
