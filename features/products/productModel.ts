import type { Product } from '../../lib/supabase';

/** Filtre les produits par nom, code-barres ou catégorie. */
export function filterProducts(products: Product[], query: string): Product[] {
  if (!query) return products;
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode ?? '').includes(q) ||
      (p.category ?? '').toLowerCase().includes(q),
  );
}

export interface StockCounts {
  ok: number;
  low: number;
  out: number;
}

/** Répartition des produits par niveau de stock (ok / faible / rupture). */
export function getStockCounts(products: Product[]): StockCounts {
  return {
    ok: products.filter((p) => p.stock_quantity > 10).length,
    low: products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10)
      .length,
    out: products.filter((p) => p.stock_quantity === 0).length,
  };
}
