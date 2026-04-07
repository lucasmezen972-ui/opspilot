import { useState, useCallback, useEffect } from 'react';
import { supabase, isDemoMode, type Product } from '../lib/supabase';
import { useAuth } from './useAuth';
import { mapSupabaseError } from '../utils/error';

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-prod-1',
    organization_id: 'demo-org-001',
    name: 'Lait Demi-Écrémé 1L',
    barcode: '1234567890123',
    category: 'Produits laitiers',
    price: 1.15,
    stock_quantity: 48,
    min_stock: 20,
    dlc: new Date(Date.now() + 5 * 86400000).toISOString(),
    image_url: null,
    added_by: 'demo-user-001',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
  },
  {
    id: 'demo-prod-2',
    organization_id: 'demo-org-001',
    name: 'Pain de Mie Complet',
    barcode: '2345678901234',
    category: 'Boulangerie',
    price: 2.30,
    stock_quantity: 5,
    min_stock: 10,
    dlc: new Date(Date.now() + 3 * 86400000).toISOString(),
    image_url: null,
    added_by: 'demo-user-001',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
  },
  {
    id: 'demo-prod-3',
    organization_id: 'demo-org-001',
    name: 'Eau Minérale 6x1.5L',
    barcode: '3456789012345',
    category: 'Boissons',
    price: 3.50,
    stock_quantity: 0,
    min_stock: 15,
    dlc: null,
    image_url: null,
    added_by: 'demo-user-001',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
  },
  {
    id: 'demo-prod-4',
    organization_id: 'demo-org-001',
    name: 'Poulet Fermier Label Rouge',
    barcode: '4567890123456',
    category: 'Boucherie',
    price: 8.99,
    stock_quantity: 12,
    min_stock: 5,
    dlc: new Date(Date.now() + 2 * 86400000).toISOString(),
    image_url: null,
    added_by: 'demo-user-001',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
  },
  {
    id: 'demo-prod-5',
    organization_id: 'demo-org-001',
    name: 'Salade Iceberg',
    barcode: '5678901234567',
    category: 'Fruits & Légumes',
    price: 1.49,
    stock_quantity: 22,
    min_stock: 10,
    dlc: new Date(Date.now() + 4 * 86400000).toISOString(),
    image_url: null,
    added_by: 'demo-user-001',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
  },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(isDemoMode ? DEMO_PRODUCTS : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const { profile } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true })
        .limit(100);

      if (error) {
        mapSupabaseError('Erreur lors de la récupération des produits', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchProducts', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const scanProduct = async (barcode: string): Promise<Product | null> => {
    if (isDemoMode) {
      return products.find((p) => p.barcode === barcode) ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const fetchProduct = async (barcode: string) => {
    const product = await scanProduct(barcode);
    return { data: product, error: null };
  };

  const updateProductStock = async (id: string, newStock: number) => {
    if (isDemoMode) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() } : p)),
      );
      return { data: { id, stock_quantity: newStock }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur mise à jour stock', error) };
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur updateProductStock', error) };
    }
  };

  return {
    products,
    loading,
    fetchProduct,
    scanProduct,
    updateProductStock,
    refetch: fetchProducts,
  };
}
