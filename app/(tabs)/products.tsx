import { Plus, Scan, Search, Package, X } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

import {
  AddProductModal,
  type NewProductPayload,
} from '../../features/products/AddProductModal';
import { BarcodeScannerModal } from '../../features/products/BarcodeScannerModal';
import { ProductCard } from '../../features/products/ProductCard';
import { ProductQuickStats } from '../../features/products/ProductQuickStats';
import { StockModal } from '../../features/products/StockModal';
import {
  filterProducts,
  getStockCounts,
} from '../../features/products/productModel';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { AppEmptyState } from '../../shared/components/AppEmptyState';
import { AppLoadingState } from '../../shared/components/AppLoadingState';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { colors, shadow } from '../../shared/styles/tokens';

export default function ProductsScreen() {
  const {
    products: allProducts,
    loading,
    scanProduct,
    createProduct,
    updateProductStock,
    deleteProduct,
  } = useProducts();
  const [isScanning, setIsScanning] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState('');

  const openAddModal = (barcode?: string) => {
    setPrefillBarcode(barcode ?? '');
    setAddModalVisible(true);
  };

  const handleAddProduct = async (payload: NewProductPayload) => {
    const result = await createProduct(payload);
    setAddModalVisible(false);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert('Produit ajouté', `${payload.name} a été ajouté au stock.`);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Supprimer le produit',
      `Supprimer « ${product.name} » du catalogue ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteProduct(product.id);
            if (error) Alert.alert('Erreur', String(error));
          },
        },
      ],
    );
  };

  const handleStockConfirm = async (product: Product, newStock: number) => {
    const { error } = await updateProductStock(product.id, newStock);
    setStockModalProduct(null);
    if (error) {
      Alert.alert('Erreur', String(error));
    }
  };

  const products = useMemo(
    () => filterProducts(allProducts, searchQuery),
    [allProducts, searchQuery],
  );
  const stockCounts = useMemo(() => getStockCounts(products), [products]);

  const handleBarcodeDetected = async (barcode: string) => {
    setIsScanning(true);
    try {
      const scannedProduct = await scanProduct(barcode);
      if (scannedProduct) setStockModalProduct(scannedProduct);
      else openAddModal(barcode);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Produits"
        titleTestID="page-products-title"
        subtitle="Catalogue, scan & DLC"
        right={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search
                size={20}
                color={showSearch ? colors.successText : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="product-add-button"
              style={[styles.headerButton, styles.headerButtonPrimary]}
              onPress={() => openAddModal()}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        }
      />

      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ProductQuickStats counts={stockCounts} />

      {/* Scanner Button */}
      <AppButton
        testID="product-scan-button"
        label={isScanning ? 'Scan en cours...' : 'Scanner un produit'}
        icon={Scan}
        variant="success"
        size="lg"
        disabled={isScanning}
        onPress={() => setScannerVisible(true)}
        style={styles.scannerButton}
      />

      {/* Products List */}
      <ScrollView style={styles.productsList}>
        {loading && products.length === 0 && (
          <AppLoadingState label="Chargement des produits…" />
        )}

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={setStockModalProduct}
            onLongPress={handleDeleteProduct}
          />
        ))}

        {!loading && products.length === 0 && (
          <AppEmptyState
            icon={Package}
            title="Aucun produit"
            description="Scannez votre premier produit pour commencer la gestion des stocks."
          />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setScannerVisible(true)}
      >
        <Scan size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onDetected={handleBarcodeDetected}
      />

      <StockModal
        product={stockModalProduct}
        visible={stockModalProduct !== null}
        onClose={() => setStockModalProduct(null)}
        onConfirm={handleStockConfirm}
      />

      <AddProductModal
        visible={addModalVisible}
        prefillBarcode={prefillBarcode}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerButtonPrimary: {
    backgroundColor: '#059669',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    color: '#111827',
  },
  scannerButton: {
    margin: 20,
  },
  productsList: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.floating,
  },
});
