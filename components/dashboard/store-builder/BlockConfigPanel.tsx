"use client";

import type { Profile } from "@/types/database";

interface BlockConfigPanelProps {
  blockType: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  profile: Profile;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 mb-4">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Segmented({ options, value, onChange }: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-border">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BlockConfigPanel({ blockType, config, onChange, profile }: BlockConfigPanelProps) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  switch (blockType) {

    case "hero":
      return (
        <div>
          <Field label="Tagline" hint="Overrides your profile description">
            <TextInput
              value={(config.tagline as string) ?? ""}
              onChange={(v) => set("tagline", v)}
              placeholder={profile.store_description ?? "What do you do?"}
              maxLength={140}
            />
          </Field>
          <Field label="Photo layout">
            <Segmented
              options={[
                { label: "Centred", value: "centred" },
                { label: "Left", value: "left" },
                { label: "Full width", value: "fullbleed" },
              ]}
              value={(config.layout as string) ?? "centred"}
              onChange={(v) => set("layout", v)}
            />
          </Field>
          <Field label="Show social links">
            <Toggle
              checked={config.showSocials !== false}
              onChange={(v) => set("showSocials", v)}
            />
          </Field>
        </div>
      );

    case "product_grid":
      return (
        <div>
          <Field label="Section heading (optional)">
            <TextInput
              value={(config.heading as string) ?? ""}
              onChange={(v) => set("heading", v)}
              placeholder="My products"
            />
          </Field>
          <Field label="Columns">
            <Segmented
              options={[{ label: "2 columns", value: 2 }, { label: "3 columns", value: 3 }]}
              value={(config.columns as number) ?? 3}
              onChange={(v) => set("columns", v)}
            />
          </Field>
          <Field label="Show sales count">
            <Toggle checked={config.showSales !== false} onChange={(v) => set("showSales", v)} />
          </Field>
        </div>
      );

    case "about":
      return (
        <div>
          <Field label="Your story" hint={`${String(config.content ?? "").length} / 800 characters`}>
            <textarea
              value={(config.content as string) ?? ""}
              onChange={(e) => set("content", e.target.value)}
              rows={5}
              maxLength={800}
              placeholder="I spent 5 years building products for independent creators..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </Field>
          <Field label="Section heading">
            <TextInput
              value={(config.heading as string) ?? "About me"}
              onChange={(v) => set("heading", v)}
              placeholder="About me"
            />
          </Field>
          <Field label="Show photo beside text">
            <Toggle checked={config.showPhoto === true} onChange={(v) => set("showPhoto", v)} />
          </Field>
        </div>
      );

    case "product_featured":
      return (
        <div>
          <p className="text-xs text-muted-foreground mb-3 bg-primary/5 border border-primary/20 rounded-lg p-2">
            💡 Enter a product ID to feature it, or leave blank and it won't render publicly.
          </p>
          <Field label="Product ID">
            <TextInput
              value={(config.productId as string) ?? ""}
              onChange={(v) => set("productId", v)}
              placeholder="Paste the product UUID..."
            />
          </Field>
          <Field label="Section heading (optional)">
            <TextInput
              value={(config.heading as string) ?? ""}
              onChange={(v) => set("heading", v)}
              placeholder="My best-seller"
            />
          </Field>
        </div>
      );

    case "lead_magnet":
      return (
        <div>
          <p className="text-xs text-muted-foreground mb-3 bg-primary/5 border border-primary/20 rounded-lg p-2">
            💡 Only works with a free product (price = ₹0). Enter its ID below.
          </p>
          <Field label="Free product ID">
            <TextInput
              value={(config.productId as string) ?? ""}
              onChange={(v) => set("productId", v)}
              placeholder="Paste the free product UUID..."
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={(config.headline as string) ?? ""}
              onChange={(v) => set("headline", v)}
              placeholder="Get my free Notion starter kit"
            />
          </Field>
          <Field label="Button text">
            <TextInput
              value={(config.buttonText as string) ?? ""}
              onChange={(v) => set("buttonText", v)}
              placeholder="Download for free →"
            />
          </Field>
        </div>
      );

    case "testimonials": {
      const testimonials = (config.testimonials as { quote: string; name: string; handle?: string }[]) ?? [];
      return (
        <div>
          {testimonials.map((t, i) => (
            <div key={i} className="border border-border rounded-lg p-3 mb-2 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-muted-foreground">#{i + 1}</p>
                <button
                  onClick={() => set("testimonials", testimonials.filter((_, j) => j !== i))}
                  className="text-[11px] text-destructive hover:underline"
                >Remove</button>
              </div>
              <textarea
                value={t.quote}
                onChange={(e) => {
                  const updated = [...testimonials];
                  updated[i] = { ...updated[i], quote: e.target.value };
                  set("testimonials", updated);
                }}
                rows={2}
                placeholder="Quote..."
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              />
              <input
                value={t.name}
                onChange={(e) => {
                  const updated = [...testimonials];
                  updated[i] = { ...updated[i], name: e.target.value };
                  set("testimonials", updated);
                }}
                placeholder="Name"
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <input
                value={t.handle ?? ""}
                onChange={(e) => {
                  const updated = [...testimonials];
                  updated[i] = { ...updated[i], handle: e.target.value };
                  set("testimonials", updated);
                }}
                placeholder="@handle (optional)"
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => set("testimonials", [...testimonials, { quote: "", name: "", handle: "" }])}
            className="w-full py-2 border-2 border-dashed border-border rounded-lg text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Add testimonial
          </button>
        </div>
      );
    }

    case "custom_link":
      return (
        <div>
          <Field label="Button label">
            <TextInput
              value={(config.label as string) ?? ""}
              onChange={(v) => set("label", v)}
              placeholder="Watch my YouTube channel"
            />
          </Field>
          <Field label="URL">
            <TextInput
              value={(config.url as string) ?? ""}
              onChange={(v) => set("url", v)}
              placeholder="https://youtube.com/@yourhandle"
            />
          </Field>
          <Field label="Style">
            <Segmented
              options={[{ label: "Button", value: "button" }, { label: "Card", value: "card" }]}
              value={(config.style as string) ?? "button"}
              onChange={(v) => set("style", v)}
            />
          </Field>
        </div>
      );

    case "booking":
    case "community":
      return (
        <div>
          <Field label="Product ID" hint="Paste the UUID of the booking/community product">
            <TextInput
              value={(config.productId as string) ?? ""}
              onChange={(v) => set("productId", v)}
              placeholder="Paste product UUID..."
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={(config.headline as string) ?? ""}
              onChange={(v) => set("headline", v)}
              placeholder="Book a 1:1 call with me"
            />
          </Field>
        </div>
      );

    default:
      return <p className="text-xs text-muted-foreground py-2">No configuration for this block.</p>;
  }
}
