import type { Product } from "@/types/database";
import { ProductCard } from "./ProductCard";
import { ShoppingBag } from "lucide-react";

interface ProductGridProps {
  products: Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales" | "file_name">[];
  storeSlug: string;
}

export function ProductGrid({ products, storeSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">No products yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">
        {products.length} product{products.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
        ))}
      </div>
    </section>
  );
}
