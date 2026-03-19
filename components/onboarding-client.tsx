"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Store, CreditCard, CheckCircle2, ChevronRight, Loader2, RefreshCw } from "lucide-react";

type Step = 1 | 2 | 3;

interface OnboardingClientProps {
  userId: string;
  currentStep: number;
  initialStoreName: string | null;
  initialSlug: string | null;
  initialDescription: string | null;
  initialUpi: string | null;
}

const steps = [
  { id: 1, label: "Store details", icon: Store },
  { id: 2, label: "Payment setup", icon: CreditCard },
  { id: 3, label: "Review & launch", icon: CheckCircle2 },
];

export function OnboardingClient({
  userId,
  currentStep: initialStep,
  initialStoreName,
  initialSlug,
  initialDescription,
  initialUpi,
}: OnboardingClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(initialStep as Step || 1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [storeName, setStoreName] = useState(initialStoreName ?? "");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [slugCustomized, setSlugCustomized] = useState(!!initialSlug);

  // Step 2
  const [upiId, setUpiId] = useState(initialUpi ?? "");

  const handleSlugFromName = (name: string) => {
    if (!slugCustomized) {
      setSlug(slugify(name));
    }
  };

  const checkSlugAvailable = async (s: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("store_slug", s)
      .neq("id", userId)
      .maybeSingle();
    return !data;
  };

  const saveStep1 = async () => {
    if (!storeName.trim()) return toast.error("Store name is required");
    if (!slug.trim()) return toast.error("Store URL is required");
    if (!/^[a-z0-9-]+$/.test(slug)) return toast.error("URL can only contain lowercase letters, numbers and hyphens");

    setLoading(true);
    try {
      const available = await checkSlugAvailable(slug);
      if (!available) {
        toast.error("That URL is already taken. Try another.");
        return;
      }
      const { error } = await supabase.from("profiles").update({
        store_name: storeName.trim(),
        store_slug: slug.trim(),
        store_description: description.trim() || null,
        onboarding_step: 2,
      }).eq("id", userId);
      if (error) throw error;
      setStep(2);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveStep2 = async () => {
    if (!upiId.trim()) return toast.error("UPI ID is required");
    const upiRegex = /^[\w.\-]+@[\w]+$/;
    if (!upiRegex.test(upiId.trim())) return toast.error("Enter a valid UPI ID (e.g. name@upi)");

    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        upi_id: upiId.trim(),
        onboarding_step: 3,
      }).eq("id", userId);
      if (error) throw error;
      setStep(3);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        onboarding_complete: true,
        onboarding_step: 3,
      }).eq("id", userId);
      if (error) throw error;
      toast.success("Store launched! Welcome to CreatorMint 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 text-2xl font-bold text-foreground">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-black">CM</span>
          CreatorMint
        </span>
        <p className="text-muted-foreground text-sm mt-1">Set up your store in 3 quick steps</p>
      </div>

      {/* Step indicators */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? "bg-primary border-primary text-primary-foreground" :
                  active ? "border-primary text-primary bg-accent" :
                  "border-border text-muted-foreground bg-background"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Name your store</h2>
                <p className="text-sm text-muted-foreground mt-1">This is what buyers will see when they visit your store.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store name <span className="text-destructive">*</span></Label>
                  <Input
                    id="store-name"
                    placeholder="Ravi's Design Kit"
                    value={storeName}
                    onChange={(e) => { setStoreName(e.target.value); handleSlugFromName(e.target.value); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-slug">Store URL <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-0">
                    <span className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      creatormi.nt/s/
                    </span>
                    <Input
                      id="store-slug"
                      className="rounded-l-none"
                      placeholder="ravis-design-kit"
                      value={slug}
                      onChange={(e) => { setSlug(slugify(e.target.value)); setSlugCustomized(true); }}
                    />
                    <button
                      type="button"
                      className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Auto-generate from store name"
                      onClick={() => { setSlug(slugify(storeName)); setSlugCustomized(false); }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-description">Short bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea
                    id="store-description"
                    placeholder="I create premium design resources for founders and makers."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={280}
                  />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/280</p>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={saveStep1} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Set up payments</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your UPI ID — buyers will pay directly and you get instant settlements.</p>
              </div>

              <div className="bg-accent/50 border border-accent-foreground/10 rounded-xl p-4 text-sm text-accent-foreground space-y-1">
                <p className="font-medium">💰 How you get paid</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Buyers pay via UPI or card (powered by Cashfree)</li>
                  <li>• Fees: 5% if revenue &lt; ₹10k/mo, 2% above that</li>
                  <li>• Settlements in T+2 business days</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID <span className="text-destructive">*</span></Label>
                <Input
                  id="upi-id"
                  placeholder="yourname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Accepted formats: name@upi, name@ybl, name@okhdfcbank, etc.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" size="lg" onClick={saveStep2} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Ready to launch!</h2>
                <p className="text-sm text-muted-foreground mt-1">Here's a summary of your store setup.</p>
              </div>

              <div className="bg-muted/40 rounded-xl divide-y divide-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Store name</span>
                  <span className="text-sm font-medium text-foreground">{storeName}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Store URL</span>
                  <span className="text-sm font-medium text-foreground">/s/{slug}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">UPI ID</span>
                  <span className="text-sm font-medium text-foreground">{upiId}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" size="lg" onClick={finish} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  🚀 Launch my store
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
