import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  BinaryMatrix,
  CANONICAL_PRESETS,
  CompileDraftResponse,
  ProvenanceMetadata,
  SwatchAnalysisResponse,
  WeaveFamily,
  WorkflowStep,
} from "../types/weave";
import { analyzeSwatch, compileDraft } from "../services/api";

interface WeaveContextType {
  step: WorkflowStep;
  setStep: (step: WorkflowStep) => void;
  rawImage: string | null;
  setRawImage: (image: string | null) => void;
  croppedBlob: Blob | null;
  croppedImageUrl: string | null;
  isAnalyzing: boolean;
  analysisResult: SwatchAnalysisResponse | null;
  activePreset: WeaveFamily;
  masterMatrix: BinaryMatrix;
  repeatSize: number;
  warpColor: string;
  setWarpColor: (color: string) => void;
  weftColor: string;
  setWeftColor: (color: string) => void;
  repeatWarp: number;
  setRepeatWarp: (repeats: number) => void;
  repeatWeft: number;
  setRepeatWeft: (repeats: number) => void;
  units: "Inches" | "Centimeters" | "Decipoints";
  setUnits: (units: "Inches" | "Centimeters" | "Decipoints") => void;
  provenance: ProvenanceMetadata;
  setProvenance: (metadata: ProvenanceMetadata) => void;
  isCompiling: boolean;
  compiledResult: CompileDraftResponse | null;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  handleFileSelect: (file: File) => void;
  handleCropComplete: (blob: Blob, dataUrl: string) => Promise<void>;
  toggleMatrixCell: (row: number, col: number) => void;
  selectPreset: (preset: WeaveFamily) => void;
  setCustomRepeatSize: (size: number) => void;
  triggerCompile: () => Promise<void>;
  resetWorkflow: () => void;
}

const WeaveContext = createContext<WeaveContextType | undefined>(undefined);

export const WeaveProvider: React.FC<{
  children: ReactNode;
  initialCompiledResult?: CompileDraftResponse | null;
}> = ({ children, initialCompiledResult = null }) => {
  const [step, setStep] = useState<WorkflowStep>("upload");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SwatchAnalysisResponse | null>(null);

  const [activePreset, setActivePreset] = useState<WeaveFamily>("plain_1_1");
  const [repeatSize, setRepeatSize] = useState<number>(2);
  const [masterMatrix, setMasterMatrix] = useState<BinaryMatrix>([
    [1, 0],
    [0, 1],
  ]);

  const [warpColor, setWarpColor] = useState<string>("#1E293B");
  const [weftColor, setWeftColor] = useState<string>("#E2E8F0");
  const [repeatWarp, setRepeatWarp] = useState<number>(10);
  const [repeatWeft, setRepeatWeft] = useState<number>(10);
  const [units, setUnits] = useState<"Inches" | "Centimeters" | "Decipoints">("Centimeters");

  const [provenance, setProvenance] = useState<ProvenanceMetadata>({
    title: "Preserved Textile Sample",
    origin: "",
    maker: "",
    date_period: "",
    notes: "",
  });

  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState<CompileDraftResponse | null>(initialCompiledResult);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setCompiledResult(null);
    if (!file.type.startsWith("image/")) {
      setError("Invalid file format. Please upload a valid image (JPEG, PNG, or WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setStep("crop");
    };
    reader.onerror = () => {
      setError("Failed to read image file. Please try another image.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCropComplete = useCallback(async (blob: Blob, dataUrl: string) => {
    setCroppedBlob(blob);
    setCroppedImageUrl(dataUrl);
    setCompiledResult(null);
    setIsAnalyzing(true);
    setError(null);
    setStep("verify");

    try {
      const res = await analyzeSwatch(blob);
      setAnalysisResult(res);

      if (res.default_matrix && res.default_matrix.length > 0) {
        setMasterMatrix(res.default_matrix);
        setRepeatSize(res.repeat_size);
        setActivePreset(res.weave_family);
      } else if (res.weave_family in CANONICAL_PRESETS) {
        const preset = CANONICAL_PRESETS[res.weave_family];
        setMasterMatrix(preset.matrix);
        setRepeatSize(preset.repeatSize);
        setActivePreset(res.weave_family);
      } else {
        // Fallback: keep plain weave default
        setActivePreset("custom");
      }
    } catch (err: unknown) {
      console.warn("CV/AI Analysis warning:", err);
      const detail = err instanceof Error && err.message ? err.message : null;
      setError(
        detail
          ? `Analysis failed: ${detail}`
          : "Automated weave suggestion was unavailable. Please select a preset or configure the matrix manually."
      );
      setActivePreset("plain_1_1");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const selectPreset = useCallback((preset: WeaveFamily) => {
    setActivePreset(preset);
    setCompiledResult(null);
    const info = CANONICAL_PRESETS[preset];
    if (info) {
      setRepeatSize(info.repeatSize);
      setMasterMatrix(info.matrix.map((row) => [...row]));
    }
  }, []);

  const setCustomRepeatSize = useCallback((size: number) => {
    setRepeatSize(size);
    setActivePreset("custom");
    setCompiledResult(null);
    setMasterMatrix((prev) => {
      const newMatrix: BinaryMatrix = [];
      for (let r = 0; r < size; r++) {
        const row: number[] = [];
        for (let c = 0; c < size; c++) {
          row.push((r < prev.length && c < (prev[0]?.length || 0)) ? prev[r][c] : 0);
        }
        newMatrix.push(row);
      }
      return newMatrix;
    });
  }, []);

  const toggleMatrixCell = useCallback((row: number, col: number) => {
    setActivePreset("custom");
    setCompiledResult(null);
    setMasterMatrix((prev) => {
      const next = prev.map((r, rIdx) =>
        r.map((val, cIdx) => (rIdx === row && cIdx === col ? (val === 1 ? 0 : 1) : val))
      );
      return next;
    });
  }, []);

  const handleSetWarpColor = useCallback((color: string) => {
    setWarpColor(color);
    setCompiledResult(null);
  }, []);

  const handleSetWeftColor = useCallback((color: string) => {
    setWeftColor(color);
    setCompiledResult(null);
  }, []);

  const handleSetRepeatWarp = useCallback((repeats: number) => {
    setRepeatWarp(repeats);
    setCompiledResult(null);
  }, []);

  const handleSetRepeatWeft = useCallback((repeats: number) => {
    setRepeatWeft(repeats);
    setCompiledResult(null);
  }, []);

  const handleSetUnits = useCallback((newUnits: "Inches" | "Centimeters" | "Decipoints") => {
    setUnits(newUnits);
    setCompiledResult(null);
  }, []);

  const handleSetProvenance = useCallback((metadata: ProvenanceMetadata) => {
    setProvenance(metadata);
    setCompiledResult(null);
  }, []);

  const triggerCompile = useCallback(async () => {
    setIsCompiling(true);
    setError(null);

    try {
      const response = await compileDraft({
        matrix: masterMatrix,
        warp_color_hex: warpColor,
        weft_color_hex: weftColor,
        repeat_warp: repeatWarp,
        repeat_weft: repeatWeft,
        units,
        provenance,
      });

      setCompiledResult(response);
      if (response.is_valid) {
        setStep("draft");
      } else {
        setError(response.validation_errors.join(" ") || "Pattern failed structural validation.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Compilation failed.";
      setError(msg);
    } finally {
      setIsCompiling(false);
    }
  }, [masterMatrix, warpColor, weftColor, repeatWarp, repeatWeft, units, provenance]);

  const resetWorkflow = useCallback(() => {
    setStep("upload");
    setRawImage(null);
    setCroppedBlob(null);
    setCroppedImageUrl(null);
    setAnalysisResult(null);
    setCompiledResult(null);
    setError(null);
    selectPreset("plain_1_1");
  }, [selectPreset]);

  return (
    <WeaveContext.Provider
      value={{
        step,
        setStep,
        rawImage,
        setRawImage,
        croppedBlob,
        croppedImageUrl,
        isAnalyzing,
        analysisResult,
        activePreset,
        masterMatrix,
        repeatSize,
        warpColor,
        setWarpColor: handleSetWarpColor,
        weftColor,
        setWeftColor: handleSetWeftColor,
        repeatWarp,
        setRepeatWarp: handleSetRepeatWarp,
        repeatWeft,
        setRepeatWeft: handleSetRepeatWeft,
        units,
        setUnits: handleSetUnits,
        provenance,
        setProvenance: handleSetProvenance,
        isCompiling,
        compiledResult,
        error,
        setError,
        handleFileSelect,
        handleCropComplete,
        toggleMatrixCell,
        selectPreset,
        setCustomRepeatSize,
        triggerCompile,
        resetWorkflow,
      }}
    >
      {children}
    </WeaveContext.Provider>
  );
};

export const useWeave = (): WeaveContextType => {
  const context = useContext(WeaveContext);
  if (!context) {
    throw new Error("useWeave must be used within a WeaveProvider");
  }
  return context;
};
