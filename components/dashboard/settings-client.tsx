"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Store, CreditCard, User } from "lucide-react";

interface SettingsClientProps {
  profile: Profile;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [storeName, setStoreName] = useState(profile.store_name ?? "");
  const [storeDescription, setStoreDescription] = useState(profile.store_description ?? "");
  const [upiId, setUpiId] = useState(profile.upi_id ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          store_name: storeName.trim() || null,
          store_description: storeDescription.trim() || null,
          upi_id: upiId.trim() || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Settings saved!");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your profile and store settings.</p>
      </div>

      {/* Profile */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Profile</h2>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email ?? ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </div>
      </section>

      {/* Store */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Store</h2>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Creative Store" />
          </div>
          <div className="space-y-2">
            <Label>Store URL</Label>
            <div className="flex items-center gap-0">
              <span className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                /s/
              </span>
              <Input value={profile.store_slug ?? ""} disabled className="rounded-l-none opacity-60" />
            </div>
            <p className="text-xs text-muted-foreground">URL cannot be changed after setup. Contact support to change it.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-description">Store bio</Label>
            <Textarea
              id="store-description"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Tell buyers about what you create."
              rows={3}
              maxLength={280}
            />
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Payments</h2>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input id="upi-id" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@okhdfcbank" />
            <p className="text-xs text-muted-foreground">Used for receiving payouts from Cashfree.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/40 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">KYC Status</p>
              <p className="text-sm font-semibold text-foreground capitalize mt-0.5">{profile.kyc_status}</p>
            </div>
            <div className="bg-muted/40 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Cashfree Vendor</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.cashfree_vendor_id ? "Registered" : "Not registered"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Button size="lg" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save changes
      </Button>
    </div>
  );
}
