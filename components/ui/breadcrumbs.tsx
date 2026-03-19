"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

/**
 * Maps path segments to human-readable labels.
 * Dynamic segments like [id] are shown as-is (truncated).
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products:  "Products",
  sales:     "Sales",
  support:   "Support",
  settings:  "Settings",
  roadmap:   "Roadmap",
  new:       "New Product",
  edit:      "Edit",
  buyer:     "Home",
  orders:    "My Orders",
  admin:     "Admin",
  tickets:   "Tickets",
  creators:  "Creators",
};

function segmentLabel(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  // UUID-ish → truncate
  if (/^[0-9a-f-]{20,}$/i.test(seg)) return seg.slice(0, 8) + "…";
  // Slug with hyphens → title case
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs({ homeHref = "/" }: { homeHref?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build cumulative hrefs
  const crumbs = segments.map((seg, i) => ({
    label: segmentLabel(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link
        href={homeHref}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 opacity-40" />
            {isLast ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
