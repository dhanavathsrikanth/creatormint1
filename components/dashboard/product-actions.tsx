"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Globe, EyeOff, Loader2, MoreHorizontal, ExternalLink, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductActionsProps {
  productId: string;
  isPublished: boolean;
  productSlug: string;
  storeSlug: string;
}

export function ProductActions({ productId, isPublished, productSlug, storeSlug }: ProductActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const togglePublish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_published: !isPublished })
        .eq("id", productId);
      if (error) throw error;
      toast.success(isPublished ? "Product set to draft" : "Product published!");
      router.refresh();
    } catch {
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={togglePublish}>
          {isPublished ? (
            <><EyeOff className="w-4 h-4 mr-2" />Set to draft</>
          ) : (
            <><Globe className="w-4 h-4 mr-2" />Publish</>
          )}
        </DropdownMenuItem>
        {storeSlug && productSlug && (
          <DropdownMenuItem asChild>
            <a href={`/s/${storeSlug}/${productSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View product page
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={deleteProduct}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
