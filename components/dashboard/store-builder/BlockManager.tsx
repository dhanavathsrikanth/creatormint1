"use client";

import { useState, useRef } from "react";
import { BlockConfigPanel } from "./BlockConfigPanel";
import type { Profile } from "@/types/database";
import { Eye, EyeOff, ChevronDown, ChevronUp, GripVertical, X, Plus } from "lucide-react";

const BLOCK_META: Record<string, { label: string; emoji: string; description: string }> = {
  hero:             { emoji: "👤", label: "Hero",             description: "Your photo, name, and tagline" },
  product_featured: { emoji: "⭐", label: "Featured Product", description: "One product displayed large" },
  product_grid:     { emoji: "🏪", label: "Product Grid",     description: "All your published products" },
  booking:          { emoji: "📅", label: "Booking",          description: "1:1 sessions" },
  community:        { emoji: "👥", label: "Community",        description: "Paid membership" },
  lead_magnet:      { emoji: "🎁", label: "Lead Magnet",      description: "Free product + email capture" },
  about:            { emoji: "📖", label: "About",            description: "Your story" },
  testimonials:     { emoji: "💬", label: "Testimonials",     description: "Social proof quotes" },
  custom_link:      { emoji: "🔗", label: "Custom Link",      description: "Link to anywhere" },
};

const SINGLETON_BLOCKS = new Set(["hero", "product_grid", "about", "lead_magnet"]);
const ADDABLE_BLOCKS = ["product_featured", "booking", "community", "testimonials", "custom_link"];

interface StoreBlock {
  id: string;
  block_type: string;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

interface BlockManagerProps {
  blocks: StoreBlock[];
  profile: Profile;
  onReorder: (blocks: { id: string; position: number }[]) => Promise<void>;
  onToggleVisible: (id: string, visible: boolean) => Promise<void>;
  onConfigChange: (id: string, config: Record<string, unknown>) => Promise<void>;
  onAddBlock: (blockType: string) => Promise<StoreBlock>;
  onDeleteBlock: (id: string) => Promise<void>;
}

export function BlockManager({
  blocks: initialBlocks,
  profile,
  onReorder,
  onToggleVisible,
  onConfigChange,
  onAddBlock,
  onDeleteBlock,
}: BlockManagerProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);

  /* ── Drag handlers ── */
  const handleDragStart = (id: string) => {
    dragItem.current = id;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragItem.current !== id) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const fromId = dragItem.current;
    if (!fromId || fromId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const fromIdx = blocks.findIndex((b) => b.id === fromId);
    const toIdx   = blocks.findIndex((b) => b.id === targetId);
    const reordered = [...blocks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withPositions = reordered.map((b, i) => ({ ...b, position: i }));

    setBlocks(withPositions);
    setDraggingId(null);
    setDragOverId(null);
    dragItem.current = null;
    onReorder(withPositions.map((b) => ({ id: b.id, position: b.position })));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    dragItem.current = null;
  };

  /* ── Other handlers ── */
  const handleToggleVisible = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const newVisible = !block.is_visible;
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, is_visible: newVisible } : b)));
    onToggleVisible(blockId, newVisible);
  };

  const handleConfigChange = (blockId: string, config: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, config } : b)));
    onConfigChange(blockId, config);
  };

  const handleAddBlock = async (blockType: string) => {
    setShowAddMenu(false);
    const newBlock = await onAddBlock(blockType);
    setBlocks((prev) => [...prev, newBlock]);
    setExpandedId(newBlock.id);
  };

  const handleDelete = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    onDeleteBlock(blockId);
  };

  const existingTypes = new Set(blocks.map((b) => b.block_type));

  return (
    <div className="p-3 space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        Drag ⠿ to reorder · Eye to hide · Arrow to configure
      </p>

      {blocks.map((block) => {
        const meta = BLOCK_META[block.block_type];
        const isDragging  = draggingId === block.id;
        const isDragOver  = dragOverId === block.id;
        const isExpanded  = expandedId === block.id;
        const isHero      = block.block_type === "hero";

        return (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(block.id)}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDrop={(e) => handleDrop(e, block.id)}
            onDragEnd={handleDragEnd}
            className={`rounded-xl border bg-card overflow-hidden transition-all ${
              isDragging  ? "opacity-40 border-primary scale-95" : ""
            } ${isDragOver ? "border-primary ring-2 ring-primary/30" : "border-border"
            } ${!block.is_visible ? "opacity-60" : ""}`}
          >
            {/* Header row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              {/* Drag handle */}
              <span
                className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing select-none"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </span>

              <span className="text-base select-none">{meta?.emoji}</span>
              <span className="flex-1 text-sm font-semibold text-foreground">{meta?.label}</span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleVisible(block.id)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={block.is_visible ? "Hide block" : "Show block"}
                >
                  {block.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : block.id)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Configure"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {!isHero && (
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                    title="Remove block"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Config panel */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/30 px-3 py-3">
                <BlockConfigPanel
                  blockType={block.block_type}
                  config={block.config ?? {}}
                  onChange={(cfg) => handleConfigChange(block.id, cfg)}
                  profile={profile}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add block section */}
      <div className="pt-2">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={14} />
          Add a block
        </button>

        {showAddMenu && (
          <div className="mt-2 border border-border rounded-xl overflow-hidden bg-card shadow-lg">
            {ADDABLE_BLOCKS.map((blockType) => {
              const meta = BLOCK_META[blockType];
              const disabled = SINGLETON_BLOCKS.has(blockType) && existingTypes.has(blockType);
              return (
                <button
                  key={blockType}
                  onClick={() => !disabled && handleAddBlock(blockType)}
                  disabled={disabled}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border last:border-0 transition-colors ${
                    disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
                  }`}
                >
                  <span className="text-lg shrink-0">{meta?.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{meta?.label}</p>
                    <p className="text-xs text-muted-foreground">{meta?.description}</p>
                    {disabled && <p className="text-[10px] text-primary font-semibold mt-0.5">Already added</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
