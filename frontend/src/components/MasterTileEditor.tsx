import React from "react";
import { Grid, Sparkles } from "lucide-react";
import { useWeave } from "../context/WeaveContext";
import { CANONICAL_PRESETS, WeaveFamily } from "../types/weave";

export const MasterTileEditor: React.FC = () => {
  const {
    activePreset,
    selectPreset,
    repeatSize,
    setCustomRepeatSize,
    masterMatrix,
    toggleMatrixCell,
    warpColor,
    weftColor,
    analysisResult,
  } = useWeave();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Grid className="h-4 w-4 text-zinc-500" />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interactive Master Tile Editor ({repeatSize}×{repeatSize})
          </h4>
        </div>

        {/* Gemini suggestion pill if available */}
        {analysisResult && (
          <div className="flex items-center space-x-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Sparkles className="h-3 w-3" />
            <span>AI Suggestion: {CANONICAL_PRESETS[analysisResult.weave_family]?.label || analysisResult.weave_family}</span>
            <span className="opacity-60">({Math.round(analysisResult.confidence * 100)}% heuristic)</span>
          </div>
        )}
      </div>

      {/* Preset selector dropdown */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Canonical Weave Preset
          </label>
          <select
            value={activePreset}
            onChange={(e) => selectPreset(e.target.value as WeaveFamily)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {Object.entries(CANONICAL_PRESETS).map(([id, info]) => (
              <option key={id} value={id}>
                {info.label} ({info.repeatSize}×{info.repeatSize})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Tile Repeat Size (N×N)
          </label>
          <div className="flex space-x-2">
            {[2, 3, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCustomRepeatSize(size)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                  repeatSize === size
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Matrix Grid */}
      <div className="flex flex-col items-center justify-center py-2">
        <div
          className="grid gap-1.5 p-2 rounded-xl border border-zinc-200 bg-zinc-50 shadow-inner dark:border-zinc-800 dark:bg-zinc-950/40"
          style={{
            gridTemplateColumns: `repeat(${repeatSize}, minmax(0, 1fr))`,
            width: `${repeatSize * 56}px`,
          }}
        >
          {masterMatrix.map((row, rIdx) =>
            row.slice(0, repeatSize).map((val, cIdx) => {
              const isWarpOver = val === 1;
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  onClick={() => toggleMatrixCell(rIdx, cIdx)}
                  style={{
                    backgroundColor: isWarpOver ? warpColor : weftColor,
                  }}
                  className={`h-12 w-12 rounded-lg border-2 transition-all flex flex-col items-center justify-center font-mono text-xs font-bold shadow-sm ${
                    isWarpOver
                      ? "border-white/50 text-white"
                      : "border-black/20 text-zinc-800"
                  } hover:scale-105 active:scale-95`}
                  title={`Pick ${rIdx + 1}, End ${cIdx + 1}: ${isWarpOver ? "Warp Over" : "Weft Over"}`}
                >
                  <span className="text-[10px] opacity-75">{isWarpOver ? "W" : "F"}</span>
                  <span>{val}</span>
                </button>
              );
            })
          )}
        </div>

        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Click any cell to toggle yarn interlacing: <strong className="text-zinc-700 dark:text-zinc-300">1 (W = Warp Over)</strong> vs{" "}
          <strong className="text-zinc-700 dark:text-zinc-300">0 (F = Weft Over)</strong>.
        </p>
      </div>
    </div>
  );
};
