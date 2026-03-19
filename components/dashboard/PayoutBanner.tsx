"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { X, AlertTriangle } from "lucide-react";

const DISMISS_KEY = "payout-banner-dismissed";

interface PayoutBannerProps {
  upiId: string | null;
  totalRevenuePaise: number;
}

export function PayoutBanner({ upiId, totalRevenuePaise }: PayoutBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if: no UPI, has revenue, and not previously dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    if (!upiId && totalRevenuePaise > 0 && !dismissed) {
      setVisible(true);
    }
  }, [upiId, totalRevenuePaise]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
        <span className="font-semibold">{formatINR(totalRevenuePaise)}</span> is ready for payout.{" "}
        <Link
          href="/dashboard/settings"
          className="underline underline-offset-2 hover:text-amber-900 font-medium"
        >
          Set up your UPI to receive it →
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
