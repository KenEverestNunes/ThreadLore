import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, RotateCcw, ZoomIn } from "lucide-react";
import { useWeave } from "../context/WeaveContext";

export const SwatchCropper: React.FC = () => {
  const { rawImage, handleCropComplete, resetWorkflow } = useWeave();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropCenter, setCropCenter] = useState({ x: 0.5, y: 0.5 }); // Normalized [0, 1]
  const [cropScale, setCropScale] = useState(0.5); // Fractional size relative to min(w, h)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initCenterX: 0.5, initCenterY: 0.5 });

  useEffect(() => {
    setImageLoaded(false);
    setCropCenter({ x: 0.5, y: 0.5 });
    setCropScale(0.5);
  }, [rawImage]);

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initCenterX: cropCenter.x,
      initCenterY: cropCenter.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - dragStartRef.current.x) / rect.width;
      const deltaY = (e.clientY - dragStartRef.current.y) / rect.height;

      const halfSize = cropScale / 2;
      const newX = Math.max(halfSize, Math.min(1 - halfSize, dragStartRef.current.initCenterX + deltaX));
      const newY = Math.max(halfSize, Math.min(1 - halfSize, dragStartRef.current.initCenterY + deltaY));

      setCropCenter({ x: newX, y: newY });
    },
    [isDragging, cropScale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const performCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const minDim = Math.min(naturalW, naturalH);
    const pixelCropSize = Math.round(minDim * cropScale);

    const pixelCenterX = Math.round(naturalW * cropCenter.x);
    const pixelCenterY = Math.round(naturalH * cropCenter.y);

    let sx = Math.round(pixelCenterX - pixelCropSize / 2);
    let sy = Math.round(pixelCenterY - pixelCropSize / 2);

    sx = Math.max(0, Math.min(naturalW - pixelCropSize, sx));
    sy = Math.max(0, Math.min(naturalH - pixelCropSize, sy));

    const canvas = document.createElement("canvas");
    const outputDim = Math.min(800, pixelCropSize);
    canvas.width = outputDim;
    canvas.height = outputDim;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, pixelCropSize, pixelCropSize, 0, 0, outputDim, outputDim);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          handleCropComplete(blob, dataUrl);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  if (!rawImage) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Square Macro Swatch Crop
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Position the 1:1 square crop box directly over the clearest section of warp and weft yarns.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative max-h-[65vh] max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-inner dark:border-zinc-800"
      >
        <img
          ref={imageRef}
          src={rawImage}
          alt="Raw Swatch"
          onLoad={onImageLoad}
          className="max-h-[60vh] max-w-full object-contain select-none pointer-events-none"
        />

        {imageLoaded && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              left: `${(cropCenter.x - cropScale / 2) * 100}%`,
              top: `${(cropCenter.y - cropScale / 2) * 100}%`,
              width: `${cropScale * 100}%`,
              height: `${cropScale * 100}%`,
            }}
            className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] hover:border-amber-400 transition-colors"
          >
            {/* Grid overlay lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            <div className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
              1:1 Macro
            </div>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-2 flex-1 min-w-[180px]">
          <ZoomIn className="h-4 w-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Crop Size</span>
          <input
            type="range"
            min="0.2"
            max="0.9"
            step="0.05"
            value={cropScale}
            onChange={(e) => setCropScale(parseFloat(e.target.value))}
            className="w-full accent-zinc-900 dark:accent-zinc-100"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetWorkflow}
            className="flex items-center space-x-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={performCrop}
            className="flex items-center space-x-1 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Confirm & Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
