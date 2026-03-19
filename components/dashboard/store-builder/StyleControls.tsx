"use client";

import type { Template } from "@/lib/templates";

interface StyleControlsProps {
  storeConfig: { template_id: string; custom_styles: Record<string, string> } | null;
  template: Template | undefined;
  onStyleChange: (styles: Record<string, string>) => Promise<void>;
}

const ACCENT_PRESETS = [
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F97316", label: "Orange" },
  { value: "#111827", label: "Black" },
  { value: "#FFFFFF", label: "White" },
];

const FONT_OPTIONS = [
  { label: "Modern",  value: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { label: "Elegant", value: '"Fraunces", Georgia, serif' },
  { label: "Warm",    value: '"Lora", Georgia, serif' },
  { label: "Compact", value: '"Space Grotesk", system-ui, sans-serif' },
  { label: "Classic", value: '"Playfair Display", Georgia, serif' },
  { label: "Editorial", value: '"Source Serif 4", Georgia, serif' },
];

const RADIUS_OPTIONS = [
  { label: "Sharp",   value: "2px",    previewRadius: "2px" },
  { label: "Rounded", value: "8px",    previewRadius: "8px" },
  { label: "Soft",    value: "16px",   previewRadius: "16px" },
  { label: "Pill",    value: "9999px", previewRadius: "20px" },
];

// Simple contrast detection
function isColourDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function StyleControls({ storeConfig, template, onStyleChange }: StyleControlsProps) {
  const getValue = (key: string): string =>
    storeConfig?.custom_styles?.[key] ?? template?.defaults?.[key] ?? "";

  const updateStyle = (updates: Record<string, string>) => {
    const newStyles = { ...(storeConfig?.custom_styles ?? {}), ...updates };
    onStyleChange(newStyles);
  };

  const setAccent = (hex: string) => {
    updateStyle({
      "--page-brand": hex,
      "--page-brand-text": isColourDark(hex) ? "#FFFFFF" : "#000000",
    });
  };

  const hasOverrides = Object.keys(storeConfig?.custom_styles ?? {}).length > 0;
  const currentFont = getValue("--page-font-display");
  const currentRadius = getValue("--page-radius");
  const currentBrand = getValue("--page-brand");

  return (
    <div className="p-4 space-y-6">

      {/* Accent Colour */}
      <section>
        <p className="text-xs font-bold text-foreground mb-1">Accent Colour</p>
        <p className="text-[11px] text-muted-foreground mb-3">Buttons, links, highlights</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACCENT_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAccent(value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                currentBrand === value ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-border"
              }`}
              style={{ background: value, boxShadow: value === "#FFFFFF" ? "inset 0 0 0 1px #e5e7eb" : undefined }}
              title={label}
            />
          ))}
          {/* Custom colour picker */}
          <label className="w-8 h-8 rounded-full border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center text-muted-foreground text-xs transition-colors" title="Custom colour">
            +
            <input
              type="color"
              value={currentBrand || "#000000"}
              onChange={(e) => setAccent(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        {/* Current colour preview */}
        {currentBrand && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm"
          >
            <div className="w-4 h-4 rounded-full border border-border" style={{ background: currentBrand }} />
            <span className="text-foreground font-mono text-xs">{currentBrand}</span>
          </div>
        )}
      </section>

      {/* Heading Font */}
      <section>
        <p className="text-xs font-bold text-foreground mb-3">Heading Font</p>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => updateStyle({ "--page-font-display": font.value })}
              className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                currentFont === font.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground bg-card"
              }`}
            >
              <div
                className="text-xl font-bold text-foreground mb-0.5 leading-none"
                style={{ fontFamily: font.value }}
              >
                Aa
              </div>
              <div className="text-[11px] text-muted-foreground">{font.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Button Shape */}
      <section>
        <p className="text-xs font-bold text-foreground mb-3">Button Shape</p>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const cardMap: Record<string, string> = {
                  "2px": "4px", "8px": "12px", "16px": "20px", "9999px": "24px",
                };
                updateStyle({
                  "--page-radius": opt.value,
                  "--page-radius-card": cardMap[opt.value] ?? opt.value,
                });
              }}
              className={`p-2 flex flex-col items-center gap-1.5 rounded-lg border transition-all ${
                currentRadius === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div
                className="w-8 h-5 bg-muted border border-muted-foreground/20"
                style={{ borderRadius: opt.previewRadius }}
              />
              <span className="text-[10px] text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Reset */}
      {hasOverrides && (
        <button
          onClick={() => onStyleChange({})}
          className="w-full py-2 text-xs font-semibold text-muted-foreground border border-dashed border-border rounded-lg hover:border-destructive hover:text-destructive transition-colors"
        >
          Reset to template defaults
        </button>
      )}
    </div>
  );
}
