"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  productId?: string | null;
  creatorId: string;
}

export function PageViewTracker({ productId, creatorId }: PageViewTrackerProps) {
  useEffect(() => {
    // Generate or retrieve a stable session ID
    const sid =
      sessionStorage.getItem("sessionId") ??
      (() => {
        const id = crypto.randomUUID();
        sessionStorage.setItem("sessionId", id);
        return id;
      })();

    // Fire analytics event (fire-and-forget)
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: productId ? "product_view" : "page_view",
        productId: productId ?? null,
        creatorId,
        referrer: document.referrer || null,
        sessionId: sid,
      }),
    }).catch(() => { /* non-critical */ });

    // Detect affiliate referral code in URL
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) sessionStorage.setItem("affiliateCode", ref);
  }, [productId, creatorId]);

  return null;
}
