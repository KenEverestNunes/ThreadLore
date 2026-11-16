/**
 * REST API client service for ThreadLore backend communication.
 */

import {
  CompileDraftRequest,
  CompileDraftResponse,
  SwatchAnalysisResponse,
} from "../types/weave";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function analyzeSwatch(imageBlob: Blob): Promise<SwatchAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "swatch.jpg");

  const response = await fetch(`${BASE_URL}/api/swatch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || `Swatch analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function compileDraft(
  request: CompileDraftRequest
): Promise<CompileDraftResponse> {
  const response = await fetch(`${BASE_URL}/api/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Compilation failed" }));
    throw new Error(errorData.detail || `Loom compilation failed with status ${response.status}`);
  }

  return response.json();
}

export async function downloadWifFile(
  wifText: string,
  filename: string = "threadlore_draft.wif"
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/download-wif`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wif_text: wifText, filename }),
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".wif") ? filename : `${filename}.wif`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
