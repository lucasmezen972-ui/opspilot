import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Scan, Search, Filter, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Package, Calendar, DollarSign, TrendingDown, TrendingUp, Plus } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';

export default function ProductsScreen() {
  const { products, loading, scanProduct, updateProductStock } = useProducts();
  const [isScanning, setIsScanning] = useState(false);

  // Statistiques calculées en temps réel
  const okProducts = products.filter(p => p.stock_quantity > 10).length;
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return '#10B981';
      case 'low_stock': return '#F59E0B';
      case 'out_of_stock': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return CheckCircle;
      case 'low_stock': return AlertTriangle;
      case 'out_of_stock': return TrendingDown;
      default: return Package;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'En stock';
      case 'low_stock': return 'Stock faible';
      case 'out_of_stock': return 'Rupture';
      default: return 'Inconnu';
    }
  };

  const simulateBarcodeScan = async () => {
    setIsScanning(true);
    
    // Simulation d'un scan de code-barres
    setTimeout(async () => {
      const testBarcodes = ['3456789012345', '2345678901234', '1234567890123'];
      const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)]!;

      const scannedProduct = await scanProduct(randomBarcode);
      
      if (scannedProduct) {
        Alert.alert(
          'Produit scanné',
          `${scannedProduct.name}\nStock: ${scannedProduct.stock_quantity}\nPrix: ${scannedProduct.price}€`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Modifier stock', 
              onPress: () => promptStockUpdate(scannedProduct) 
            }
          ]
        );
      } else {
        Alert.alert(
          'Produit non trouvé', 
          `Le code-barres ${randomBarcode} n'existe pas dans la base de données.`,
          [
            { text: 'OK', style: 'default' },
            { text: 'Ajouter produit', onPress: () => Alert.alert('Info', 'Fonctionnalité d\'ajout de produit à venir') }
          ]
        );
      }
      
      setIsScanning(false);
    }, 1500);
  };

  const promptStockUpdate = (product: any) => {
    Alert.prompt(
      'Modifier le stock',
      `Stock actuel: ${product.stock_quantity}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Valider', 
          onPress: (text) => {
            const newStock = parseInt(text || '0');
            if (!isNaN(newStock) && newStock >= 0) {
              updateProductStock(product.id, newStock);
            }
          }
        }
      ],
      'plain-text',
      product.stock_quantity.toString()
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Produits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <TrendingUp size={20} color="#10B981" />
          <Text style={styles.quickStatNumber}>{okProducts}</Text>
          <Text style={styles.quickStatLabel}>En stock</Text>
        </View>
        <View style={styles.quickStatItem}>
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={styles.quickStatNumber}>{lowStockProducts}</Text>
          <Text style={styles.quickStatLabel}>Stock faible</Text>
        </View>
        <View style={styles.quickStatItem}>
          <TrendingDown size={20} color="#EF4444" />
          <Text style={styles.quickStatNumber}>{outOfStockProducts}</Text>
          <Text style={styles.quickStatLabel}>Ruptures</Text>
        </View>
      </View>

      {/* Scanner Button */}
      <TouchableOpacity 
        style={[styles.scannerButton, isScanning && styles.scannerButtonDisabled]}
        onPress={simulateBarcodeScan}
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
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        )}
        
        {products.map((product) => {
          // Calculer le statut en temps réel
          const status = product.stock_quantity === 0 ? 'out_of_stock' : 
                       product.stock_quantity <= (product.min_stock || 5) ? 'low_stock' : 'ok';
          const StatusIcon = getStatusIcon(status);
          
          return (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productCard}
              onPress={() => promptStockUpdate(product)}
            >
              <Image source={{ uri: product.image_url || 'https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2' }} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={[styles.productStatus, { backgroundColor: `${getStatusColor(status)}20` }]}>
                    <StatusIcon size={12} color={getStatusColor(status)} />
                    <Text style={[styles.productStatusText, { color: getStatusColor(status) }]}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productCategory}>{product.category || 'Divers'}</Text>
                <Text style={styles.productBarcode}>Code: {product.barcode}</Text>

                <View style={styles.productDetails}>
                  <View style={styles.productDetailItem}>
                    <DollarSign size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>{product.price}€</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Package size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>Stock: {product.stock_quantity}</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>
                      DLC: {product.dlc ? new Date(product.dlc).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        
        {!loading && products.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>Aucun produit</Text>
            <Text style={styles.emptyStateText}>
              Scannez votre premier produit pour commencer la gestion des stocks.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Scan size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  productStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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