import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';

import { modalStyles } from './modalStyles';

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
      const parsedMinStock = parseInt(minStock, 10);
      await onSubmit({
        name: name.trim(),
        category: category.trim() || null,
        stock_quantity: parseInt(stock, 10) || 0,
        min_stock: Number.isFinite(parsedMinStock) ? parsedMinStock : null,
        price: Number.isFinite(parsedPrice) ? parsedPrice : null,
        dlc: Number.isFinite(days)
          ? new Date(Date.now() + days * 86400000).toISOString()
          : null,
        barcode: barcode.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent} testID="product-add-modal">
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Ajouter un produit</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            testID="product-add-name"
            style={modalStyles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Nom du produit *"
            autoFocus
          />
          <TextInput
            style={modalStyles.modalInput}
            value={category}
            onChangeText={setCategory}
            placeholder="Catégorie (ex : Crèmerie)"
          />
          <TextInput
            style={modalStyles.modalInput}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholder="Stock initial"
          />
          <TextInput
            style={modalStyles.modalInput}
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
            placeholder="Seuil d'alerte stock bas (optionnel)"
          />
          <TextInput
            style={modalStyles.modalInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Prix (€)"
          />
          <TextInput
            style={modalStyles.modalInput}
            value={dlcDays}
            onChangeText={setDlcDays}
            keyboardType="numeric"
            placeholder="DLC dans X jours (vide = sans DLC)"
          />
          <TextInput
            testID="product-add-barcode"
            style={modalStyles.modalInput}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
            placeholder="Code-barres (optionnel)"
          />
          <View style={modalStyles.modalActions}>
            <TouchableOpacity
              style={modalStyles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={modalStyles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="product-add-submit"
              style={[
                modalStyles.modalConfirmButton,
                submitting && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={modalStyles.modalConfirmText}>
                {submitting ? 'Ajout…' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
