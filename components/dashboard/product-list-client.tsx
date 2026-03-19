"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Globe, Lock, Trash2, Package, Loader2, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import type { Product } from "@/types/database";

interface ProductListClientProps {
  products: Product[];
}

function getFileTypeBadge(fileName: string | null) {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { label: string; color: string }> = {
    pdf:  { label: "PDF",   color: "bg-red-100 text-red-700" },
    zip:  { label: "ZIP",   color: "bg-yellow-100 text-yellow-700" },
    epub: { label: "ePUB",  color: "bg-blue-100 text-blue-700" },
    mp4:  { label: "Video", color: "bg-purple-100 text-purple-700" },
    mp3:  { label: "Audio", color: "bg-pink-100 text-pink-700" },
  };
  const badge = map[ext];
  if (!badge) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{ext.toUpperCase()}</span>;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.color}`}>{badge.label}</span>;
}

export function ProductListClient({ products: initial }: ProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const togglePublish = async (product: Product) => {
    if (togglingId) return;
    const next = !product.is_published;
    setTogglingId(product.id);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_published: next } : p)));
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(next ? "Product is now live ✓" : "Moved to drafts");
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_published: !next } : p)));
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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
        <div key={product.id}>
          {/* Product Row */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
              confirmDeleteId === product.id
                ? "border-destructive/40 bg-destructive/5"
                : !product.is_published
                ? "border-transparent bg-muted/20 opacity-75 hover:opacity-100 hover:border-border hover:bg-muted/30"
                : "border-transparent hover:border-border hover:bg-muted/30"
            }`}
          >
            {/* Cover — w-12 matches header */}
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
              {product.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product — flex-1 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{product.title}</p>
                {getFileTypeBadge(product.file_name)}
                {!product.is_published && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">DRAFT</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{product.slug}</p>
            </div>

            {/* Price — w-20 text-right */}
            <div className="w-20 text-right shrink-0">
              <span className="text-sm font-semibold text-foreground">
                {product.price_paise === 0 ? "Free" : formatINR(product.price_paise)}
              </span>
            </div>

            {/* Sales — w-16 text-center */}
            <div className="w-16 text-center shrink-0">
              <span className="text-sm font-semibold text-foreground">{product.total_sales ?? 0}</span>
            </div>

            {/* Status — w-20 text-center */}
            <div className="w-20 flex justify-center shrink-0">
              <button
                type="button"
                onClick={() => togglePublish(product)}
                disabled={!!togglingId}
                title={product.is_published ? "Click to unpublish" : "Click to publish"}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  product.is_published
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
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
            </div>

            {/* Actions — w-36 text-right */}
            <div className="w-36 flex items-center justify-end gap-1 shrink-0">
              {/* Quick Publish button for drafts */}
              {!product.is_published && (
                <button
                  onClick={() => togglePublish(product)}
                  disabled={!!togglingId}
                  title="Publish this product"
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Publish
                </button>
              )}

              {/* Edit */}
              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>
              </Button>

              {/* Delete — two-step */}
              {confirmDeleteId !== product.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDeleteId(product.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              ) : deletingId === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-destructive mx-1" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Inline Delete Confirmation banner */}
          {confirmDeleteId === product.id && (
            <div className="mx-3 mb-1 -mt-0.5 flex items-center justify-between px-4 py-2.5 rounded-b-xl bg-destructive/10 border border-t-0 border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs font-medium text-destructive">
                  Delete <span className="font-bold">&ldquo;{product.title}&rdquo;</span>? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => handleDelete(product.id)}
                  disabled={!!deletingId}
                >
                  {deletingId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, delete"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
