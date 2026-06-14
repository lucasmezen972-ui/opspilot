import {
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  Package,
  Calendar,
  DollarSign,
  TrendingDown,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import type { Product } from '../../lib/supabase';
import { AppStatusBadge } from '../../shared/components/AppStatusBadge';
import { type StatusLevel, shadow } from '../../shared/styles/tokens';

type StockStatus = 'ok' | 'low_stock' | 'out_of_stock';

export function getStockStatus(product: Product): StockStatus {
  if (product.stock_quantity === 0) return 'out_of_stock';
  if (product.stock_quantity <= (product.min_stock || 5)) return 'low_stock';
  return 'ok';
}

const STATUS_LEVEL: Record<StockStatus, StatusLevel> = {
  ok: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
};

const STATUS_TEXTS: Record<StockStatus, string> = {
  ok: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture',
};

const STATUS_ICONS: Record<StockStatus, typeof Package> = {
  ok: CheckCircle,
  low_stock: AlertTriangle,
  out_of_stock: TrendingDown,
};

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const status = getStockStatus(product);
  const StatusIcon = STATUS_ICONS[status];

  return (
    <TouchableOpacity
      testID={`product-card-${product.id}`}
      style={styles.productCard}
      onPress={() => onPress(product)}
    >
      <Image
        source={{
          uri:
            product.image_url ||
            'https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
        }}
        style={styles.productImage}
      />

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <AppStatusBadge
            level={STATUS_LEVEL[status]}
            label={STATUS_TEXTS[status]}
            icon={StatusIcon}
          />
        </View>

        <Text style={styles.productCategory}>
          {product.category || 'Divers'}
        </Text>
        <Text style={styles.productBarcode}>
          Code: {product.barcode || 'N/A'}
        </Text>

        <View style={styles.productDetails}>
          <View style={styles.productDetailItem}>
            <DollarSign size={14} color="#6B7280" />
            <Text style={styles.productDetailText}>
              {product.price != null ? `${product.price}€` : 'N/A'}
            </Text>
          </View>
          <View style={styles.productDetailItem}>
            <Package size={14} color="#6B7280" />
            <Text
              style={styles.productDetailText}
              testID={`product-stock-${product.id}`}
            >
              Stock: {product.stock_quantity}
            </Text>
          </View>
          <View style={styles.productDetailItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.productDetailText}>
              DLC:{' '}
              {product.dlc ? new Date(product.dlc).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadow.card,
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
});
