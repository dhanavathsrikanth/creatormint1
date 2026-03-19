"use client";

import { useState, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Globe, Lock, Trash2, Package, Loader2 } from "lucide-react";
import type { Product } from "@/types/database";

interface ProductListClientProps {
  products: Product[];
}

function getFileTypeBadge(fileName: string | null) {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { label: string; color: string }> = {
    pdf: { label: "PDF", color: "bg-red-100 text-red-700" },
    zip: { label: "ZIP", color: "bg-yellow-100 text-yellow-700" },
    epub: { label: "ePUB", color: "bg-blue-100 text-blue-700" },
    mp4: { label: "Video", color: "bg-purple-100 text-purple-700" },
    mp3: { label: "Audio", color: "bg-pink-100 text-pink-700" },
  };
  const badge = map[ext];
  if (!badge) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{ext.toUpperCase()}</span>;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.color}`}>{badge.label}</span>;
}

export function ProductListClient({ products: initial }: ProductListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<Product[]>(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const togglePublish = async (product: Product) => {
    if (togglingId) return;
    const next = !product.is_published;
    setTogglingId(product.id);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_published: next } : p))
    );

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(next ? "Published ✓" : "Moved to drafts");
    } catch {
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: !next } : p))
      );
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">No products yet</p>
        <Button asChild size="sm">
          <Link href="/dashboard/products/new">Create your first product</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
        >
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
            {product.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.cover_image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{product.title}</p>
              {getFileTypeBadge(product.file_name)}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {product.price_paise === 0 ? "Free" : formatINR(product.price_paise)}
              </span>
              <span>·</span>
              <span>{product.total_sales ?? 0} sales</span>
              {product.price_paise > 0 && (
                <>
                  <span>·</span>
                  <span>{formatINR((product.total_sales ?? 0) * product.price_paise)} revenue</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Publish toggle */}
            <button
              type="button"
              onClick={() => togglePublish(product)}
              disabled={togglingId === product.id}
              title={product.is_published ? "Click to unpublish" : "Click to publish"}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full transition-colors ${
                product.is_published
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {togglingId === product.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : product.is_published ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {product.is_published ? "Live" : "Draft"}
            </button>

            {/* Edit */}
            <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(product)}
              disabled={deletingId === product.id}
            >
              {deletingId === product.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
