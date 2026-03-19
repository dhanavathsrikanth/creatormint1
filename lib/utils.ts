import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// ── Money ────────────────────────────────────────────────────────────────────

/** Display paise as ₹ string. All money lives in paise (integer). */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Convert rupees number to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise to plain rupee number (for display). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// ── Slug ─────────────────────────────────────────────────────────────────────

/** Convert any text to a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── GST ──────────────────────────────────────────────────────────────────────

/**
 * Calculate GST-inclusive breakdown.
 * Assumes price_paise is the GST-inclusive (total) amount.
 * @param totalPaise  GST-inclusive price in paise
 * @param rate        GST rate as integer (e.g. 18)
 */
export function calculateGST(
  totalPaise: number,
  rate: number = 18,
): { base: number; gst: number; total: number } {
  const base = Math.round((totalPaise * 100) / (100 + rate));
  const gst = totalPaise - base;
  return { base, gst, total: totalPaise };
}

// ── Platform fee ─────────────────────────────────────────────────────────────

/**
 * Calculate CreatorMint platform fee.
 * - 5% if creator MRR < ₹10,000 (1_000_000 paise)
 * - 2% if creator MRR >= ₹10,000
 */
export function calculatePlatformFee(
  amountPaise: number,
  mrrPaise: number,
): number {
  const ratePercent = mrrPaise >= 1_000_000 ? 2 : 5;
  return Math.round((amountPaise * ratePercent) / 100);
}

// ── Invoice number ────────────────────────────────────────────────────────────

/**
 * Generate invoice number in format CM-YYYYMM-XXXXX.
 * @param year  4-digit year
 * @param month 1-12
 * @param seq   sequential integer (padded to 5 digits)
 */
export function generateInvoiceNumber(
  year: number,
  month: number,
  seq: number,
): string {
  const mm = String(month).padStart(2, "0");
  const seqStr = String(seq).padStart(5, "0");
  return `CM-${year}${mm}-${seqStr}`;
}

// ── Misc ─────────────────────────────────────────────────────────────────────

/** Return a human-readable file size string. */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Truncate text with ellipsis. */
export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 3) + "...";
}
