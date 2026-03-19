"use client";

import { useState } from "react";
import type { Template } from "@/lib/templates";
import { Check, Loader2 } from "lucide-react";

interface TemplatePickerProps {
  templates: Record<string, Template>;
  selectedTemplateId: string;
  onSelect: (id: string) => Promise<void>;
}

const TEMPLATE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  minimal:  { bg: "#FAFAFA", accent: "#111827", text: "#111827" },
  bold:     { bg: "#0A0A0A", accent: "#F59E0B", text: "#F9FAFB" },
  warm:     { bg: "#FFFBF5", accent: "#EA580C", text: "#1C1917" },
  magazine: { bg: "#F8F7F4", accent: "#1A1A1A", text: "#1A1A1A" },
  neon:     { bg: "#0D001A", accent: "#A855F7", text: "#FFFFFF" },
};

export function TemplatePicker({ templates, selectedTemplateId, onSelect }: TemplatePickerProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirming) return;
    setLoading(true);
    await onSelect(confirming);
    setLoading(false);
    setConfirming(null);
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        Templates change colours, fonts, and layout. Your content stays the same.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {Object.values(templates).map((template) => {
          const colors = TEMPLATE_COLORS[template.id] ?? TEMPLATE_COLORS.minimal;
          const isSelected = selectedTemplateId === template.id;
          const isConfirming = confirming === template.id;

          return (
            <button
              key={template.id}
              onClick={() => {
                if (isSelected) return;
                setConfirming(template.id);
              }}
              className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${
                isSelected
                  ? "border-primary shadow-md"
                  : isConfirming
                  ? "border-amber-400"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {/* Color preview swatch */}
              <div
                className="h-14 relative flex items-center px-4 gap-3"
                style={{ background: colors.bg }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/30 shrink-0"
                  style={{ background: colors.accent }}
                />
                <div className="flex gap-1.5 flex-1">
                  {[70, 50, 40].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full"
                      style={{ width: `${w}%`, background: colors.text, opacity: 0.2 + i * 0.05 }}
                    />
                  ))}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="px-4 py-2.5 bg-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{template.name}</p>
                  <p className="text-[11px] text-muted-foreground">{template.description}</p>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation bar */}
      {confirming && (
        <div className="sticky bottom-0 bg-card border border-amber-300 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">
            Switch to <strong>{templates[confirming]?.name}</strong>?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Your blocks and content won't be affected.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Switching…" : "Yes, switch"}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
