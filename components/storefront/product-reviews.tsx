"use client";

import { useState } from "react";
import { Star, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type { ProductReview } from "@/types/database";

interface ProductReviewsProps {
  productId: string;
  initialReviews: ProductReview[];
  accentColor: string;
  maxReviewsDisplayed: number;
}

export function ProductReviews({ productId, initialReviews, accentColor, maxReviewsDisplayed }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [name, setName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating star");
    if (!name.trim()) return toast.error("Please enter your name");
    if (!reviewText.trim()) return toast.error("Please write a review");

    setLoading(true);
    try {
      const res = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerName: name,
          rating,
          reviewText: reviewText,
          reviewVideoUrl: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post review");

      setReviews((prev) => [data.review, ...prev]);
      setRating(0);
      setName("");
      setReviewText("");
      toast.success("Review posted successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error posting review");
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-10">
      {/* ── Review Form ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Share your experience</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star selector */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-200"
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500">Your Name</Label>
              <Input 
                placeholder="e.g. Rahul Sharma" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-100 focus:bg-white focus:ring-1 focus:ring-gray-200 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500">Your Review</Label>
              <Textarea
                placeholder="What did you think about this product?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={loading}
                className="min-h-[100px] bg-gray-50 border-gray-100 focus:bg-white focus:ring-1 focus:ring-gray-200 resize-none p-4"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-100/20 active:scale-[0.98] transition-all"
            style={{ backgroundColor: accentColor }}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </form>
      </div>

      {/* ── Reviews List ── */}
      {reviews.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-gray-50">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-gray-900">Buyer Reviews</h3>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-900">{avgRating} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {reviews.slice(0, maxReviewsDisplayed).map((r) => (
              <div key={r.id} className="py-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{r.buyer_name}</p>
                      <p className="text-[11px] font-medium text-gray-400">{new Date(r.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
                      />
                    ))}
                  </div>
                </div>

                {r.review_text && (
                  <p className="text-gray-600 leading-relaxed text-sm">{r.review_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
