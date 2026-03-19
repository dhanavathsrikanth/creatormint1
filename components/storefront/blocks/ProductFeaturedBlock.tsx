import Link from "next/link";
import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface ProductFeaturedBlockProps {
  block: {
    config?: {
      heading?: string;
      showPrice?: boolean;
      showDescription?: boolean;
    };
  };
  product: Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales">;
  storeSlug: string;
}

export function ProductFeaturedBlock({ block, product, storeSlug }: ProductFeaturedBlockProps) {
  const heading = block.config?.heading;
  const showPrice = block.config?.showPrice !== false;
  const showDescription = block.config?.showDescription !== false;

  return (
    <section className="product-featured-block">
      {heading && <h2 className="block-heading">{heading}</h2>}
      <Link href={`/${storeSlug}/${product.slug}`} className="featured-card">
        <div className="featured-image">
          {product.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.cover_image_url} alt={product.title} />
          ) : (
            <div className="featured-placeholder">
              <ShoppingBag size={48} />
            </div>
          )}
        </div>
        <div className="featured-content">
          <h3 className="featured-title">{product.title}</h3>
          {showDescription && product.summary && (
            <p className="featured-summary">{product.summary}</p>
          )}
          <div className="featured-footer">
            {showPrice && (
              <span className="featured-price">
                {product.price_paise === 0 ? "Free" : formatINR(product.price_paise)}
              </span>
            )}
            <span className="btn-primary featured-cta">
              Get it now <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
