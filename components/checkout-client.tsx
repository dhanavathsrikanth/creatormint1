"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";

interface CheckoutClientProps {
  productId: string;
  productTitle: string;
  pricePaise: number;
  creatorId: string;
  storeSlug: string;
  productSlug: string;
}

export function CheckoutClient({
  productId,
  productTitle,
  pricePaise,
  creatorId,
  storeSlug,
  productSlug,
}: CheckoutClientProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes("@")) {
      return toast.error("Please enter a valid email address");
    }
    if (!name.trim()) {
      return toast.error("Please enter your name");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          creatorId,
          buyerEmail: email.trim(),
          buyerName: name.trim(),
          storeSlug,
          productSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create order");
      }

      // Redirect to Cashfree payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="buyer-name">Your name</Label>
        <Input
          id="buyer-name"
          placeholder="Rahul Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="buyer-email">Email for delivery</Label>
        <Input
          id="buyer-email"
          type="email"
          placeholder="rahul@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Download link and invoice will be sent here.</p>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )}
        {loading ? "Creating order..." : `Pay ${formatINR(pricePaise)}`}
      </Button>
    </div>
  );
}
