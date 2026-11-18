/**
 * TypeScript domain types for ThreadLore textile reconstruction.
 */

export type WeaveFamily =
  | "plain_1_1"
  | "twill_1_2_s"
  | "twill_1_2_z"
  | "twill_2_1_s"
  | "twill_2_1_z"
  | "twill_1_3_s"
  | "twill_1_3_z"
  | "twill_2_2_s"
  | "twill_2_2_z"
  | "twill_3_1_s"
  | "twill_3_1_z"
  | "custom";

export type BinaryMatrix = number[][];

export interface ProvenanceMetadata {
  title: string;
  origin?: string;
  maker?: string;
  date_period?: string;
  notes?: string;
}

export interface LoomDraft {
  shafts: number;
  treadles: number;
  warp_threads: number;
  weft_picks: number;
  threading: number[];
  treadling: number[];
  tieup: number[][];
  drawdown: number[][];
}

export interface SwatchAnalysisResponse {
  status: "success" | "unavailable" | "uncertain";
  is_woven_textile?: boolean;
  weave_family: WeaveFamily;
  twill_direction?: "S" | "Z" | null;
  repeat_size: number;
  confidence: number;
  default_matrix?: BinaryMatrix | null;
  technical_description: string;
  float_risk_notes?: string | null;
  dx_px?: number | null;
  dy_px?: number | null;
  spacing_detected: boolean;
  rotation_degrees: number;
  dominant_warp_hex?: string | null;
  dominant_weft_hex?: string | null;
}

export interface CompileDraftRequest {
  matrix: BinaryMatrix;
  warp_color_hex: string;
  weft_color_hex: string;
  repeat_warp: number;
  repeat_weft: number;
  units: "Inches" | "Centimeters" | "Decipoints";
  provenance?: ProvenanceMetadata | null;
}

export interface CompileDraftResponse {
  draft?: LoomDraft | null;
  is_valid: boolean;
  validation_errors: string[];
  validation_warnings: string[];
  wif_text: string;
}

export type WorkflowStep = "upload" | "crop" | "verify" | "draft";

export interface WeavePresetOption {
  id: WeaveFamily;
  label: string;
  repeatSize: number;
  description: string;
  matrix: BinaryMatrix;
}

export const CANONICAL_PRESETS: Record<WeaveFamily, WeavePresetOption> = {
  plain_1_1: {
    id: "plain_1_1",
    label: "Plain Weave (1/1)",
    repeatSize: 2,
    description: "Simple alternating over-one under-one grid.",
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  twill_1_2_s: {
    id: "twill_1_2_s",
    label: "1/2 Twill (S-direction)",
    repeatSize: 3,
    description: "Weft-faced 3-end twill slanting upward left.",
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  twill_1_2_z: {
    id: "twill_1_2_z",
    label: "1/2 Twill (Z-direction)",
    repeatSize: 3,
    description: "Weft-faced 3-end twill slanting upward right.",
    matrix: [
      [1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ],
  },
  twill_2_1_s: {
    id: "twill_2_1_s",
    label: "2/1 Twill (S-direction)",
    repeatSize: 3,
    description: "Warp-faced 3-end twill slanting upward left.",
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 1],
    ],
  },
  twill_2_1_z: {
    id: "twill_2_1_z",
    label: "2/1 Twill (Z-direction)",
    repeatSize: 3,
    description: "Warp-faced 3-end twill slanting upward right.",
    matrix: [
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 1],
    ],
  },
  twill_1_3_s: {
    id: "twill_1_3_s",
    label: "1/3 Twill (S-direction)",
    repeatSize: 4,
    description: "Weft-faced 4-end twill with 3-pick weft floats slanting left.",
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  },
  twill_1_3_z: {
    id: "twill_1_3_z",
    label: "1/3 Twill (Z-direction)",
    repeatSize: 4,
    description: "Weft-faced 4-end twill with 3-pick weft floats slanting right.",
    matrix: [
      [1, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
    ],
  },
  twill_2_2_s: {
    id: "twill_2_2_s",
    label: "2/2 Balanced Twill (S-direction)",
    repeatSize: 4,
    description: "Classic balanced twill with diagonal wale slanting up-left.",
    matrix: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
    ],
  },
  twill_2_2_z: {
    id: "twill_2_2_z",
    label: "2/2 Balanced Twill (Z-direction)",
    repeatSize: 4,
    description: "Classic denim/tweed balanced twill with diagonal wale slanting up-right.",
    matrix: [
      [1, 1, 0, 0],
      [1, 0, 0, 1],
      [0, 0, 1, 1],
      [0, 1, 1, 0],
    ],
  },
  twill_3_1_s: {
    id: "twill_3_1_s",
    label: "3/1 Twill (S-direction)",
    repeatSize: 4,
    description: "Warp-faced 4-end twill with 3-end warp floats slanting left.",
    matrix: [
      [1, 1, 1, 0],
      [0, 1, 1, 1],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
    ],
  },
  twill_3_1_z: {
    id: "twill_3_1_z",
    label: "3/1 Twill (Z-direction)",
    repeatSize: 4,
    description: "Warp-faced 4-end twill with 3-end warp floats slanting right.",
    matrix: [
      [1, 1, 1, 0],
      [1, 1, 0, 1],
      [1, 0, 1, 1],
      [0, 1, 1, 1],
    ],
  },
  custom: {
    id: "custom",
    label: "Custom Master Tile",
    repeatSize: 4,
    description: "Freely toggle individual interlacing cells (up to 4x4).",
    matrix: [
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ],
  },
};
