import { describe, it, expect } from 'vitest';

import {
  filterProducts,
  getStockCounts,
} from '../../features/products/productModel';
import type { Product } from '../../lib/supabase';

function product(p: Partial<Product>): Product {
  return {
    id: 'p',
    organization_id: 'org',
    name: 'Produit',
    stock_quantity: 5,
    created_at: '',
    updated_at: '',
    ...p,
  };
}

describe('filterProducts', () => {
  const list = [
    product({ id: '1', name: 'Lait', barcode: '123', category: 'Frais' }),
    product({ id: '2', name: 'Pain', barcode: '456', category: 'Boulangerie' }),
  ];

  it('renvoie tout sans requête', () => {
    expect(filterProducts(list, '')).toHaveLength(2);
  });

  it('filtre par nom, code-barres ou catégorie', () => {
    expect(filterProducts(list, 'lait').map((p) => p.id)).toEqual(['1']);
    expect(filterProducts(list, '456').map((p) => p.id)).toEqual(['2']);
    expect(filterProducts(list, 'frais').map((p) => p.id)).toEqual(['1']);
  });
});

describe('getStockCounts', () => {
  it('répartit par niveau de stock', () => {
    const counts = getStockCounts([
      product({ stock_quantity: 20 }),
      product({ stock_quantity: 5 }),
      product({ stock_quantity: 0 }),
      product({ stock_quantity: 10 }),
    ]);
    expect(counts).toEqual({ ok: 1, low: 2, out: 1 });
  });
});
