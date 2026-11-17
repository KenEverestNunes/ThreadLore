import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Crop,
  Eye,
  FileCheck2,
  HelpCircle,
  Monitor,
  Moon,
  Sun,
  Upload,
} from "lucide-react";
import { WeaveProvider, useWeave } from "./context/WeaveContext";
import { CaptureGuidance } from "./components/CaptureGuidance";
import { PhotoUploader } from "./components/PhotoUploader";
import { SwatchCropper } from "./components/SwatchCropper";
import { VerificationPanel } from "./components/VerificationPanel";
import { LoomDraftCard } from "./components/LoomDraftCard";
import { ThreadLoreIcon } from "./components/ThreadLoreIcon";
import { WorkflowStep } from "./types/weave";

const STEPS: { id: WorkflowStep; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "upload", label: "Upload Swatch", icon: Upload },
  { id: "crop", label: "1:1 Macro Crop", icon: Crop },
  { id: "verify", label: "Verify & Align", icon: Eye },
  { id: "draft", label: "Loom Draft & WIF", icon: FileCheck2 },
];

const MainContent: React.FC<{ onOpenGuidance: () => void }> = ({ onOpenGuidance }) => {
  const { step, setStep, rawImage, croppedImageUrl, compiledResult } = useWeave();

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Progress Stepper */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center space-x-2 sm:space-x-6 overflow-x-auto py-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted =
              (s.id === "upload" && rawImage !== null) ||
              (s.id === "crop" && croppedImageUrl !== null) ||
              (s.id === "verify" && compiledResult !== null);

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === "upload") setStep("upload");
                  else if (s.id === "crop" && rawImage) setStep("crop");
                  else if (s.id === "verify" && croppedImageUrl) setStep("verify");
                  else if (s.id === "draft" && compiledResult) setStep("draft");
                }}
                disabled={
                  (s.id === "crop" && !rawImage) ||
                  (s.id === "verify" && !croppedImageUrl) ||
                  (s.id === "draft" && !compiledResult)
                }
                className={`flex items-center space-x-2 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenGuidance}
          className="flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Capture Guidelines</span>
        </button>
      </div>

      {/* Step View Router */}
      {step === "upload" && <PhotoUploader onOpenGuidance={onOpenGuidance} />}
      {step === "crop" && <SwatchCropper />}
      {step === "verify" && <VerificationPanel />}
      {step === "draft" && <LoomDraftCard />}
    </div>
  );
};

const Header: React.FC = () => {
  const { setStep } = useWeave();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("threadlore-theme") as "light" | "dark" | "system") || "dark";
  });

  const applyTheme = useCallback((mode: "light" | "dark" | "system") => {
    const root = document.documentElement;
    const body = document.body;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = mode === "dark" || (mode === "system" && prefersDark);

    if (isDark) {
      root.classList.add("dark");
      body?.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      body?.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, []);

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    try {
      localStorage.setItem("threadlore-theme", mode);
    } catch {
      // localStorage might be unavailable
    }
    applyTheme(mode);
  };

  useEffect(() => {
    applyTheme(theme);
    if (theme === "system" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        applyTheme("system");
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme, applyTheme]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep("upload")}
          className="flex items-center space-x-3 text-left hover:opacity-85 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 -ml-1"
          title="Return to Upload Swatch home page"
          aria-label="ThreadLore home"
        >
          <ThreadLoreIcon className="h-8 w-8 shadow-sm flex-shrink-0" />
          <div>
            <span className="text-sm font-bold tracking-tight">ThreadLore</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] text-zinc-400 font-normal">
              | Preserve the weave, not just the photograph
            </span>
          </div>
        </button>

        <div className="flex items-center space-x-3 text-xs">
          {/* Theme Mode Switcher */}
          <div
            className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100/60 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
            role="group"
            aria-label="Theme mode"
          >
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`rounded-md p-1.5 transition cursor-pointer ${
                theme === "light"
                  ? "bg-white text-amber-500 shadow-sm dark:bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Light Theme"
              aria-label="Light theme"
            >
              <Sun className="h-3.5 w-3.5 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`rounded-md p-1.5 transition cursor-pointer ${
                theme === "dark"
                  ? "bg-white text-indigo-500 shadow-sm dark:bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Dark Theme"
              aria-label="Dark theme"
            >
              <Moon className="h-3.5 w-3.5 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("system")}
              className={`rounded-md p-1.5 transition cursor-pointer ${
                theme === "system"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="System Theme"
              aria-label="System theme"
            >
              <Monitor className="h-3.5 w-3.5 pointer-events-none" />
            </button>
          </div>

          <span className="flex items-center space-x-1.5 rounded-full border border-zinc-200 bg-zinc-100/60 px-2.5 py-1 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">4-Shaft Rising-Shed Engine</span>
            <span className="sm:hidden">4-Shaft</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);

  return (
    <WeaveProvider>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <Header />

        {/* Main Application Body */}
        <main className="flex-1 flex flex-col">
          <MainContent onOpenGuidance={() => setIsGuidanceOpen(true)} />
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950 text-xs text-zinc-500 text-center space-y-1">
          <p>
            ThreadLore • AI-Assisted, Human-Verified Textile Reconstruction • Powered by Gemini 3.8 Flash & WIF 1.1 Specification
          </p>
          <p className="text-[11px] text-zinc-400">
            Strict 4-Shaft / 4-Treadle physical constraints • Deterministic closed-form Boolean factorization • User-supplied provenance
          </p>
        </footer>

        {/* Modal */}
        <CaptureGuidance isOpen={isGuidanceOpen} onClose={() => setIsGuidanceOpen(false)} />
      </div>
    </WeaveProvider>
  );
};

export default App;
