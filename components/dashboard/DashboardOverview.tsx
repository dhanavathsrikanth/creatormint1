"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevenueStats } from "@/components/dashboard/RevenueStats";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentSalesTicker } from "@/components/dashboard/RecentSalesTicker";
import { LaunchReadiness } from "@/components/dashboard/LaunchReadiness";
import { PayoutBanner } from "@/components/dashboard/PayoutBanner";
import { Plus, Eye, ArrowRight } from "lucide-react";
import type { Profile } from "@/types/database";

interface Sale {
  id: string;
  buyer_name: string | null;
  buyer_email: string;
  creator_payout_paise: number;
  created_at: string;
  product_title: string;
}

interface ChartEntry {
  creator_payout_paise: number;
  created_at: string;
}

interface DashboardOverviewProps {
  profile: Profile;
  initialSales: Sale[];
  chartData: ChartEntry[];
  publishedCount: number;
  totalProducts: number;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardOverview({
  profile,
  initialSales,
  chartData,
  publishedCount,
  totalProducts,
}: DashboardOverviewProps) {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      {/* ── Payout banner (dismissible) ── */}
      <PayoutBanner
        upiId={profile.upi_id}
        totalRevenuePaise={profile.total_revenue_paise}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {profile.full_name?.split(" ")[0] ?? "Creator"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profile.store_slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/${profile.store_slug}`} target="_blank" rel="noreferrer">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View store
              </a>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/dashboard/products/new">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New product
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Realtime stat cards ── */}
      <RevenueStats profile={profile} publishedCount={publishedCount} />

      {/* ── Launch readiness ── */}
      <LaunchReadiness
        profile={profile}
        hasPublishedProduct={publishedCount > 0}
      />

      {/* ── Chart + Sales ticker ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Revenue — last 30 days</h2>
            <Link
              href="/dashboard/sales"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View sales <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <RevenueChart rawData={chartData} />
          </div>
        </div>

        {/* Recent sales ticker */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Recent sales</h2>
              {/* Live pulse indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">LIVE</span>
            </div>
            <Link
              href="/dashboard/sales"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              All sales <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <RecentSalesTicker
            creatorId={profile.id}
            initialSales={initialSales}
          />
        </div>
      </div>
    </div>
  );
}
