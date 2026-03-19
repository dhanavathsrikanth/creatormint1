"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";

interface ProductCTAProps {
  productId: string;
  pricePaise: number;
  creatorId: string;
  storeSlug: string;
  productSlug: string;
  ctaText: string | null;
  accentColor: string;
}

export function ProductCTA({
  productId,
  pricePaise,
  creatorId,
  storeSlug,
  productSlug,
  ctaText,
  accentColor,
}: ProductCTAProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const buttonText = ctaText || (pricePaise === 0 ? "Get it for free" : `Buy now for ${formatINR(pricePaise)}`);

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

      // Redirect to Cashfree payment page or direct download if DEV bypass
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="w-full text-base font-bold shadow-lg transition-transform hover:-translate-y-0.5" 
          style={{ backgroundColor: accentColor, color: "#fff" }}
        >
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Where should we send your product?</DialogTitle>
          <DialogDescription>
            Enter your details to receive access to your purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-name">Your Full Name</Label>
            <Input
              id="checkout-name"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-email">Email Address</Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll send your download link and invoice here.
            </p>
          </div>
        </div>
        <Button 
          className="w-full" 
          onClick={handleCheckout} 
          disabled={loading}
          style={{ backgroundColor: accentColor, color: "#fff" }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <>
              Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
