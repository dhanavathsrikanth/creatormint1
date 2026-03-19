"use client";

import { useState } from "react";
import type { Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { Mail, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LeadMagnetBlockProps {
  block: {
    config?: {
      headline?: string;
      buttonText?: string;
    };
  };
  product: Pick<Product, "id" | "title" | "cover_image_url" | "price_paise">;
}

export function LeadMagnetBlock({ block, product }: LeadMagnetBlockProps) {
  const headline = block.config?.headline ?? `Get ${product.title} — Free`;
  const buttonText = block.config?.buttonText ?? "Download for free →";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lead-magnet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.file_url) window.open(data.file_url, "_blank");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section className="lead-magnet-block">
        <div className="lead-magnet-inner">
          <Download className="lead-magnet-icon" size={32} />
          <h2 className="lead-magnet-headline">Check your downloads!</h2>
          <p className="lead-magnet-sub">Your file should be downloading now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="lead-magnet-block">
      <div className="lead-magnet-inner">
        <Mail className="lead-magnet-icon" size={32} />
        <h2 className="lead-magnet-headline">{headline}</h2>
        <p className="lead-magnet-sub">Enter your email and get instant access.</p>
        <form onSubmit={handleClaim} className="lead-magnet-form">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="lead-magnet-input"
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="btn-primary lead-magnet-btn">
            {loading ? <Loader2 size={16} className="animate-spin" /> : buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
