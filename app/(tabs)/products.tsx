import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Scan, Search, Filter, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Package, Calendar, DollarSign, TrendingDown, TrendingUp } from 'lucide-react-native';

const products = [
  {
    id: 1,
    name: 'Yaourt Nature Bio',
    barcode: '3456789012345',
    price: 2.49,
    stock: 45,
    status: 'ok',
    expiry: '2024-01-25',
    image: 'https://images.pexels.com/photos/1060180/pexels-photo-1060180.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    category: 'Produits laitiers',
  },
  {
    id: 2,
    name: 'Pain de mie complet',
    barcode: '2345678901234',
    price: 1.89,
    stock: 12,
    status: 'low_stock',
    expiry: '2024-01-18',
    image: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    category: 'Boulangerie',
  },
  {
    id: 3,
    name: 'Pommes Golden',
    barcode: '1234567890123',
    price: 3.20,
    stock: 0,
    status: 'out_of_stock',
    expiry: '2024-01-20',
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    category: 'Fruits & Légumes',
  },
];

export default function ProductsScreen() {
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
          <Text style={styles.quickStatNumber}>847</Text>
          <Text style={styles.quickStatLabel}>En stock</Text>
        </View>
        <View style={styles.quickStatItem}>
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={styles.quickStatNumber}>23</Text>
          <Text style={styles.quickStatLabel}>Stock faible</Text>
        </View>
        <View style={styles.quickStatItem}>
          <TrendingDown size={20} color="#EF4444" />
          <Text style={styles.quickStatNumber}>8</Text>
          <Text style={styles.quickStatLabel}>Ruptures</Text>
        </View>
      </View>

      {/* Scanner Button */}
      <TouchableOpacity style={styles.scannerButton}>
        <Scan size={24} color="#FFFFFF" />
        <Text style={styles.scannerButtonText}>Scanner un produit</Text>
      </TouchableOpacity>

      {/* Products List */}
      <ScrollView style={styles.productsList}>
        {products.map((product) => {
          const StatusIcon = getStatusIcon(product.status);
          return (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={[styles.productStatus, { backgroundColor: `${getStatusColor(product.status)}20` }]}>
                    <StatusIcon size={12} color={getStatusColor(product.status)} />
                    <Text style={[styles.productStatusText, { color: getStatusColor(product.status) }]}>
                      {getStatusText(product.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productBarcode}>Code: {product.barcode}</Text>

                <View style={styles.productDetails}>
                  <View style={styles.productDetailItem}>
                    <DollarSign size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>{product.price}€</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Package size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>Stock: {product.stock}</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.productDetailText}>DLC: {product.expiry}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    bottom: 90, // Ajuster pour éviter le chevauchement avec la barre d'onglets
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