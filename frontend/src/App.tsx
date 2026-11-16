import React from 'react';
import { Sparkles, FileText, Upload } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm">
            TL
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">ThreadLore</h1>
            <p className="text-xs text-neutral-400 mt-1">Preserve the weave, not just the photograph</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Ready (4-Shaft Rising-Shed Engine)
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-900/40">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-300">
            <Upload className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold mb-1">Textile Studio Scaffolding</h2>
          <p className="text-xs text-neutral-400 mb-6">
            Upload macro photograph swatches to extract thread density, verify weave geometry, and export WIF 1.1 drafts.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded border border-neutral-800 bg-neutral-950/60 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 mb-2" />
              <div className="font-medium text-neutral-200">11 Weaves</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Plain + 10 Twill ratios</div>
            </div>
            <div className="p-3 rounded border border-neutral-800 bg-neutral-950/60 text-xs">
              <FileText className="w-4 h-4 text-sky-400 mb-2" />
              <div className="font-medium text-neutral-200">WIF 1.1</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">[WEAVING] Standard</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
