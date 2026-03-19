"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ImageCropper } from "@/components/ui/image-cropper";
import { slugify, rupeesToPaise, formatINR, formatFileSize } from "@/lib/utils";
import {
  Loader2, Upload, ImagePlus, FileUp, X, Eye, EyeOff,
  IndianRupee, CheckCircle2, RefreshCw, Check, AlertCircle,
  Globe, Lock, Trash2,
} from "lucide-react";
import type { Product } from "@/types/database";

interface ProductEditorProps {
  userId: string;
  storeSlug: string | null;
  product: Product;  // always present — new flow creates draft first
}

type SlugStatus = "idle" | "checking" | "available" | "taken";

// ══════════════════════════════════════════════════════════════════
export function ProductEditor({ userId, storeSlug, product }: ProductEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  // ── Form state ────────────────────────────────────────────────
  const [title, setTitle] = useState(product.title);
  const [slug, setSlug] = useState(product.slug);
  const [summary, setSummary] = useState(product.summary ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [ctaText, setCtaText] = useState(product.cta_text ?? "");
  const [maxReviews, setMaxReviews] = useState<string>(String(product.max_reviews_displayed ?? 10));
  const [priceRupees, setPriceRupees] = useState(
    product.price_paise > 0 ? String(product.price_paise / 100) : ""
  );
  const [isFree, setIsFree] = useState(product.price_paise === 0);
  const [isPublished, setIsPublished] = useState(product.is_published);
  const [slugCustomized, setSlugCustomized] = useState(true);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  // ── Cover image state ─────────────────────────────────────────
  const [coverPreview, setCoverPreview] = useState<string | null>(product.cover_image_url ?? null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // ── Product file state ────────────────────────────────────────
  const [productFile, setProductFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState(product.file_name ?? null);
  const [existingFileKey, setExistingFileKey] = useState(product.file_key ?? null);
  const [existingFileSize, setExistingFileSize] = useState(product.file_size_bytes ?? null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Save / auto-save state ────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Slug uniqueness debounce ──────────────────────────────────
  useEffect(() => {
    if (slug === product.slug) {
      setSlugStatus("idle");
      return;
    }
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/products/slug-check?slug=${encodeURIComponent(slug)}&excludeId=${product.id}`
        );
        const { available } = await r.json();
        setSlugStatus(available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, product.slug, product.id]);

  // ── Build PATCH payload ───────────────────────────────────────
  const buildPayload = useCallback((publishOverride?: boolean) => {
    const pricePaise = isFree ? 0 : rupeesToPaise(Number(priceRupees) || 0);
    return {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || null,
      description: description || null,
      cta_text: ctaText.trim() || null,
      max_reviews_displayed: parseInt(maxReviews) || 10,
      price_paise: pricePaise,
      is_published: publishOverride !== undefined ? publishOverride : isPublished,
    };
  }, [title, slug, summary, description, ctaText, maxReviews, priceRupees, isFree, isPublished]);

  // Use a ref to hold the latest payload, avoiding stale closures in setTimeout
  const payloadRef = useRef(buildPayload(false));
  useEffect(() => {
    payloadRef.current = buildPayload(false);
  }, [buildPayload]);

  // ── Auto-save: fire 30s after last change ─────────────────────
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = payloadRef.current; // get fresh payload from ref
        await fetch(`/api/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        flashSaved();
      } catch { /* silent */ }
    }, 30_000);
  }, [product.id]); // stable identity

  useEffect(() => {
    scheduleAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, slug, summary, description, ctaText, maxReviews, priceRupees, isFree, scheduleAutoSave]);

  const flashSaved = () => {
    setShowSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 3000);
  };

  // ── Cover image dropzone ──────────────────────────────────────
  const onCoverDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDrag } =
    useDropzone({
      onDrop: onCoverDrop,
      accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
      maxFiles: 1, maxSize: 10 * 1024 * 1024,
      onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message ?? "File rejected"),
    });

  const handleCropDone = async (blob: Blob, _fileName: string) => {
    setCropOpen(false);
    setCropSrc(null);
    setUploadingCover(true);
    const toastId = toast.loading("Uploading cover…");
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("cover-images")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("cover-images").getPublicUrl(path);
      const url = data.publicUrl;
      setCoverPreview(url);
      // Immediately persist cover URL
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_url: url }),
      });
      toast.success("Cover saved", { id: toastId });
      flashSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId });
    } finally {
      setUploadingCover(false);
    }
  };

  // ── Product file dropzone ─────────────────────────────────────
  const onFileDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setProductFile(file);
    setUploadingFile(true);
    const toastId = toast.loading("Uploading file…");
    try {
      const safeName = file.name.replace(/\s+/g, "-").replace(/[^\w.\-]/g, "");
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("product-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      // Persist file info
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_key: path, file_name: file.name, file_size_bytes: file.size }),
      });
      setExistingFileName(file.name);
      setExistingFileKey(path);
      setExistingFileSize(file.size);
      setProductFile(null);
      toast.success("File uploaded", { id: toastId });
      flashSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  }, [supabase, userId, product.id]);

  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, isDragActive: isFileDrag } =
    useDropzone({
      onDrop: onFileDrop,
      maxFiles: 1, maxSize: 500 * 1024 * 1024,
      onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message ?? "File rejected"),
    });

  // ── Title → slug auto-generate ────────────────────────────────
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugCustomized) setSlug(slugify(val));
  };

  const regenerateSlug = () => {
    setSlug(slugify(title));
    setSlugCustomized(false);
  };

  // ── Main save ─────────────────────────────────────────────────
  const handleSave = async (publishOverride: boolean) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (slugStatus === "taken") { toast.error("Slug is already taken — choose another"); return; }

    setSaving(true);
    try {
      const payload = buildPayload(publishOverride);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        if (body.code === "slug_conflict") {
          toast.error("Slug conflict — choose a different URL");
          setSlugStatus("taken");
          return;
        }
        throw new Error(body.error ?? "Save failed");
      }
      setIsPublished(publishOverride);
      flashSaved();
      toast.success(publishOverride ? "Published! 🚀" : "Draft saved ✓");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle publish directly ───────────────────────────────────
  const handleTogglePublish = async () => {
    const next = !isPublished;
    setIsPublished(next); // optimistic
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      flashSaved();
      toast.success(next ? "Published ✓" : "Moved to drafts");
    } catch {
      setIsPublished(!next); // revert
      toast.error("Failed to update publish status");
    } finally {
      setPublishLoading(false);
    }
  };

  const isBusy = saving || uploadingCover || uploadingFile;

  const slugIndicator = () => {
    if (slug === product.slug) return null;
    if (slugStatus === "checking") return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
    if (slugStatus === "available") return <Check className="w-3 h-3 text-green-500" />;
    if (slugStatus === "taken") return <AlertCircle className="w-3 h-3 text-destructive" />;
    return null;
  };

  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* Auto-save "Saved" indicator */}
      <div
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-xs font-medium rounded-full shadow-lg transition-all duration-300 ${
          showSaved ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <Check className="w-3.5 h-3.5 text-green-500" />
        Saved
      </div>

      {/* Image crop modal */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspectRatio={16 / 9}
          open={cropOpen}
          onCrop={handleCropDone}
          onClose={() => { setCropOpen(false); setCropSrc(null); }}
          title="Crop cover image (16:9)"
        />
      )}

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit product</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autosaves every 30 seconds · Changes are immediate
            </p>
          </div>
          <div className="flex items-center gap-2">
            {storeSlug && product.slug && isPublished && (
              <a
                href={`/${storeSlug}/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Eye className="w-3 h-3" />
                Preview
              </a>
            )}
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT panel: content (60%) ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Title */}
            <div>
              <Input
                id="title"
                autoFocus
                className="text-2xl font-bold h-14 px-4 border-2 border-transparent focus:border-primary/30 bg-card"
                placeholder="Product title…"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={isBusy}
              />
            </div>

            {/* Slug */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center">
                <span className="inline-flex items-center px-3 h-9 rounded-l-lg border border-r-0 border-input bg-muted text-muted-foreground text-xs shrink-0 whitespace-nowrap">
                  /{storeSlug ?? "store"}/
                </span>
                <div className="relative flex-1">
                  <Input
                    className="rounded-l-none pr-7 text-sm h-9"
                    placeholder="product-url-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                      setSlugCustomized(true);
                    }}
                    disabled={isBusy}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugIndicator()}
                  </div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-9 px-2 shrink-0" onClick={regenerateSlug} disabled={isBusy}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
            {slugStatus === "taken" && (
              <p className="text-xs text-destructive -mt-3">This URL is taken — choose another</p>
            )}

            {/* Summary */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Short summary · <span className="normal-case">{summary.length}/160</span>
              </Label>
              <Textarea
                placeholder="One-line pitch for your store grid…"
                rows={2}
                maxLength={160}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isBusy}
                className="resize-none text-sm"
              />
            </div>

            {/* Rich text description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Full description
              </Label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                userId={userId}
                placeholder="Tell buyers what they get, what problems this solves, and what's included. Use H1–H3, lists, images!"
                disabled={isBusy}
              />
            </div>
          </div>

          {/* ── RIGHT panel: settings (40%) ── */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* ── Actions card ── */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Status</span>
                  <button
                    type="button"
                    onClick={handleTogglePublish}
                    disabled={publishLoading || isBusy}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      isPublished
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {publishLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isPublished ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {isPublished ? "Live" : "Draft"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleSave(false)}
                    disabled={isBusy}
                  >
                    {saving && !isPublished ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleSave(true)}
                    disabled={isBusy}
                  >
                    {saving && isPublished ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                    Publish
                  </Button>
                </div>
              </div>

              {/* ── Cover image card ── */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cover image · 16:9
                </Label>
                <div
                  {...getCoverRootProps()}
                  className={`relative rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                    isCoverDrag ? "border-primary bg-accent/20" : "border-border hover:border-primary/40"
                  } ${uploadingCover ? "animate-pulse" : ""}`}
                >
                  <input {...getCoverInputProps()} />
                  {coverPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="Cover" className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <p className="text-white text-xs font-medium">Click to change · Will be cropped 16:9</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverPreview(null); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                      {uploadingCover ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <ImagePlus className="w-6 h-6" />
                      )}
                      <p className="text-xs">{uploadingCover ? "Uploading…" : "Drop or click — auto-crops to 16:9"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Pricing & CTA card ── */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pricing & Call to Action</Label>

                <div className="space-y-1.5 pb-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Button Text (Optional)</span>
                  <Input 
                    placeholder="e.g. Buy Now, Get Access" 
                    value={ctaText} 
                    onChange={(e) => setCtaText(e.target.value)}
                    className="h-8 text-sm placeholder:text-muted-foreground/50"
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-1.5 pb-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Reviews to Display</span>
                    <span className="text-xs font-semibold text-foreground">{parseInt(maxReviews) || 10}</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    className="h-8 text-sm"
                    placeholder="10"
                    value={maxReviews}
                    onChange={(e) => setMaxReviews(e.target.value)}
                    disabled={isBusy}
                  />
                  <p className="text-[11px] text-muted-foreground">Number of reviews shown on your product page (1–50)</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFree(!isFree)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isFree ? "bg-blue-50 border-blue-200 text-blue-700" : "border-border text-muted-foreground"
                    }`}
                  >
                    {isFree ? "Free ✓" : "Set as free"}
                  </button>
                </div>

                {!isFree && (
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="pl-8 h-9 text-sm"
                      placeholder="499"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                )}

                {!isFree && priceRupees && !isNaN(Number(priceRupees)) && Number(priceRupees) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatINR(rupeesToPaise(Number(priceRupees)))} · incl. 18% GST
                  </p>
                )}
              </div>

              {/* ── Product file card ── */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product file
                </Label>
                <div
                  {...getFileRootProps()}
                  className={`rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    isFileDrag ? "border-primary bg-accent/20" : "border-border hover:border-primary/40"
                  } ${uploadingFile ? "animate-pulse" : ""}`}
                >
                  <input {...getFileInputProps()} />
                  {existingFileKey ? (
                    <div className="flex items-center gap-2.5 p-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileUp className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{existingFileName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {existingFileSize ? formatFileSize(existingFileSize) : ""} · {uploadingFile ? "Replacing…" : "Click to replace"}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-5 gap-1 text-muted-foreground">
                      {uploadingFile ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                      <p className="text-xs">{uploadingFile ? "Uploading…" : "PDF, ZIP, MP4 · max 500 MB"}</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  🔒 Token-gated — buyers get a 60-second signed URL after payment
                </p>
              </div>

              {/* ── Danger zone ── */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-xs font-medium text-destructive mb-2">Danger Zone</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={async () => {
                    if (!confirm("Delete this product? This cannot be undone.")) return;
                    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
                    if (res.ok) {
                      toast.success("Product deleted");
                      router.push("/dashboard/products");
                      router.refresh();
                    } else {
                      toast.error("Delete failed");
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Delete product
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
