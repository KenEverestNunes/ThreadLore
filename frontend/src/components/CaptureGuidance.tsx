import React from "react";
import { Camera, Layers, Lightbulb, ShieldCheck, X } from "lucide-react";

interface CaptureGuidanceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaptureGuidance: React.FC<CaptureGuidanceProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Camera className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Macro Swatch Capture Guidelines
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Preserve the weave structure with high-contrast optical clarity.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex items-start space-x-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/30">
            <Lightbulb className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Raking Directional Light</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Position light at a low side angle (~30°) across the fabric to cast micro-shadows beneath yarn crowns. Avoid direct phone flash wash-outs.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/30">
            <Layers className="h-5 w-5 shrink-0 text-indigo-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Perpendicular & Flat Alignment</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Keep the fabric tensioned flat and shoot strictly perpendicular (90°) to minimize perspective distortion.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/30">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">AI-Assisted, Human-Verified</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Automated optical analysis suggests the most likely weave family based on float physics, while you inspect and confirm the pattern with the interactive overlay.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  );
};
