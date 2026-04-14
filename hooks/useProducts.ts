import { useCallback, useEffect, useState } from 'react';
import { supabase, type Product } from '../lib/supabase';
import { useAuth } from './useAuth';
import { mapSupabaseError } from '../utils/error';

export function useProducts() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
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
        .limit(500);

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

  const fetchProduct = async (barcode: string) => {
    if (!profile?.organization_id) {
      return { data: null, error: 'Organisation non configurée' };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('barcode', barcode)
        .maybeSingle();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur fetchProduct', error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur fetchProduct', error) };
    }
  };

  const scanProduct = async (barcode: string) => {
    const { data } = await fetchProduct(barcode);
    return data;
  };

  const updateProductStock = async (id: string, newStock: number) => {
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
        return { data: null, error: mapSupabaseError('Erreur updateProductStock', error) };
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur updateProductStock', error) };
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          organization_id: profile.organization_id,
          added_by: user.id,
          name: productData.name || 'Nouveau produit',
          barcode: productData.barcode ?? null,
          category: productData.category ?? null,
          price: productData.price ?? null,
          stock_quantity: productData.stock_quantity ?? 0,
          min_stock: productData.min_stock ?? 5,
          dlc: productData.dlc ?? null,
          image_url: productData.image_url ?? null,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur createProduct', error) };
      }

      setProducts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur createProduct', error) };
    }
  };

  return {
    products,
    loading,
    fetchProduct,
    scanProduct,
    updateProductStock,
    createProduct,
    refetch: fetchProducts,
  };
}
