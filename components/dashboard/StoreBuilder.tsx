"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import type { Template } from "@/lib/templates";
import { TemplatePicker } from "./store-builder/TemplatePicker";
import { BlockManager } from "./store-builder/BlockManager";
import { StyleControls } from "./store-builder/StyleControls";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

type Tab = "templates" | "blocks" | "style";

interface StoreBlock {
  id: string;
  block_type: string;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

interface StoreConfig {
  template_id: string;
  custom_styles: Record<string, string>;
}

interface StoreBuilderProps {
  profile: Profile;
  storeConfig: StoreConfig | null;
  blocks: StoreBlock[];
  templates: Record<string, Template>;
}

export function StoreBuilder({ profile, storeConfig, blocks, templates }: StoreBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobilePreview, setMobilePreview] = useState(false);

  const refreshPreview = () => setPreviewKey((k) => k + 1);

  const tabs: { id: Tab; label: string }[] = [
    { id: "templates", label: "Templates" },
    { id: "blocks",    label: "Blocks" },
    { id: "style",     label: "Style" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Left Sidebar ── */}
      <aside className="w-[340px] min-w-[340px] border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-sm font-bold text-foreground">Store Builder</h2>
          <a
            href={`/${profile.store_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            View live <ExternalLink size={12} />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "templates" && (
            <TemplatePicker
              templates={templates}
              selectedTemplateId={storeConfig?.template_id ?? "minimal"}
              onSelect={async (templateId) => {
                const res = await fetch("/api/store-builder/config", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ template_id: templateId }),
                });
                if (res.ok) {
                  toast.success("Template applied!");
                  refreshPreview();
                } else {
                  toast.error("Failed to apply template");
                }
              }}
            />
          )}

          {activeTab === "blocks" && (
            <BlockManager
              blocks={blocks}
              profile={profile}
              onReorder={async (reorderedBlocks) => {
                await fetch("/api/store-builder/blocks/reorder", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blocks: reorderedBlocks }),
                });
                refreshPreview();
              }}
              onToggleVisible={async (blockId, visible) => {
                await fetch(`/api/store-builder/blocks/${blockId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_visible: visible }),
                });
                refreshPreview();
              }}
              onConfigChange={async (blockId, config) => {
                await fetch(`/api/store-builder/blocks/${blockId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ config }),
                });
                refreshPreview();
              }}
              onAddBlock={async (blockType) => {
                const maxPosition = blocks.reduce((max, b) => Math.max(max, b.position), -1);
                const res = await fetch("/api/store-builder/blocks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ block_type: blockType, position: maxPosition + 1 }),
                });
                refreshPreview();
                return res.json();
              }}
              onDeleteBlock={async (blockId) => {
                await fetch(`/api/store-builder/blocks/${blockId}`, { method: "DELETE" });
                refreshPreview();
              }}
            />
          )}

          {activeTab === "style" && (
            <StyleControls
              storeConfig={storeConfig}
              template={templates[storeConfig?.template_id ?? "minimal"]}
              onStyleChange={async (customStyles) => {
                await fetch("/api/store-builder/config", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ custom_styles: customStyles }),
                });
                refreshPreview();
              }}
            />
          )}
        </div>
      </aside>

      {/* ── Right Preview ── */}
      <main className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
        {/* Preview toolbar */}
        <div className="h-14 px-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground font-medium">
            Live Preview — changes save instantly
          </span>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMobilePreview(false)}
              className={`p-1.5 rounded-md transition-colors ${!mobilePreview ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Desktop preview"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={`p-1.5 rounded-md transition-colors ${mobilePreview ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Mobile preview"
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>

        {/* Iframe wrapper */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-6">
          <div
            className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
            style={{
              width: mobilePreview ? "375px" : "100%",
              height: mobilePreview ? "812px" : "100%",
              minHeight: "600px",
            }}
          >
            <iframe
              key={previewKey}
              src={`/${profile.store_slug}`}
              className="w-full h-full border-0"
              title="Store preview"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
