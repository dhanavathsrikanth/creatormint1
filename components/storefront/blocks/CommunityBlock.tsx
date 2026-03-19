import Link from "next/link";
import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { Users, ArrowRight } from "lucide-react";

interface CommunityBlockProps {
  block: {
    config?: {
      headline?: string;
      showMemberCount?: boolean;
    };
  };
  product: Pick<Product, "id" | "title" | "slug" | "price_paise" | "total_sales">;
  storeSlug: string;
}

export function CommunityBlock({ block, product, storeSlug }: CommunityBlockProps) {
  const headline = block.config?.headline ?? `Join the community: ${product.title}`;
  const showMemberCount = block.config?.showMemberCount !== false;

  return (
    <section className="community-block">
      <div className="community-inner">
        <Users className="community-icon" size={36} />
        <div className="community-content">
          <h2 className="community-headline">{headline}</h2>
          {showMemberCount && (product.total_sales ?? 0) > 0 && (
            <p className="community-members">{product.total_sales} members already inside</p>
          )}
          <div className="community-footer">
            <span className="community-price">
              {product.price_paise === 0 ? "Free" : `${formatINR(product.price_paise)} / mo`}
            </span>
            <Link href={`/${storeSlug}/${product.slug}`} className="btn-primary community-cta">
              Join now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
