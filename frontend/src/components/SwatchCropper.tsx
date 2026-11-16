import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useWeave } from "../context/WeaveContext";

type ResizeCorner = "nw" | "ne" | "sw" | "se" | null;

export const SwatchCropper: React.FC = () => {
  const { rawImage, handleCropComplete, resetWorkflow } = useWeave();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number }>({
    width: 400,
    height: 400,
  });
  const [cropCenter, setCropCenter] = useState({ x: 0.5, y: 0.5 }); // Normalized [0, 1]
  const [cropScale, setCropScale] = useState(0.5); // Fractional size relative to min(w, h)
  const [isDragging, setIsDragging] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<ResizeCorner>(null);

  const dragStartRef = useRef({ x: 0, y: 0, initCenterX: 0.5, initCenterY: 0.5 });
  const resizeStartRef = useRef({ x: 0, y: 0, initScale: 0.5 });

  // Preload and verify image dimensions immediately upon receiving rawImage
  useEffect(() => {
    setCropCenter({ x: 0.5, y: 0.5 });
    setCropScale(0.5);

    if (!rawImage) return;

    // Check if DOM image is already loaded
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      setImgDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }

    // In-memory decode guarantee (prevents missed synthetic onLoad in cached/dataURL scenarios)
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImgDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };
    img.src = rawImage;
  }, [rawImage]);

  const onImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      if (naturalWidth > 0 && naturalHeight > 0) {
        setImgDimensions({ width: naturalWidth, height: naturalHeight });
      }
    }
  };

  // Drag box repositioning
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initCenterX: cropCenter.x,
      initCenterY: cropCenter.y,
    };
  };

  // Corner resize start
  const handleResizeMouseDown = (e: React.MouseEvent, corner: ResizeCorner) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCorner(corner);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initScale: cropScale,
    };
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? -0.05 : 0.05; // scrolling up zooms in (tighter crop)
    setCropScale((prev) => {
      const next = Math.max(0.15, Math.min(0.95, prev + zoomDelta));
      return Math.round(next * 100) / 100;
    });
  };

  // Unified mouse move handler for dragging and resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const minDim = Math.min(imgDimensions.width, imgDimensions.height);
      const halfW = (minDim * cropScale) / imgDimensions.width / 2;
      const halfH = (minDim * cropScale) / imgDimensions.height / 2;

      if (isDragging) {
        const deltaX = (e.clientX - dragStartRef.current.x) / rect.width;
        const deltaY = (e.clientY - dragStartRef.current.y) / rect.height;

        const newX = Math.max(halfW, Math.min(1 - halfW, dragStartRef.current.initCenterX + deltaX));
        const newY = Math.max(halfH, Math.min(1 - halfH, dragStartRef.current.initCenterY + deltaY));

        setCropCenter({ x: newX, y: newY });
      } else if (resizingCorner) {
        const deltaX = (e.clientX - resizeStartRef.current.x) / rect.width;
        const deltaY = (e.clientY - resizeStartRef.current.y) / rect.height;

        let scaleDelta = 0;
        if (resizingCorner === "se") {
          scaleDelta = Math.max(deltaX, deltaY);
        } else if (resizingCorner === "nw") {
          scaleDelta = Math.max(-deltaX, -deltaY);
        } else if (resizingCorner === "ne") {
          scaleDelta = Math.max(deltaX, -deltaY);
        } else if (resizingCorner === "sw") {
          scaleDelta = Math.max(-deltaX, deltaY);
        }

        const newScale = Math.max(0.15, Math.min(0.95, resizeStartRef.current.initScale + scaleDelta * 1.5));
        setCropScale(Math.round(newScale * 100) / 100);
      }
    },
    [isDragging, resizingCorner, cropScale, imgDimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizingCorner(null);
  }, []);

  useEffect(() => {
    if (isDragging || resizingCorner) {
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
  }, [isDragging, resizingCorner, handleMouseMove, handleMouseUp]);

  // Keyboard navigation for precision pixel adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 0.05 : 0.01;
        setCropCenter((prev) => {
          let nx = prev.x;
          let ny = prev.y;
          if (e.key === "ArrowLeft") nx -= step;
          if (e.key === "ArrowRight") nx += step;
          if (e.key === "ArrowUp") ny -= step;
          if (e.key === "ArrowDown") ny += step;

          const minDim = Math.min(imgDimensions.width, imgDimensions.height);
          const halfW = (minDim * cropScale) / imgDimensions.width / 2;
          const halfH = (minDim * cropScale) / imgDimensions.height / 2;

          return {
            x: Math.max(halfW, Math.min(1 - halfW, nx)),
            y: Math.max(halfH, Math.min(1 - halfH, ny)),
          };
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cropScale, imgDimensions]);

  // Compute exact geometry ensuring a true 1:1 square on screen
  const minDim = Math.min(imgDimensions.width, imgDimensions.height);
  const cropPixelSize = minDim * cropScale;
  const widthPercent = (cropPixelSize / imgDimensions.width) * 100;
  const heightPercent = (cropPixelSize / imgDimensions.height) * 100;
  const halfW = widthPercent / 2;
  const halfH = heightPercent / 2;

  const clampedCenterX = Math.max(halfW / 100, Math.min(1 - halfW / 100, cropCenter.x));
  const clampedCenterY = Math.max(halfH / 100, Math.min(1 - halfH / 100, cropCenter.y));

  const leftPercent = clampedCenterX * 100 - halfW;
  const topPercent = clampedCenterY * 100 - halfH;

  const performCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const naturalW = img.naturalWidth || imgDimensions.width;
    const naturalH = img.naturalHeight || imgDimensions.height;

    const natMinDim = Math.min(naturalW, naturalH);
    const pixelCrop = Math.round(natMinDim * cropScale);

    const pixelCenterX = Math.round(naturalW * clampedCenterX);
    const pixelCenterY = Math.round(naturalH * clampedCenterY);

    let sx = Math.round(pixelCenterX - pixelCrop / 2);
    let sy = Math.round(pixelCenterY - pixelCrop / 2);

    sx = Math.max(0, Math.min(naturalW - pixelCrop, sx));
    sy = Math.max(0, Math.min(naturalH - pixelCrop, sy));

    const canvas = document.createElement("canvas");
    const outputDim = Math.min(800, pixelCrop);
    canvas.width = outputDim;
    canvas.height = outputDim;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, pixelCrop, pixelCrop, 0, 0, outputDim, outputDim);

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

  const resetCrop = () => {
    setCropCenter({ x: 0.5, y: 0.5 });
    setCropScale(0.5);
  };

  if (!rawImage) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Square Macro Swatch Crop
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Position the 1:1 square crop box directly over the clearest section of warp and weft yarns.
        </p>
      </div>

      {/* Main Image Viewport & Overlay */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative inline-block max-h-[62vh] max-w-full overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-950 shadow-2xl dark:border-zinc-800"
      >
        <img
          ref={imageRef}
          src={rawImage}
          alt="Raw Swatch"
          onLoad={onImageLoad}
          className="block max-h-[58vh] max-w-full w-auto object-contain select-none pointer-events-none"
        />

        {/* 1:1 Macro Square Crop Box (always rendered when image is present) */}
        <div
          onMouseDown={handleBoxMouseDown}
          style={{
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
          }}
          className="absolute cursor-move border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] hover:border-amber-300 transition-colors"
        >
          {/* Rule of thirds grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-amber-300" />
            <div className="border-r border-b border-amber-300" />
            <div className="border-b border-amber-300" />
            <div className="border-r border-b border-amber-300" />
            <div className="border-r border-b border-amber-300" />
            <div className="border-b border-amber-300" />
            <div className="border-r border-amber-300" />
            <div className="border-r border-amber-300" />
            <div />
          </div>

          {/* Floating badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center space-x-1 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur shadow-sm pointer-events-none">
            <Maximize2 className="h-2.5 w-2.5" />
            <span>1:1 Macro • {Math.round(cropScale * 100)}%</span>
          </div>

          {/* Corner Resize Handles */}
          {/* Top-Left */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
            title="Drag to resize crop box"
            className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full border-2 border-amber-500 bg-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Top-Right */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
            title="Drag to resize crop box"
            className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-amber-500 bg-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Bottom-Left */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
            title="Drag to resize crop box"
            className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-full border-2 border-amber-500 bg-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Bottom-Right */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
            title="Drag to resize crop box"
            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-amber-500 bg-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
        </div>
      </div>

      {/* Helpful Hint */}
      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
        Drag box to reposition • Scroll mouse wheel or use controls below to zoom • Drag corner dots to resize
      </p>

      {/* Interactive Controls Row */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Zoom In & Out Controls */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto flex-1">
          <button
            onClick={() => setCropScale((prev) => Math.min(0.95, Math.round((prev + 0.05) * 100) / 100))}
            title="Zoom Out (Broader Swatch Area)"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2 flex-1">
            <input
              type="range"
              min="0.15"
              max="0.95"
              step="0.05"
              value={cropScale}
              onChange={(e) => setCropScale(parseFloat(e.target.value))}
              className="w-full accent-amber-500 dark:accent-amber-400 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setCropScale((prev) => Math.max(0.15, Math.round((prev - 0.05) * 100) / 100))}
            title="Zoom In (Tighter Macro Focus)"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <span className="min-w-[42px] text-center text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
            {Math.round(cropScale * 100)}%
          </span>
        </div>

        {/* Quick Presets & Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="hidden md:flex items-center space-x-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-1">
            <button
              onClick={() => setCropScale(0.3)}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                cropScale === 0.3
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              30% Tight
            </button>
            <button
              onClick={() => setCropScale(0.5)}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                cropScale === 0.5
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              50% Std
            </button>
            <button
              onClick={() => setCropScale(0.75)}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                cropScale === 0.75
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              75% Wide
            </button>
          </div>

          <button
            onClick={resetWorkflow}
            title="Upload a different photo"
            className="flex items-center space-x-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Change Photo</span>
          </button>

          <button
            onClick={resetCrop}
            title="Reset crop position and zoom to center"
            className="flex items-center space-x-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Crop</span>
          </button>

          <button
            onClick={performCrop}
            className="flex items-center space-x-1.5 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 active:bg-amber-600 shadow-sm transition"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Confirm & Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
