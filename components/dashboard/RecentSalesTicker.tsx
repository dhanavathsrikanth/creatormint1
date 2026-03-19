"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";

interface Sale {
  id: string;
  buyer_name: string | null;
  buyer_email: string;
  creator_payout_paise: number;
  created_at: string;
  product_title: string;
}

interface RecentSalesTickerProps {
  creatorId: string;
  initialSales: Sale[];
}

export function RecentSalesTicker({ creatorId, initialSales }: RecentSalesTickerProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [flashId, setFlashId] = useState<string | null>(null);
  const supabase = createClient();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`orders-ticker-${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `creator_id=eq.${creatorId}`,
        },
        async (payload) => {
          const record = payload.new as {
            id: string; payment_status: string; buyer_name: string | null;
            buyer_email: string; creator_payout_paise: number; created_at: string; product_id: string;
          };
          if (record.payment_status !== "paid") return;

          // Fetch product title
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", record.product_id)
            .single<{ title: string }>();

          const newSale: Sale = {
            id: record.id,
            buyer_name: record.buyer_name,
            buyer_email: record.buyer_email,
            creator_payout_paise: record.creator_payout_paise,
            created_at: record.created_at,
            product_title: product?.title ?? "Product",
          };

          setSales((prev) => [newSale, ...prev].slice(0, 10));
          setFlashId(record.id);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlashId(null), 2500);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [creatorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = (name: string | null, email: string) => {
    if (name) return name.split(" ")[0];
    return email.split("@")[0].slice(0, 8);
  };

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <Zap className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sales will appear here instantly after payment</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className={`flex items-center gap-3 px-5 py-3 transition-colors duration-700 ${
            flashId === sale.id ? "bg-amber-50 dark:bg-amber-950/30" : ""
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {firstName(sale.buyer_name, sale.buyer_email)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {firstName(sale.buyer_name, sale.buyer_email)}
              {flashId === sale.id && (
                <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {sale.product_title.slice(0, 30)}{sale.product_title.length > 30 ? "…" : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {formatINR(sale.creator_payout_paise)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
