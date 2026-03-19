import Link from "next/link";
import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

interface ProductGridBlockProps {
  block: {
    config?: {
      columns?: 2 | 3;
      heading?: string;
      showSales?: boolean;
    };
  };
  products: Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales">[];
  storeSlug: string;
}

export function ProductGridBlock({ block, products, storeSlug }: ProductGridBlockProps) {
  const columns = block.config?.columns ?? 3;
  const heading = block.config?.heading;
  const showSales = block.config?.showSales !== false;

  if (products.length === 0) return null;

  return (
    <section className="product-grid-block">
      {heading && <h2 className="block-heading">{heading}</h2>}
      <div className={`product-grid grid-cols-${columns}`}>
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${storeSlug}/${product.slug}`}
            className="product-card"
          >
            <div className="product-card-image">
              {product.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.cover_image_url} alt={product.title} />
              ) : (
                <div className="product-card-placeholder">
                  <ShoppingBag size={32} />
                </div>
              )}
            </div>
            <div className="product-card-body">
              <h3 className="product-card-title">{product.title}</h3>
              {product.summary && (
                <p className="product-card-summary">{product.summary}</p>
              )}
              <div className="product-card-footer">
                <span className="product-card-price">
                  {product.price_paise === 0 ? "Free" : formatINR(product.price_paise)}
                </span>
                {showSales && (product.total_sales ?? 0) > 10 && (
                  <span className="product-card-sales">{product.total_sales} sales</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
