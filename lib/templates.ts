// lib/templates.ts
// All 5 CreatorMint store templates.
// CSS variables are prefixed --page- to scope them to the public store page only.
// Never in the database — version-controlled here.

export type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaults: Record<string, string>;
  defaultBlockLayout: { blockType: string; config: object }[];
};

export const TEMPLATES: Record<string, Template> = {

  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean and distraction-free. Your work speaks.",
    thumbnail: "/templates/minimal.png",
    defaults: {
      "--page-bg":           "#FAFAFA",
      "--page-surface":      "#FFFFFF",
      "--page-text":         "#111827",
      "--page-text-muted":   "#6B7280",
      "--page-border":       "#E5E7EB",
      "--page-brand":        "#111827",
      "--page-brand-text":   "#FFFFFF",
      "--page-radius":       "8px",
      "--page-radius-card":  "12px",
      "--page-font-display": '"Plus Jakarta Sans", system-ui, sans-serif',
      "--page-font-body":    '"Plus Jakarta Sans", system-ui, sans-serif',
      "--page-shadow-card":  "0 1px 3px rgba(0,0,0,0.08)",
      "--page-shadow-hover": "0 4px 16px rgba(0,0,0,0.12)",
      "--page-hero-layout":  "centred",
    },
    defaultBlockLayout: [
      { blockType: "hero", config: { layout: "centred", showTagline: true } },
      { blockType: "product_grid", config: { columns: 3 } },
    ],
  },

  bold: {
    id: "bold",
    name: "Bold",
    description: "High contrast. Big personality. Unforgettable.",
    thumbnail: "/templates/bold.png",
    defaults: {
      "--page-bg":           "#0A0A0A",
      "--page-surface":      "#141414",
      "--page-text":         "#F9FAFB",
      "--page-text-muted":   "#9CA3AF",
      "--page-border":       "#2A2A2A",
      "--page-brand":        "#F59E0B",
      "--page-brand-text":   "#000000",
      "--page-radius":       "4px",
      "--page-radius-card":  "4px",
      "--page-font-display": '"Fraunces", Georgia, serif',
      "--page-font-body":    '"Plus Jakarta Sans", system-ui, sans-serif',
      "--page-shadow-card":  "none",
      "--page-shadow-hover": "0 0 0 2px var(--page-brand)",
      "--page-hero-layout":  "fullbleed",
    },
    defaultBlockLayout: [
      { blockType: "hero", config: { layout: "fullbleed", showTagline: true } },
      { blockType: "product_featured", config: {} },
      { blockType: "product_grid", config: { columns: 2 } },
    ],
  },

  warm: {
    id: "warm",
    name: "Warm",
    description: "Friendly and approachable. Builds trust immediately.",
    thumbnail: "/templates/warm.png",
    defaults: {
      "--page-bg":           "#FFFBF5",
      "--page-surface":      "#FFFFFF",
      "--page-text":         "#1C1917",
      "--page-text-muted":   "#78716C",
      "--page-border":       "#E7E5E4",
      "--page-brand":        "#EA580C",
      "--page-brand-text":   "#FFFFFF",
      "--page-radius":       "16px",
      "--page-radius-card":  "20px",
      "--page-font-display": '"Lora", Georgia, serif',
      "--page-font-body":    '"DM Sans", system-ui, sans-serif',
      "--page-shadow-card":  "0 2px 8px rgba(0,0,0,0.06)",
      "--page-shadow-hover": "0 8px 24px rgba(0,0,0,0.10)",
      "--page-hero-layout":  "left",
    },
    defaultBlockLayout: [
      { blockType: "hero", config: { layout: "left", showTagline: true } },
      { blockType: "about", config: { content: "" } },
      { blockType: "product_grid", config: { columns: 2 } },
    ],
  },

  magazine: {
    id: "magazine",
    name: "Magazine",
    description: "Editorial and content-first. For creators with a voice.",
    thumbnail: "/templates/magazine.png",
    defaults: {
      "--page-bg":           "#F8F7F4",
      "--page-surface":      "#FFFFFF",
      "--page-text":         "#1A1A1A",
      "--page-text-muted":   "#666666",
      "--page-border":       "#DDDDDD",
      "--page-brand":        "#1A1A1A",
      "--page-brand-text":   "#FFFFFF",
      "--page-radius":       "2px",
      "--page-radius-card":  "2px",
      "--page-font-display": '"Playfair Display", Georgia, serif',
      "--page-font-body":    '"Source Serif 4", Georgia, serif',
      "--page-shadow-card":  "none",
      "--page-shadow-hover": "none",
      "--page-hero-layout":  "editorial",
    },
    defaultBlockLayout: [
      { blockType: "hero", config: { layout: "editorial" } },
      { blockType: "product_featured", config: { style: "editorial" } },
      { blockType: "about", config: { showPhoto: true } },
      { blockType: "product_grid", config: { columns: 3 } },
    ],
  },

  neon: {
    id: "neon",
    name: "Neon",
    description: "Vibrant and electric. Stands out from everything.",
    thumbnail: "/templates/neon.png",
    defaults: {
      "--page-bg":           "#0D001A",
      "--page-surface":      "#1A0033",
      "--page-text":         "#FFFFFF",
      "--page-text-muted":   "#C084FC",
      "--page-border":       "#3B0066",
      "--page-brand":        "#A855F7",
      "--page-brand-text":   "#FFFFFF",
      "--page-radius":       "12px",
      "--page-radius-card":  "16px",
      "--page-font-display": '"Space Grotesk", system-ui, sans-serif',
      "--page-font-body":    '"Space Grotesk", system-ui, sans-serif',
      "--page-shadow-card":  "0 0 20px rgba(168,85,247,0.15)",
      "--page-shadow-hover": "0 0 40px rgba(168,85,247,0.35)",
      "--page-hero-layout":  "centred",
    },
    defaultBlockLayout: [
      { blockType: "hero", config: { layout: "centred" } },
      { blockType: "product_grid", config: { columns: 3 } },
    ],
  },
};
