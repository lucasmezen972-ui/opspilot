import {
  Plus,
  Scan,
  Search,
  TriangleAlert as AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
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
import { StockModal } from '../../features/products/StockModal';
import { AppEmptyState } from '../../shared/components/AppEmptyState';
import { AppLoadingState } from '../../shared/components/AppLoadingState';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../lib/supabase';

export default function ProductsScreen() {
  const {
    products: allProducts,
    loading,
    scanProduct,
    createProduct,
    updateProductStock,
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

  const handleStockConfirm = async (product: Product, newStock: number) => {
    const { error } = await updateProductStock(product.id, newStock);
    setStockModalProduct(null);
    if (error) {
      Alert.alert('Erreur', String(error));
    }
  };

  const products = allProducts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode ?? '').includes(q) ||
      (p.category ?? '').toLowerCase().includes(q)
    );
  });

  // Statistiques calculées en temps réel
  const okProducts = products.filter((p) => p.stock_quantity > 10).length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= 10,
  ).length;
  const outOfStockProducts = products.filter(
    (p) => p.stock_quantity === 0,
  ).length;

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} testID="page-products-title">
          Produits
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={showSearch ? '#059669' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="product-add-button"
            style={[styles.headerButton, styles.headerButtonPrimary]}
            onPress={() => openAddModal()}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <TrendingUp size={20} color="#10B981" />
          <Text style={styles.quickStatNumber} testID="products-count-ok">
            {okProducts}
          </Text>
          <Text style={styles.quickStatLabel}>En stock</Text>
        </View>
        <View style={styles.quickStatItem}>
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={styles.quickStatNumber} testID="products-count-low">
            {lowStockProducts}
          </Text>
          <Text style={styles.quickStatLabel}>Stock faible</Text>
        </View>
        <View style={styles.quickStatItem}>
          <TrendingDown size={20} color="#EF4444" />
          <Text style={styles.quickStatNumber} testID="products-count-out">
            {outOfStockProducts}
          </Text>
          <Text style={styles.quickStatLabel}>Ruptures</Text>
        </View>
      </View>

      {/* Scanner Button */}
      <TouchableOpacity
        testID="product-scan-button"
        style={[
          styles.scannerButton,
          isScanning && styles.scannerButtonDisabled,
        ]}
        onPress={() => setScannerVisible(true)}
        disabled={isScanning}
      >
        <Scan size={24} color="#FFFFFF" />
        <Text style={styles.scannerButtonText}>
          {isScanning ? 'Scan en cours...' : 'Scanner un produit'}
        </Text>
      </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  quickStats: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scannerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scannerButtonDisabled: {
    opacity: 0.7,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
