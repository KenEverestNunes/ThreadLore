import React from "react";
import { Palette, Ruler } from "lucide-react";
import { useWeave } from "../context/WeaveContext";

const PALETTE_PRESETS = [
  { name: "Indigo & Ecru", warp: "#1E293B", weft: "#E2E8F0" },
  { name: "Highland Tweed", warp: "#78350F", weft: "#FEF3C7" },
  { name: "Forest Tartan", warp: "#831843", weft: "#064E3B" },
  { name: "Charcoal & Linen", warp: "#18181B", weft: "#F4F4F5" },
];

export const ColorPickerRow: React.FC = () => {
  const {
    warpColor,
    setWarpColor,
    weftColor,
    setWeftColor,
    repeatWarp,
    setRepeatWarp,
    repeatWeft,
    setRepeatWeft,
    units,
    setUnits,
  } = useWeave();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center space-x-2 mb-3">
        <Palette className="h-4 w-4 text-zinc-500" />
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Yarn Palette & Full Project Repeats
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Warp Color */}
        <div className="flex items-center space-x-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <input
            type="color"
            value={warpColor}
            onChange={(e) => setWarpColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
          />
          <div className="flex-1">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Warp Ends Color (Vertical)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">{warpColor.toUpperCase()}</span>
          </div>
        </div>

        {/* Weft Color */}
        <div className="flex items-center space-x-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <input
            type="color"
            value={weftColor}
            onChange={(e) => setWeftColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
          />
          <div className="flex-1">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Weft Picks Color (Horizontal)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">{weftColor.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Preset Swatches */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-zinc-500">Preset Palettes:</span>
        {PALETTE_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setWarpColor(p.warp);
              setWeftColor(p.weft);
            }}
            className="flex items-center space-x-1.5 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <div className="flex -space-x-1">
              <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ backgroundColor: p.warp }} />
              <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ backgroundColor: p.weft }} />
            </div>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Repeats & Units row */}
      <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
            Warp Multiples (Ends)
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={repeatWarp}
            onChange={(e) => setRepeatWarp(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
            Weft Multiples (Picks)
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={repeatWeft}
            onChange={(e) => setRepeatWeft(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400 mb-1">
            <Ruler className="h-3 w-3" />
            <span>WIF Physical Units</span>
          </label>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value as "Inches" | "Centimeters" | "Decipoints")}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="Centimeters">Centimeters</option>
            <option value="Inches">Inches</option>
            <option value="Decipoints">Decipoints</option>
          </select>
        </div>
      </div>
    </div>
  );
};
