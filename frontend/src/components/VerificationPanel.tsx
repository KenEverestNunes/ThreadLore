import React from "react";
import { AlertCircle, ChevronRight, Cpu, Loader2, Sparkles } from "lucide-react";
import { useWeave } from "../context/WeaveContext";
import { CanvasOverlay } from "./CanvasOverlay";
import { MasterTileEditor } from "./MasterTileEditor";
import { ColorPickerRow } from "./ColorPickerRow";
import { ProvenanceForm } from "./ProvenanceForm";

export const VerificationPanel: React.FC = () => {
  const {
    isAnalyzing,
    analysisResult,
    isCompiling,
    triggerCompile,
    error,
  } = useWeave();

  return (
    <div className="space-y-6">
      {/* Top Banner: Status and AI suggestion summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <span>Phase 2: Human-in-the-Loop Weave Verification</span>
                {analysisResult && (
                  <span className="text-xs font-normal text-zinc-500">
                    • Status: {analysisResult.status}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAnalyzing
                  ? "Analyzing optical thread density and reconstructing weave interlacing..."
                  : analysisResult?.technical_description ||
                    "Verify the suggested pattern against your photograph or adjust the master tile cells."}
              </p>
            </div>
          </div>

          <button
            onClick={triggerCompile}
            disabled={isCompiling || isAnalyzing}
            className="flex items-center space-x-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
          >
            {isCompiling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Factoring Loom Draft...</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                <span>Compile 4-Shaft Loom Draft</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Diagnostic error / warning */}
        {error && (
          <div className="mt-3 flex items-start space-x-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left = Canvas Overlay, Right = Master Tile Editor & Color Pickers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Canvas Overlay */}
        <div className="space-y-6">
          <CanvasOverlay />
          <ProvenanceForm />
        </div>

        {/* Right Column: Master Tile Matrix & Yarn Palettes */}
        <div className="space-y-6">
          <MasterTileEditor />
          <ColorPickerRow />
        </div>
      </div>
    </div>
  );
};
