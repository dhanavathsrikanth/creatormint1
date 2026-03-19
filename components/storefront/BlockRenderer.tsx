import type { Profile, Product } from "@/types/database";
import { HeroBlock } from "./blocks/HeroBlock";
import { ProductFeaturedBlock } from "./blocks/ProductFeaturedBlock";
import { ProductGridBlock } from "./blocks/ProductGridBlock";
import { AboutBlock } from "./blocks/AboutBlock";
import { LeadMagnetBlock } from "./blocks/LeadMagnetBlock";
import { BookingBlock } from "./blocks/BookingBlock";
import { CommunityBlock } from "./blocks/CommunityBlock";
import { TestimonialsBlock } from "./blocks/TestimonialsBlock";
import { CustomLinkBlock } from "./blocks/CustomLinkBlock";

interface StoreBlock {
  id: string;
  block_type: string;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

interface BlockRendererProps {
  block: StoreBlock;
  profile: Profile;
  products: Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales" | "product_type">[];
  storeSlug: string;
}

export function BlockRenderer({ block, profile, products, storeSlug }: BlockRendererProps) {
  const cfg = block.config ?? {};

  switch (block.block_type) {
    case "hero":
      return <HeroBlock block={block} profile={profile} />;

    case "product_featured": {
      const product = products.find((p) => p.id === cfg.productId);
      if (!product) return null;
      return <ProductFeaturedBlock block={block} product={product} storeSlug={storeSlug} />;
    }

    case "product_grid":
      return <ProductGridBlock block={block} products={products} storeSlug={storeSlug} />;

    case "about":
      if (!cfg.content) return null;
      return <AboutBlock block={block} profile={profile} />;

    case "lead_magnet": {
      const freeProduct = products.find(
        (p) => p.id === cfg.productId && p.price_paise === 0
      );
      if (!freeProduct) return null;
      return <LeadMagnetBlock block={block} product={freeProduct} />;
    }

    case "booking": {
      const bookingProduct = products.find(
        (p) => p.id === cfg.productId && p.product_type === "booking"
      );
      if (!bookingProduct) return null;
      return <BookingBlock block={block} product={bookingProduct} storeSlug={storeSlug} />;
    }

    case "community": {
      const communityProduct = products.find(
        (p) => p.id === cfg.productId && p.product_type === "community"
      );
      if (!communityProduct) return null;
      return <CommunityBlock block={block} product={communityProduct} storeSlug={storeSlug} />;
    }

    case "testimonials":
      if (!(cfg.testimonials as unknown[])?.length) return null;
      return <TestimonialsBlock block={block} />;

    case "custom_link":
      if (!cfg.url || !cfg.label) return null;
      return <CustomLinkBlock block={block} />;

    default:
      return null;
  }
}
