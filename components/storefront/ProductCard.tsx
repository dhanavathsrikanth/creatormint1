import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Package, FileText, Film, Archive } from "lucide-react";

interface ProductCardProps {
  product: Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales" | "file_name">;
  storeSlug: string;
}

function getTypeBadge(fileName: string | null) {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return { label: "Video", icon: Film, color: "bg-purple-500/90 text-white backdrop-blur-md" };
  }
  if (["zip", "tar", "gz", "rar"].includes(ext)) {
    return { label: "Bundle", icon: Archive, color: "bg-emerald-500/90 text-white backdrop-blur-md" };
  }
  if (ext === "pdf") {
    return { label: "PDF", icon: FileText, color: "bg-rose-500/90 text-white backdrop-blur-md" };
  }
  return { label: ext.toUpperCase(), icon: FileText, color: "bg-gray-900/90 text-white backdrop-blur-md" };
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const badge = getTypeBadge(product.file_name);

  return (
    <Link
      href={`/${storeSlug}/${product.slug}`}
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-100/50"
    >
      {/* Thumbnail 16:9 */}
      <div className="relative aspect-video bg-gray-50 overflow-hidden">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <Package className="w-12 h-12 text-indigo-200" />
          </div>
        )}
        
        {/* Type badge */}
        {badge && (
          <div className={`absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm ${badge.color}`}>
            <badge.icon className="w-3.5 h-3.5" />
            {badge.label}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>
        {product.summary && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {product.summary}
          </p>
        )}
        
        <div className="flex flex-col mt-auto pt-6 border-t border-gray-50 mt-6 box-content">
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-gray-900 tracking-tight">
              {product.price_paise === 0 ? "Free" : formatINR(product.price_paise)}
            </span>
            {product.total_sales > 0 && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1.5 rounded-full border border-gray-200">
                {product.total_sales} sold
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
