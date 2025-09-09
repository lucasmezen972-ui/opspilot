import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Base de données de produits courants avec vrais codes-barres
const PRODUCT_DATABASE: Record<string, any> = {
  '3045320073034': { name: 'Yaourt Nature Danone 4x125g', category: 'Frais', price: 2.85 },
  '3564700456789': { name: 'Pain de Mie Complet Harry\'s', category: 'Boulangerie', price: 1.95 },
  '3274080005003': { name: 'Lait Demi-Écrémé Lactel 1L', category: 'Frais', price: 1.25 },
  '3229820787152': { name: 'Jambon Blanc Herta 6 Tranches', category: 'Charcuterie', price: 3.45 },
  '3560070462235': { name: 'Pommes Golden 1kg', category: 'Fruits & Légumes', price: 2.99 },
  '3033710074617': { name: 'Eau Évian 6x1.5L', category: 'Boissons', price: 4.50 },
  '3274080001095': { name: 'Beurre Doux Président 250g', category: 'Frais', price: 3.20 },
  '8712566301010': { name: 'Coca-Cola 1.5L', category: 'Boissons', price: 2.10 },
  '4006381333115': { name: 'Nutella 400g', category: 'Épicerie', price: 4.99 },
  '3596710364046': { name: 'Chips Lay\'s Nature 150g', category: 'Épicerie', price: 2.65 }
}

export function useProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchProducts()
    }
  }, [profile])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📦 Récupération des produits...')
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          added_by_profile:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erreur récupération produits:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ Produits récupérés:', data?.length || 0)
      setProducts(data || [])
    } catch (error: any) {
      console.error('❌ Erreur inattendue produits:', error)
      setError(error.message || 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  const scanProduct = async (barcode: string) => {
    try {
      console.log('🔍 Scan du code-barres:', barcode)
      
      // D'abord chercher dans la base de données locale
      const { data: existingProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur recherche produit:', error)
        return null
      }

      if (existingProduct) {
        console.log('✅ Produit trouvé dans la base:', existingProduct.name)
        return existingProduct
      }

      // Chercher dans la base de données de référence
      const productInfo = PRODUCT_DATABASE[barcode]
      if (productInfo) {
        console.log('✅ Produit trouvé dans la référence:', productInfo.name)
        return {
          barcode,
          ...productInfo,
          found_in_reference: true,
          stock_quantity: Math.floor(Math.random() * 100) + 10
        }
      }

      console.log('❌ Produit non trouvé pour le code:', barcode)
      return null
    } catch (error: any) {
      console.error('❌ Erreur scan:', error)
      return null
    }
  }

  const createProduct = async (productData: {
    name: string
    barcode?: string
    category?: string
    price?: number
    dlc?: string
    stock_quantity?: number
  }) => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      console.log('🆕 Création produit:', productData.name)
      
      // Générer une DLC par défaut si pas fournie
      const defaultDLC = new Date()
      defaultDLC.setDate(defaultDLC.getDate() + 30) // 30 jours à partir d'aujourd'hui

      const { data, error: createError } = await supabase
        .from('products')
        .insert({
          organization_id: profile.organization_id,
          name: productData.name,
          barcode: productData.barcode,
          dlc: productData.dlc || defaultDLC.toISOString().split('T')[0],
          added_by: profile.id,
          category: productData.category || 'Général',
          price: productData.price || 0,
          stock_quantity: productData.stock_quantity || 50,
          min_stock: 5
        })
        .select(`
          *,
          added_by_profile:profiles(full_name, email)
        `)
        .single()

      if (createError) {
        console.error('❌ Erreur création produit:', createError)
        return { error: createError.message }
      }

      console.log('✅ Produit créé:', data)
      setProducts([data, ...products])
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur inattendue création produit:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const updateProduct = async (productId: string, updates: any) => {
    try {
      const { data, error: updateError } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select(`
          *,
          added_by_profile:profiles!added_by(full_name, email)
        `)
        .single()

      if (updateError) {
        return { error: updateError.message }
      }

      setProducts(products.map(p => p.id === productId ? data : p))
      return { data }
    } catch (error: any) {
      console.error('❌ Erreur mise à jour produit:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const getLowStockProducts = () => {
    return products.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 5))
  }

  const getExpiredProducts = () => {
    const today = new Date().toISOString().split('T')[0]
    return products.filter(p => p.dlc && p.dlc <= today)
  }

  const getExpiringProducts = (days: number = 7) => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    return products.filter(p => p.dlc && p.dlc <= futureDateStr)
  }

  const searchProducts = (query: string) => {
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.includes(query) ||
      p.category?.toLowerCase().includes(query.toLowerCase())
    )
  }

  const getProductsByCategory = (category: string) => {
    return products.filter(p => p.category === category)
  }

  return {
    products,
    loading,
    error,
    scanProduct,
    createProduct,
    updateProduct,
    getLowStockProducts,
    getExpiredProducts,
    getExpiringProducts,
    searchProducts,
    getProductsByCategory,
    refetch: fetchProducts,
  }
}