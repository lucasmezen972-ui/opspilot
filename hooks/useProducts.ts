import { useEffect, useState } from 'react'
import { supabase, type Product } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchProducts()
    }
  }, [profile])

  const fetchProducts = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (error) {
        console.error('Erreur lors de la récupération des produits:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const scanProduct = async (barcode: string) => {
    if (!profile?.organization_id) return null

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('barcode', barcode)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du scan:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur:', error)
      return null
    }
  }

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la mise à jour du stock:', error)
        return { error }
      }

      // Mettre à jour la liste locale
      setProducts(products.map(p => p.id === productId ? data : p))

      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const createProduct = async (productData: Partial<Product>) => {
    if (!profile?.organization_id) return { error: 'Organisation non définie' }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          organization_id: profile.organization_id,
          added_by: profile.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la création du produit:', error)
        return { error }
      }

      setProducts([...products, data])
      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const getProductStatus = (product: Product) => {
    if (product.stock_quantity === 0) return 'out_of_stock'
    if (
      product.min_stock !== null &&
      product.min_stock !== undefined &&
      product.stock_quantity <= product.min_stock
    )
      return 'low_stock'
    return 'ok'
  }

  return {
    products,
    loading,
    scanProduct,
    updateProductStock,
    createProduct,
    getProductStatus,
    refetch: fetchProducts,
  }
}