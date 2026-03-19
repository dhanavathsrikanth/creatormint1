import Link from "next/link";
import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";

interface BookingBlockProps {
  block: {
    config?: {
      headline?: string;
      subheading?: string;
    };
  };
  product: Pick<Product, "id" | "title" | "slug" | "price_paise" | "cover_image_url">;
  storeSlug: string;
}

export function BookingBlock({ block, product, storeSlug }: BookingBlockProps) {
  const headline = block.config?.headline ?? `Book a session: ${product.title}`;
  const subheading = block.config?.subheading ?? "Limited slots available.";

  return (
    <section className="booking-block">
      <div className="booking-inner">
        <Calendar className="booking-icon" size={36} />
        <div className="booking-content">
          <h2 className="booking-headline">{headline}</h2>
          <p className="booking-sub">{subheading}</p>
          <div className="booking-footer">
            <span className="booking-price">{formatINR(product.price_paise)}</span>
            <Link href={`/${storeSlug}/${product.slug}`} className="btn-primary booking-cta">
              Book now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
