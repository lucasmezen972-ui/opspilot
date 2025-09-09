import { useState } from 'react';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async (_barcode: string) => ({ data: null, error: null });
  const refetch = async () => {};

  return { products, loading, fetchProduct, refetch };
}
