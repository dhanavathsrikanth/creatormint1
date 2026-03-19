"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type { FeatureCategory } from "@/types/database";

const CATEGORIES: { value: FeatureCategory; label: string; desc: string }[] = [
  { value: "feature",     label: "✨ New Feature",     desc: "Something that doesn't exist yet" },
  { value: "improvement", label: "⚡ Improvement",      desc: "Make something better" },
  { value: "bug",         label: "🐛 Bug Report",       desc: "Something broken" },
  { value: "integration", label: "🔗 Integration",      desc: "Connect with other tools" },
  { value: "general",     label: "💬 General Feedback", desc: "Anything else" },
];

interface NewRequestFormProps {
  onCreated?: () => void;
  isLoggedIn: boolean;
}

export function NewRequestForm({ onCreated, isLoggedIn }: NewRequestFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeatureCategory>("feature");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login to submit a request"); return; }
    if (!title.trim()) { toast.error("Title is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTitle("");
      setDescription("");
      setCategory("feature");
      setOpen(false);
      toast.success("Request submitted! 🎉");
      if (onCreated) onCreated();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => isLoggedIn ? setOpen(true) : toast.error("Login to submit a request")}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">Suggest a feature or report an issue…</span>
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground mb-4">Submit a Request</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                category === c.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <p className="text-xs font-bold text-foreground">{c.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Title *</Label>
          <Input
            placeholder="Brief, clear title for your request…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={loading}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Details (optional)</Label>
          <Textarea
            placeholder="Describe the problem you're trying to solve or what you'd like to see…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="min-h-[90px] resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1 font-bold">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
