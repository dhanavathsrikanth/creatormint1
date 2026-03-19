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
      <div className="text-center py-24 bg-gray-50/50">
        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500">Check back soon for new digital products.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFDFD] min-h-[50vh]">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 
            className="text-3xl font-black text-gray-900 tracking-tight" 
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            Digital Collection
          </h2>
          <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
            {products.length} items
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
          ))}
        </div>
      </section>
    </div>
  );
}
