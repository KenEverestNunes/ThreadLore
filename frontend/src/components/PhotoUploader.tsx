import React, { useRef } from "react";
import { AlertCircle, HelpCircle, Upload } from "lucide-react";
import { useWeave } from "../context/WeaveContext";

interface PhotoUploaderProps {
  onOpenGuidance: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onOpenGuidance }) => {
  const { handleFileSelect, error } = useWeave();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Helper to load real macro photograph samples
  const loadRealPhotoSample = async (filename: string) => {
    try {
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load sample image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      handleFileSelect(file);
    } catch (err) {
      console.error("Error loading sample swatch:", err);
    }
  };

  // Helper to generate quick synthetic swatch for testing
  const loadSampleSwatch = (type: "plain" | "twill") => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#A8A29E";
    ctx.fillRect(0, 0, 400, 400);

    const spacing = 20;
    for (let y = 0; y < 400; y += spacing) {
      for (let x = 0; x < 400; x += spacing) {
        let isWarp = false;
        if (type === "plain") {
          isWarp = (Math.floor(x / spacing) + Math.floor(y / spacing)) % 2 === 0;
        } else {
          isWarp = ((Math.floor(x / spacing) - Math.floor(y / spacing)) % 4 + 4) % 4 < 2;
        }

        ctx.fillStyle = isWarp ? "#334155" : "#E2E8F0";
        ctx.fillRect(x, y, spacing - 1, spacing - 1);
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${type}_synthetic_swatch_sample.jpg`, { type: "image/jpeg" });
        handleFileSelect(file);
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full text-center space-y-3 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Preserve the weave, not just the photograph.
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Convert macro textile photographs into mathematically verified, 4-shaft loom drafts and
          interoperable WIF 1.1 specifications.
        </p>
      </div>

      {/* Error alert banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex w-full max-w-xl items-start space-x-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 shadow-sm"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block">File Upload Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Drag & drop upload area */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-xl cursor-pointer rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-10 text-center transition hover:border-zinc-500 hover:bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-500 shadow-sm"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 mb-4 shadow-sm">
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Upload Textile Swatch Photo
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Drag and drop a macro photograph, or click to browse (JPEG, PNG, WebP up to 2MB).
        </p>

        <div className="mt-6 flex items-center justify-center space-x-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Min 100×100 px
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            1:1 Square Swatch
          </span>
        </div>
      </div>

      {/* Helper actions & sample swatches */}
      <div className="mt-6 flex flex-col items-center space-y-3 text-xs">
        <button
          onClick={onOpenGuidance}
          className="flex items-center space-x-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Macro Photography Guidelines</span>
        </button>

        {/* Real macro fabric samples */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-zinc-500 font-medium">Real macro samples:</span>
          <button
            type="button"
            onClick={() => loadRealPhotoSample("tartan_2_2_twill.jpg")}
            className="flex items-center space-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 font-medium shadow-sm transition"
          >
            <span>📷 Real Tartan Plaid (2/2 Twill)</span>
          </button>
          <button
            type="button"
            onClick={() => loadRealPhotoSample("denim_3_1_twill.jpg")}
            className="flex items-center space-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 font-medium shadow-sm transition"
          >
            <span>📷 Real Denim (3/1 Twill)</span>
          </button>
        </div>

        {/* Synthetic procedural samples */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500">
          <span>Synthetic / simulated:</span>
          <button
            type="button"
            onClick={() => loadSampleSwatch("plain")}
            className="rounded-md border border-zinc-200 px-2 py-0.5 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Synthetic Plain Linen (1/1)
          </button>
          <button
            type="button"
            onClick={() => loadSampleSwatch("twill")}
            className="rounded-md border border-zinc-200 px-2 py-0.5 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Simulated 2/2 Twill (Harris Tweed)
          </button>
        </div>
      </div>
    </div>
  );
};
