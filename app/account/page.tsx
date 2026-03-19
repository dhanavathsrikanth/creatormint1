import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Order, Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Package, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account | CreatorMint" };

interface OrderWithProduct extends Order {
  products: Pick<Product, "title" | "cover_image_url" | "slug"> | null;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/auth/login");

  // Redirect to the correct dashboard based on role
  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "buyer") redirect("/buyer");
  if (profile.role === "creator" && profile.onboarding_complete) {
    redirect("/dashboard");
  }

  const { data: orders = [] } = await supabase
    .from("orders")
    .select("*, products(title, cover_image_url, slug)")
    .eq("buyer_email", profile.email ?? "")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .returns<OrderWithProduct[]>();

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-6 bg-card">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">CM</span>
            CreatorMint
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {(profile.full_name ?? profile.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name ?? "My Account"}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>

        {/* Purchase history */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            My purchases
          </h2>

          {(orders ?? []).length === 0 ? (
            <div className="bg-card border border-border rounded-2xl py-16 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No purchases yet</p>
              <p className="text-muted-foreground text-sm mt-1">Products you buy will appear here.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {(orders ?? []).map((o) => (
                <div key={o.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Cover */}
                  {o.products?.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.products.cover_image_url}
                      alt={o.products?.title ?? "Product"}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.products?.title ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{formatINR(o.amount_paise)}
                    </p>
                  </div>

                  {/* Download */}
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/api/download/${o.download_token}`}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
