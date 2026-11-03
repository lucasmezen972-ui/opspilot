import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';

import { AppButton } from '../../shared/components/AppButton';
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
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formHint}>Le nom du produit est obligatoire.</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nom du produit *</Text>
          <TextInput
            testID="product-add-name"
            accessibilityLabel="Nom du produit, obligatoire"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom du produit *"
            autoFocus
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Catégorie</Text>
          <TextInput
            accessibilityLabel="Catégorie"
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Catégorie (ex : Crèmerie)"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Stock initial</Text>
          <TextInput
            accessibilityLabel="Stock initial"
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholder="Stock initial"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Seuil de stock bas (optionnel)</Text>
          <TextInput
            accessibilityLabel="Seuil de stock bas, optionnel"
            style={styles.input}
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
            placeholder="Seuil d'alerte stock bas (optionnel)"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Prix unitaire (€)</Text>
          <TextInput
            accessibilityLabel="Prix unitaire en euros"
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="Prix (€)"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DLC dans combien de jours ?</Text>
          <TextInput
            accessibilityLabel="DLC dans combien de jours, optionnel"
            style={styles.input}
            value={dlcDays}
            onChangeText={setDlcDays}
            keyboardType="numeric"
            placeholder="DLC dans X jours (vide = sans DLC)"
          />
          <Text style={styles.fieldHint}>
            Laissez vide si le produit n’a pas de DLC.
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Code-barres (optionnel)</Text>
          <TextInput
            testID="product-add-barcode"
            accessibilityLabel="Code-barres, optionnel"
            style={styles.input}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
            placeholder="Code-barres (optionnel)"
          />
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <AppButton
          label="Annuler"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={onClose}
        />
        <AppButton
          label={submitting ? 'Ajout…' : 'Ajouter'}
          variant="success"
          fullWidth={false}
          style={{ flex: 1 }}
          testID="product-add-submit"
          onPress={handleSubmit}
          disabled={!name.trim() || submitting}
          loading={submitting}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  form: { flexShrink: 1 },
  formContent: { gap: spacing.lg, paddingBottom: spacing.xs },
  formHint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  field: { gap: spacing.sm },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textStrong },
  fieldHint: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 48,
    color: colors.textStrong,
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
