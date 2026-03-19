import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Order, Product, Profile } from "@/types/database";
import { formatINR, calculateGST, generateInvoiceNumber } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, FileText, Clock, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Download your purchase" };

interface DownloadWithDetails extends Order {
  products: Pick<Product, "title" | "file_name" | "file_size_bytes" | "cover_image_url"> | null;
  creator: Pick<Profile, "store_name" | "full_name"> | null;
}

export default async function DownloadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status } = await searchParams;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, products(title, file_name, file_size_bytes, cover_image_url), creator:profiles!orders_creator_id_fkey(store_name, full_name)")
    .eq("download_token", token)
    .single<DownloadWithDetails>();

  if (!order) notFound();

  const isPending = status === "pending" || order.payment_status === "pending";
  const isFailed = order.payment_status === "failed";
  const isPaid = order.payment_status === "paid";

  const gst = calculateGST(order.amount_paise, 18);
  const invoiceNum = generateInvoiceNumber(
    new Date(order.created_at).getFullYear(),
    new Date(order.created_at).getMonth() + 1,
    1 // seq: implement DB sequence lookup if desired
  );

  const storeName = order.creator?.store_name ?? order.creator?.full_name ?? "Creator";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Status header */}
        {isPaid && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Payment successful!</h1>
            <p className="text-muted-foreground text-sm mt-1">Your download is ready below.</p>
          </div>
        )}
        {isPending && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Payment processing…</h1>
            <p className="text-muted-foreground text-sm mt-1">Please wait. This page will update once confirmed.</p>
          </div>
        )}
        {isFailed && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Payment failed</h1>
            <p className="text-muted-foreground text-sm mt-1">No charge was made. Please try again.</p>
          </div>
        )}

        {/* Product card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          {order.products?.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.products.cover_image_url}
              alt={order.products?.title ?? "Product"}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-5">
            <h2 className="font-semibold text-foreground">{order.products?.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Sold by {storeName}</p>

            {isPaid && (
              <Button className="w-full mt-4" size="lg" asChild>
                <a href={`/api/download/${token}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Download file
                </a>
              </Button>
            )}

            {isPending && (
              <Button className="w-full mt-4" variant="outline" onClick={() => window.location.reload()}>
                <Clock className="w-4 h-4 mr-2" />
                Refresh status
              </Button>
            )}

            {isFailed && (
              <Button className="w-full mt-4" variant="outline" asChild>
                <Link href="/">Try again</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Invoice */}
        {isPaid && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">GST Invoice</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Invoice #</dt>
                <dd className="font-mono text-foreground">{invoiceNum}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Buyer</dt>
                <dd className="text-foreground">{order.buyer_email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </dd>
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base price</span><span>{formatINR(gst.base)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%)</span><span>{formatINR(gst.gst)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground pt-1">
                  <span>Total paid</span><span>{formatINR(gst.total)}</span>
                </div>
              </div>
            </dl>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="hover:text-primary transition-colors">CreatorMint</Link>
          {" "}· Digital products, powered by UPI
        </p>
      </div>
    </div>
  );
}
