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
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return { label: "Video", icon: Film, color: "bg-purple-100 text-purple-700" };
  if (["zip", "tar", "gz", "rar"].includes(ext)) return { label: "Bundle", icon: Archive, color: "bg-amber-100 text-amber-700" };
  if (ext === "pdf") return { label: "PDF", icon: FileText, color: "bg-red-100 text-red-700" };
  return { label: ext.toUpperCase(), icon: FileText, color: "bg-blue-100 text-blue-700" };
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const badge = getTypeBadge(product.file_name);

  return (
    <Link
      href={`/${storeSlug}/${product.slug}`}
      className="group bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Thumbnail 16:9 */}
      <div className="relative aspect-video bg-gray-50 overflow-hidden">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* Type badge */}
        {badge && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            <badge.icon className="w-3 h-3" />
            {badge.label}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
          {product.title}
        </h3>
        {product.summary && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {product.summary}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-lg font-bold text-gray-900">{formatINR(product.price_paise)}</span>
          {product.total_sales > 0 && (
            <span className="text-xs text-gray-400">{product.total_sales} sold</span>
          )}
        </div>
      </div>
    </Link>
  );
}
