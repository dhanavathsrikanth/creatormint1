import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ProductListClient } from "@/components/dashboard/product-list-client";

export const metadata: Metadata = { title: "Products — CreatorMint" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) redirect("/auth/login");

  const { data: products = [] } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Product[]>();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {(products ?? []).length} product{(products ?? []).length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New product
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-3 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="w-12 shrink-0">Cover</span>
            <span className="flex-1">Product</span>
            <span className="w-20 text-right shrink-0">Price</span>
            <span className="w-16 text-center shrink-0">Sales</span>
            <span className="w-20 text-center shrink-0">Status</span>
            <span className="w-36 text-right shrink-0">Actions</span>
          </div>
        </div>
        <div className="p-3">
          <ProductListClient products={products ?? []} />
        </div>
      </div>
    </div>
  );
}
