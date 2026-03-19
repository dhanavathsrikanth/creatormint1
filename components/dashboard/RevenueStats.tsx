"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Package, IndianRupee } from "lucide-react";
import type { Profile } from "@/types/database";

interface StatsState {
  monthly: number;
  total: number;
  sales: number;
  publishedProducts: number;
}

interface RevenueStatsProps {
  profile: Profile;
  publishedCount: number;
}

export function RevenueStats({ profile, publishedCount }: RevenueStatsProps) {
  const supabase = createClient();
  const [stats, setStats] = useState<StatsState>({
    monthly: profile.monthly_revenue_paise,
    total: profile.total_revenue_paise,
    sales: profile.total_sales,
    publishedProducts: publishedCount,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`profile-stats-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const p = payload.new as Profile;
          setStats({
            monthly: p.monthly_revenue_paise,
            total: p.total_revenue_paise,
            sales: p.total_sales,
            publishedProducts: publishedCount, // products don't change via this channel
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile.id, publishedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    {
      label: "THIS MONTH",
      value: formatINR(stats.monthly),
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: "Revenue earned",
    },
    {
      label: "TOTAL REVENUE",
      value: formatINR(stats.total),
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      sub: "All time",
    },
    {
      label: "TOTAL SALES",
      value: stats.sales.toLocaleString("en-IN"),
      icon: ShoppingCart,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      sub: "Orders completed",
    },
    {
      label: "PRODUCTS LIVE",
      value: stats.publishedProducts.toString(),
      icon: Package,
      color: "text-green-500",
      bg: "bg-green-500/10",
      sub: "Published products",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
