import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  barcode: string;
  stock_quantity: number;
  price?: number;
  image_url?: string;
  category?: string;
  min_stock?: number;
  dlc?: string;
};

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Produit A',
    barcode: '1234567890123',
    stock_quantity: 25,
    price: 2.99,
    category: 'Divers',
  },
  {
    id: '2',
    name: 'Produit B',
    barcode: '2345678901234',
    stock_quantity: 5,
    price: 4.99,
    category: 'Divers',
  },
  {
    id: '3',
    name: 'Produit C',
    barcode: '3456789012345',
    stock_quantity: 0,
    price: 1.5,
    category: 'Divers',
  },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading] = useState(false);

  const fetchProduct = async (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode) ?? null;
    return { data: product, error: null };
  };

  const scanProduct = async (barcode: string) => {
    const { data } = await fetchProduct(barcode);
    return data;
  };

  const updateProductStock = async (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: newStock } : p)),
    );
    return { data: { id, stock_quantity: newStock }, error: null };
  };

  const refetch = async () => {};

  return {
    products,
    loading,
    fetchProduct,
    scanProduct,
    updateProductStock,
    refetch,
  };
}
