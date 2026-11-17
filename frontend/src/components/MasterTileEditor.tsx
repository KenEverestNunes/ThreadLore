import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Grid, Sparkles } from "lucide-react";
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

  const validation = useMemo(() => {
    const matrix = masterMatrix.slice(0, repeatSize).map((row) => row.slice(0, repeatSize));
    const h = matrix.length;
    const w = matrix[0]?.length || 0;
    const warnings: string[] = [];
    const invalidRows: number[] = [];
    const invalidCols: number[] = [];

    if (h === 0 || w === 0) {
      return { isValid: false, warnings: ["Matrix is empty."], invalidRows: [], invalidCols: [] };
    }

    // 1. Uniform rows
    for (let r = 0; r < h; r++) {
      const row = matrix[r];
      if (row.every((cell) => cell === 0)) {
        warnings.push(`Pick (Row) ${r + 1} is entirely unraised (all 0s). Weft yarn will float unbound.`);
        invalidRows.push(r);
      } else if (row.every((cell) => cell === 1)) {
        warnings.push(`Pick (Row) ${r + 1} is entirely raised (all 1s). Weft yarn cannot interlace.`);
        invalidRows.push(r);
      }
    }

    // 2. Uniform cols
    for (let c = 0; c < w; c++) {
      const col = matrix.map((row) => row[c]);
      if (col.every((cell) => cell === 0)) {
        warnings.push(`End (Column) ${c + 1} is entirely down (all 0s). Warp thread never interlaces.`);
        invalidCols.push(c);
      } else if (col.every((cell) => cell === 1)) {
        warnings.push(`End (Column) ${c + 1} is entirely up (all 1s). Warp thread never interlaces.`);
        invalidCols.push(c);
      }
    }

    // 3. Float check (> 4 threads) with cyclic wrapping
    const calcMaxRun = (seq: number[], val: number): number => {
      const doubled = [...seq, ...seq];
      let maxRun = 0;
      let curr = 0;
      for (const item of doubled) {
        if (item === val) {
          curr++;
          if (curr > maxRun) maxRun = curr;
        } else {
          curr = 0;
        }
      }
      return Math.min(maxRun, seq.length);
    };

    for (let r = 0; r < h; r++) {
      const row = matrix[r];
      const weftFloat = calcMaxRun(row, 0);
      const warpFloat = calcMaxRun(row, 1);
      if (weftFloat > 4 && !invalidRows.includes(r)) {
        warnings.push(`Row ${r + 1} has excessive weft float (${weftFloat} threads > 4).`);
        invalidRows.push(r);
      }
      if (warpFloat > 4 && !invalidRows.includes(r)) {
        warnings.push(`Row ${r + 1} has excessive warp float (${warpFloat} threads > 4).`);
        invalidRows.push(r);
      }
    }

    for (let c = 0; c < w; c++) {
      const col = matrix.map((row) => row[c]);
      const warpFloat = calcMaxRun(col, 1);
      const weftFloat = calcMaxRun(col, 0);
      if (warpFloat > 4 && !invalidCols.includes(c)) {
        warnings.push(`Column ${c + 1} has excessive warp float (${warpFloat} threads > 4).`);
        invalidCols.push(c);
      }
      if (weftFloat > 4 && !invalidCols.includes(c)) {
        warnings.push(`Column ${c + 1} has excessive weft float (${weftFloat} threads > 4).`);
        invalidCols.push(c);
      }
    }

    // 4. Shaft limit (> 4 shafts)
    const uniqueCols = new Set(matrix[0]?.map((_, colIdx) => matrix.map((row) => row[colIdx]).join(",")));
    if (uniqueCols.size > 4) {
      warnings.push(`Requires ${uniqueCols.size} shafts, exceeding 4-shaft limit.`);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      invalidRows,
      invalidCols,
    };
  }, [masterMatrix, repeatSize]);

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
        {analysisResult && analysisResult.status === "unavailable" && (
          <div className="flex items-center space-x-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            <Sparkles className="h-3 w-3 opacity-40" />
            <span>AI Suggestion Unavailable: Manual Selection Required</span>
          </div>
        )}
        {analysisResult && analysisResult.status !== "unavailable" && (
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

      {/* Structural Validity Real-time Feedback */}
      {!validation.isValid ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <div className="flex items-center space-x-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Structural Warning: Unstable Float / Interlacing Detected</span>
          </div>
          <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[11px]">
            {validation.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-4 flex items-center space-x-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Structure Valid: All yarns interlace within 4-shaft loom limits.</span>
        </div>
      )}

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
              const isInvalidCell = validation.invalidRows.includes(rIdx) || validation.invalidCols.includes(cIdx);
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  onClick={() => toggleMatrixCell(rIdx, cIdx)}
                  style={{
                    backgroundColor: isWarpOver ? warpColor : weftColor,
                  }}
                  className={`h-12 w-12 rounded-lg border-2 transition-all flex flex-col items-center justify-center font-mono text-xs font-bold shadow-sm ${
                    isInvalidCell
                      ? "ring-2 ring-amber-500 border-amber-500"
                      : isWarpOver
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
