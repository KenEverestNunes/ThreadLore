import React, { useRef, useEffect, useState, useCallback } from "react";
import { Eye, Move, RotateCcw, Sliders } from "lucide-react";
import { useWeave } from "../context/WeaveContext";

export const CanvasOverlay: React.FC = () => {
  const {
    croppedImageUrl,
    masterMatrix,
    repeatSize,
    warpColor,
    weftColor,
    analysisResult,
  } = useWeave();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Optical Alignment Controls
  const [opacity, setOpacity] = useState(0.45);
  const [spacingX, setSpacingX] = useState<number>(() => analysisResult?.dx_px || 22.0);
  const [spacingY, setSpacingY] = useState<number>(() => analysisResult?.dy_px || 22.0);
  const [lockDensity, setLockDensity] = useState(true);
  const [fineAngle, setFineAngle] = useState(0.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Mouse drag tracking for phase offset alignment
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, initOffX: 0, initOffY: 0 });

  // Update spacing when analysisResult changes
  useEffect(() => {
    if (analysisResult?.spacing_detected) {
      if (analysisResult.dx_px) setSpacingX(analysisResult.dx_px);
      if (analysisResult.dy_px) setSpacingY(analysisResult.dy_px);
    }
  }, [analysisResult]);

  // Load cropped image into Image object
  useEffect(() => {
    if (!croppedImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = croppedImageUrl;
    img.onload = () => {
      imageObjRef.current = img;
      renderCanvas();
    };
  }, [croppedImageUrl]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw base photo
    ctx.drawImage(img, 0, 0, w, h);

    // 2. Draw live-tiled master pattern overlay
    if (opacity > 0 && repeatSize > 0) {
      ctx.save();

      // Apply fine rotation around center if set
      if (Math.abs(fineAngle) > 0.01) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate((fineAngle * Math.PI) / 180);
        ctx.translate(-w / 2, -h / 2);
      }

      const dx = Math.max(4, spacingX);
      const dy = Math.max(4, spacingY);
      const tileWidthPx = dx * repeatSize;
      const tileHeightPx = dy * repeatSize;

      // Wrap phase offsets
      const startX = (offsetX % tileWidthPx) - tileWidthPx;
      const startY = (offsetY % tileHeightPx) - tileHeightPx;

      ctx.globalAlpha = opacity;

      for (let y = startY; y < h + tileHeightPx; y += dy) {
        // Find which row in the master tile this pick belongs to
        const rowInTile = Math.floor(((y - offsetY) / dy) % repeatSize + repeatSize) % repeatSize;

        for (let x = startX; x < w + tileWidthPx; x += dx) {
          // Find which column in the master tile this end belongs to
          const colInTile = Math.floor(((x - offsetX) / dx) % repeatSize + repeatSize) % repeatSize;

          const isWarpOver =
            rowInTile < masterMatrix.length &&
            colInTile < (masterMatrix[rowInTile]?.length || 0) &&
            masterMatrix[rowInTile][colInTile] === 1;

          ctx.fillStyle = isWarpOver ? warpColor : weftColor;
          ctx.fillRect(x, y, dx - 1, dy - 1);
        }
      }

      // Draw subtle grid lines
      ctx.globalAlpha = Math.min(0.6, opacity + 0.1);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;

      for (let x = startX; x < w + tileWidthPx; x += dx) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = startY; y < h + tileHeightPx; y += dy) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [
    croppedImageUrl,
    masterMatrix,
    repeatSize,
    warpColor,
    weftColor,
    opacity,
    spacingX,
    spacingY,
    fineAngle,
    offsetX,
    offsetY,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initOffX: offsetX,
      initOffY: offsetY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const deltaX = e.clientX - panStartRef.current.x;
    const deltaY = e.clientY - panStartRef.current.y;
    setOffsetX(panStartRef.current.initOffX + deltaX);
    setOffsetY(panStartRef.current.initOffY + deltaY);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetAlignment = () => {
    setOffsetX(0);
    setOffsetY(0);
    setFineAngle(0.0);
    if (analysisResult?.spacing_detected) {
      if (analysisResult.dx_px) setSpacingX(analysisResult.dx_px);
      if (analysisResult.dy_px) setSpacingY(analysisResult.dy_px);
    } else {
      setSpacingX(22.0);
      setSpacingY(22.0);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-zinc-500" />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interactive Photo & Weave Overlay
          </h4>
        </div>

        <button
          onClick={resetAlignment}
          className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          title="Reset grid offsets and spacing"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Alignment</span>
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative flex justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-inner dark:border-zinc-800">
        <canvas
          ref={canvasRef}
          width={450}
          height={450}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`h-[400px] w-[400px] max-w-full select-none ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
        />

        <div className="absolute top-2 left-2 rounded-md bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm flex items-center space-x-1.5">
          <Move className="h-3 w-3" />
          <span>Drag canvas to align grid phase with yarn crossings</span>
        </div>
      </div>

      {/* Alignment Sliders */}
      <div className="mt-4 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs">
        <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-medium">
          <span className="flex items-center space-x-1.5">
            <Sliders className="h-3.5 w-3.5 text-zinc-500" />
            <span>Overlay Transparency</span>
          </span>
          <span>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />

        {/* Thread Spacing Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
              <span>Δx (Warp Spacing)</span>
              <span>{spacingX.toFixed(1)} px</span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              step="0.5"
              value={spacingX}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSpacingX(val);
                if (lockDensity) setSpacingY(val);
              }}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          <div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
              <span>Δy (Weft Spacing)</span>
              <span>{spacingY.toFixed(1)} px</span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              step="0.5"
              value={spacingY}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSpacingY(val);
                if (lockDensity) setSpacingX(val);
              }}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center space-x-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={lockDensity}
              onChange={(e) => setLockDensity(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900"
            />
            <span>Lock Square Aspect (Δx = Δy)</span>
          </label>

          <span className="text-[11px] font-mono text-zinc-500">
            Phase Offset: ({offsetX}px, {offsetY}px)
          </span>
        </div>
      </div>
    </div>
  );
};
