"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { formatINR } from "@/lib/utils";

interface RawEntry {
  creator_payout_paise: number;
  created_at: string;
}

interface RevenueChartProps {
  rawData: RawEntry[];
}

interface DayBucket {
  date: string;   // "MMM dd"
  isoDate: string;
  paise: number;
}

function buildChartData(raw: RawEntry[]): DayBucket[] {
  // Build a map date-string → total paise
  const map = new Map<string, number>();
  for (const entry of raw) {
    const key = entry.created_at.slice(0, 10); // YYYY-MM-DD
    map.set(key, (map.get(key) ?? 0) + entry.creator_payout_paise);
  }

  // Fill all 30 days (including days with zero revenue)
  const today = new Date();
  const buckets: DayBucket[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const isoDate = format(d, "yyyy-MM-dd");
    buckets.push({
      date: format(d, "MMM dd"),
      isoDate,
      paise: map.get(isoDate) ?? 0,
    });
  }
  return buckets;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueChart({ rawData }: RevenueChartProps) {
  const data = buildChartData(rawData);
  const hasRevenue = data.some((d) => d.paise > 0);

  if (!hasRevenue) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <span className="text-amber-500 text-base">₹</span>
        </div>
        <p className="text-sm">Revenue will appear once your first sale comes in</p>
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={(v) => `₹${(v / 100).toFixed(0)}`}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="paise"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
