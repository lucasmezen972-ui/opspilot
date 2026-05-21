import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { DEMO_PRODUCTS } from '../lib/demo';
import { supabase, type Product } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isDemo } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (isDemo) {
      setProducts(DEMO_PRODUCTS);
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
        .order('name', { ascending: true });

      if (error) {
        mapSupabaseError('Erreur lors de la recuperation des produits', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchProducts', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isDemo]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchProduct = async (barcode: string) => {
    const local = products.find((p) => p.barcode === barcode);
    if (local) return { data: local, error: null };

    if (isDemo) return { data: null, error: null };

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur fetchProduct', error),
        };
      }
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur fetchProduct', error),
      };
    }
  };

  const scanProduct = async (barcode: string) => {
    const { data } = await fetchProduct(barcode);
    return data;
  };

  const updateProductStock = async (id: string, newStock: number) => {
    if (isDemo) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() }
            : p,
        ),
      );
      return { data: true, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur mise a jour stock', error),
        };
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateProductStock', error),
      };
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
