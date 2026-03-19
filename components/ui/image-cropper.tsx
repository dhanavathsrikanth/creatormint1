"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageCropperProps {
  /** Raw data URL or blob URL of the image to crop */
  src: string;
  /** Fixed aspect ratio (e.g. 16/9). Omit for free-form crop */
  aspectRatio?: number;
  /** Called with the cropped Blob on confirm */
  onCrop: (blob: Blob, fileName: string) => Promise<void>;
  onClose: () => void;
  open: boolean;
  title?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(img: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;

  ctx.drawImage(
    img,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0, 0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/jpeg",
      0.92
    );
  });
}

export function ImageCropper({
  src, aspectRatio, onCrop, onClose, open, title = "Crop image",
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [fileName, setFileName] = useState("cropped-image.jpg");

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;

    // Extract filename from src
    const urlParts = src.split("/").pop()?.split("?")[0];
    if (urlParts) setFileName(urlParts.replace(/\.[^.]+$/, "") + ".jpg");

    if (aspectRatio) {
      setCrop(centerAspectCrop(width, height, aspectRatio));
    } else {
      // Default: cover 80% of image
      setCrop(centerCrop({ unit: "%", width: 80, height: 80 }, width, height));
    }
    void naturalWidth; void naturalHeight;
  }, [src, aspectRatio]);

  const handleReset = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    if (aspectRatio) {
      setCrop(centerAspectCrop(width, height, aspectRatio));
    } else {
      setCrop(centerCrop({ unit: "%", width: 80, height: 80 }, width, height));
    }
    setCompletedCrop(undefined);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      await onCrop(blob, fileName);
    } finally {
      setIsCropping(false);
    }
  };

  // Reset state when dialog opens with new src
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open, src]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          {aspectRatio && (
            <p className="text-xs text-muted-foreground">
              Fixed {aspectRatio === 16 / 9 ? "16:9" : aspectRatio.toFixed(2) + ":1"} aspect ratio
            </p>
          )}
          {!aspectRatio && (
            <p className="text-xs text-muted-foreground">
              Drag to select any crop region
            </p>
          )}
        </DialogHeader>

        <div className="relative w-full flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden max-h-[60vh]">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            keepSelection
            className="max-h-[60vh] w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              className="max-h-[60vh] max-w-full object-contain"
              onLoad={onImageLoad}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {completedCrop && (
          <p className="text-xs text-center text-muted-foreground">
            Crop area: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px
          </p>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={isCropping || !completedCrop}
            >
              {isCropping ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Cropping…</>
              ) : (
                <>
                  <ZoomIn className="w-3.5 h-3.5 mr-1.5" />
                  Crop & Use
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
