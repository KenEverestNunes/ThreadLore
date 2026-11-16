# Product Requirements Document (PRD)
## ThreadLore: Physical Textile-to-Loom Reconstruction Pipeline

**Target Event:** Google Cloud Run "Build for Good" Hackathon  
**Launch Date:** November 20, 2026 (Product Hunt Launch)  
**Author:** Solo Developer  
**Status:** Approved & Ready for Implementation  
**Version:** 1.0.0 (Production-Scoped MVP)

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Traditional woven textiles encode generations of cultural heritage, ancestral mathematics, and artisanal craftsmanship. Across the world, physical heritage fabrics survive in museums, community archives, and family heirlooms, but their original weaving instructions (loom drafts) have been lost. 

Reconstructing a weaving draft manually from physical cloth requires rare master-weaver expertise, optical magnification, and tedious grid plotting. Existing digital weaving software (e.g., WeavePoint, Handweaving.net) functions only as manual design editors—they cannot ingest physical textile photographs and translate them into verified mechanical loom instructions.

### 1.2 Product Vision & Positioning
**"Preserve the weave, not just the photograph."**

**ThreadLore** is an open-access, web-based textile reconstruction tool deployed on **Google Cloud Run**. It serves as an **AI-assisted, human-verified reconstruction assistant** that allows cultural archivists, museum conservators, and heritage weavers to photograph a woven textile and convert it into a standards-compliant **WIF 1.1 (Weaving Information File)** and an in-browser 4-part loom draft card (Threading, Tie-Up, Treadling, and Drawdown).

ThreadLore does not attempt unverified automated archaeological identification or speculative cultural storytelling from a photograph alone. Instead:
1. **Computer Vision & Gemini AI** estimate thread density, deskew geometry, and suggest a candidate weave structure.
2. **The User Verifies or Corrects** the structure using an interactive master repeat tile editor and a live photo overlay with draggable grid alignment controls.
3. **The Deterministic Compiler** guarantees that the confirmed pattern mathematically reproduces the generated loom draft under physical 4-shaft/4-treadle rising-shed constraints.
4. **Cultural Provenance** (origin, maker, date/period, historical notes) is user-supplied metadata preserved directly alongside the technical weave draft.

### 1.3 Hackathon "Build for Good" Alignment
- **Cultural Preservation:** Democratizes textile archaeology by preserving fragile physical artifacts into immortal, open digital formats without making speculative historical claims.
- **Empowering Artisans:** Enables modern weavers to reproduce authentic historical patterns on standard 4-shaft floor or table looms.
- **Google Cloud Native:** Showcases Cloud Run's serverless container performance (OpenCV image geometry processing) coupled with Vertex AI (Gemini Flash multimodal technical analysis).

---

## 2. Scope & Guardrails

To guarantee delivery within the 5-day sprint (Nov 16–Nov 20), strict boundaries are enforced.

### 2.1 In-Scope (MVP)
1. **Supported Weave Structures (11 Canonical Variations):**
   - **Plain Weave (Tabby):** $1/1$ ($2\times2$ repeat, 2 shafts, 2 treadles)
   - **Straight Twills (all 5 basic ratios in both S-twill and Z-twill diagonal directions):**
     - $1/2$ Twill (S and Z directions): $3\times3$ repeat (3 shafts, 3 treadles)
     - $2/1$ Twill (S and Z directions): $3\times3$ repeat (3 shafts, 3 treadles)
     - $1/3$ Twill (S and Z directions): $4\times4$ repeat (4 shafts, 4 treadles)
     - $2/2$ Balanced Twill (S and Z directions): $4\times4$ repeat (4 shafts, 4 treadles)
     - $3/1$ Warp-Faced Twill (S and Z directions): $4\times4$ repeat (4 shafts, 4 treadles)
2. **Loom Constraints:** Strictly limited to single-layer rising-shed looms with **maximum 4 shafts and 4 treadles**.
3. **Yarn Color Support:** Dual-color contrast (independent warp yarn color and weft yarn color).
4. **Input Medium:** Macro-photograph swatches (tightly cropped patch of $\approx 15 \times 15$ threads) taken on standard smartphone cameras.
5. **Output Standard:** WIF 1.1 specification files (1-based indexing, `[WEAVING]` section, configurable project repeat dimensions e.g. $40 \times 40$) with verified round-trip compatibility in external tools (Handweaving.net, Asunder, Fiberworks).
6. **Provenance Metadata:** Optional user-supplied fields for textile title, geographic origin, artisan/maker, date or period, and conservation notes.

### 2.2 Explicitly Out-of-Scope (Non-Goals)
- **Satin Weaves:** Regular satins require $\ge 5$ shafts (5-end satin minimum) and are excluded to protect the 4-shaft limit.
- **Complex Structures:** Jacquard patterns, double-weave, pile rugs, knitting, crochet, and embroidery.
- **Speculative Cultural AI:** No automated historical, ethnic, or tribal attribution claims inferred solely from fabric pixels. Provenance is user-supplied.
- **Unverified Vision Guesses:** No automated pixel-by-pixel intersection extraction across uncalibrated photos.
- **3D Physics Simulations:** Procedural cloth drape or yarn mechanics in Three.js (2D canvas preview only).
- **PDF Export:** Printable PDF loom cards are excluded from MVP (in-browser 4-part visual draft card provided).

---

## 3. User Personas & End-to-End User Journey

### 3.1 Target Personas
1. **Elena (Textile Archivist):** Documents indigenous Central American textiles in a museum collection. Needs a quick way to record structural weave drafts alongside specimen photographs without manually drawing 500 grid cells.
2. **Marcus (Heritage Weaver):** Owns a 4-shaft Schacht floor loom. Wants to replicate a vintage tweed fragment found in a family heirloom trunk and needs clean WIF instructions for his loom setup.

### 3.2 The 6-Step User Journey

```
[ Step 1: Upload & Crop ] 
       │
       ▼
[ Step 2: OpenCV Geometry ] ──(Perspective Deskew & FFT Spacing)
       │
       ▼
[ Step 3: Gemini Curation ] ──(Weave Structure Suggestion OR Manual Fallback)
       │
       ▼
[ Step 4: Master Tile Editor ] ◄──► [ Live Tiled Overlay ] (Draggable Grid Alignment & Verification Loop)
       │
       ▼
[ Step 5: Python Compiler ] ──(Boolean Factorization: Shafts, Treadles, Tie-Up M[s,t]=D[it,js])
       │
       ▼
[ Step 6: Validation & Export ] ──(Cyclic Floats ≤ 4, Shafts ≤ 4 → WIF 1.1 Download & Draft Card)
```

1. **Upload & Crop:** User uploads a macro photo of the textile. Using a bounding box cropper, the user selects a flat, clean square patch ($\approx 15 \times 15$ threads).
2. **Optical Geometry (Cloud Run):** The backend executes 2D FFT to measure horizontal thread spacing ($\Delta x$) and vertical thread spacing ($\Delta y$), computes skew angle $\theta$, and rectifies rotation.
3. **AI Curation & Manual Fallback (Vertex AI):** Gemini evaluates the deskewed swatch and suggests a candidate weave structure (e.g., "$2/2$ Z-Twill"). If confidence is low or the API is unavailable, the system returns `unavailable` and prompts the user to select from the 11 supported canonical weaves or start blank.
4. **Master Tile Verification & Alignment (React Frontend):** The UI pre-populates the $N \times N$ master tile ($N \in \{2, 3, 4\}$). The user can toggle cells or pick a preset. The canvas live-tiles the master block directly over the photograph. The user drags to adjust the grid phase origin ($X, Y$ offsets), fine-tunes thread spacing ($\Delta x, \Delta y$), adjusts angle, and alters opacity to achieve visual alignment.
5. **Deterministic Compilation (Cloud Run):** The user clicks "Compile Draft". The Python backend executes Boolean matrix factorization, resolving column sequences into shafts, row sequences into treadles, and deriving the exact tie-up matrix $M[s,t] = D[i_t, j_s]$.
6. **Integrity Validation & Export:** The backend verifies that shafts $\le 4$, treadles $\le 4$, and cyclic floats $\le 4$ without uniform rows/columns. Upon validation, the user enters project repeat counts (e.g., $40 \times 40$) and downloads the standard `.wif` file alongside an in-browser 4-part loom draft card.

---

## 4. Functional Requirements

| ID | Feature | Description | Acceptance Criteria |
|---|---|---|---|
| **FR-1** | Swatch Cropper | Interactive browser-based image cropper restricting aspect ratio to 1:1. | User can zoom, pan, and crop a square swatch resized client-side to $\le 800\times800$px before upload. |
| **FR-2** | Optical Deskewing | OpenCV backend detects thread angle and straightens the image. | Returns deskewed image, estimated warp spacing $\Delta x$, weft spacing $\Delta y$, and rotation angle $\theta$. If FFT peak detection is ambiguous or fails, sets `spacing_detected: false`, `dx_px: null`, `dy_px: null` and prompts manual slider adjustment. Never invents synthetic measurements. |
| **FR-3** | AI Curation & Manual Fallback | Gemini suggests candidate weave; graceful manual fallback. | Returns structured JSON with suggested weave family, twill direction, heuristic confidence, and technical description. Confidence is treated strictly as an uncalibrated heuristic suggestion, not proof of ground truth. If uncertain or offline, returns `unavailable` and presents manual weave selector. |
| **FR-4** | Master Tile Editor | $N \times N$ interactive binary toggle matrix ($N \in \{2, 3, 4\}$). | Clicking a cell toggles binary state (1 = Warp over Weft, 0 = Weft over Warp). Capped at 16 cells max. Presets available for all 11 supported weaves. |
| **FR-5** | Live Tiled Overlay & Grid Alignment | Semi-transparent rendering of the tiled master matrix over the fabric photo with phase alignment. | Master tile replicates across the viewport. Includes draggable $X/Y$ grid origin offsets, $\Delta x$ (EPI), $\Delta y$ (PPI), rotation fine-tuning, and opacity slider (0–100%). |
| **FR-6** | Color & Provenance Metadata | User sets yarn colors and optional historical documentation. | Allows setting `warp_color` and `weft_color` hex values. Captures optional provenance metadata (`title`, `origin`, `maker`, `date_period`, `notes`) embedded in WIF remarks. |
| **FR-7** | Loom Factorization | Deterministic factorization of binary repeat matrix into loom instructions. | Factoring produces: Threading ($S \times N$), Treadling ($T \times N$), and Tie-Up ($M[s,t] = D[i_t, j_s]$). Re-simulated drawdown matches input 100%. |
| **FR-8** | Constraint & Float Engine | Validates physical loom boundaries and thread float stability. | Rejects matrices requiring $> 4$ shafts or $> 4$ treadles. Rejects unbroken floats $> 4$ threads and uniform rows/columns across cyclic boundaries. |
| **FR-9** | WIF 1.1 Serialization | Generates standard-compliant `.wif` plain-text file. | Mandatory sections: `[WIF]`, `[CONTENTS]`, `[WEAVING]` (`Shafts=`, `Treadles=`, `Rising shed=1`), `[WARP]`, `[WEFT]`, `[COLOR PALETTE]`, `[COLOR TABLE]`, `[WARP COLORS]`, `[WEFT COLORS]`, `[THREADING]`, `[TIEUP]`, `[TREADLING]`. 1-based indexing. User-configurable repeat expansion. |
| **FR-10** | Visual Draft Card | Interactive in-browser rendering of the 4-part weaving draft. | Displays Threading chart, Tie-Up grid, Treadling sequence, and Drawdown simulation with active yarn colors. |

---

## 5. Technical Architecture & Component Specifications

### 5.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT: React + TypeScript                │
│  - Swatch Cropper (react-image-crop)                        │
│  - Master Tile Editor (4 to 16 toggles)                     │
│  - Live Canvas Overlay (HTML5 Canvas with dX/dY sliders)     │
│  - Color Pickers & WIF Download Trigger                     │
└──────────────┬──────────────────────────────▲───────────────┘
               │ POST /api/swatch             │ JSON Preset & Dimensions
               │ POST /api/compile            │ WIF File Download
┌──────────────▼──────────────────────────────┴───────────────┐
│              BACKEND: Google Cloud Run (FastAPI)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. OpenCV Preprocessor (FFT, deskew, EPI/PPI profiler)│  │
│  │ 2. Deterministic Loom Compiler (Matrix Factorization) │  │
│  │ 3. Cyclic Float Validator (Toroidal Run Counter)      │  │
│  │ 4. WIF 1.1 Formatter (1-based index INI Serializer)   │  │
│  └──────────┬───────────────────────────────▲────────────┘  │
└─────────────┼───────────────────────────────┼───────────────┘
              │ Store Swatch                  │ Visual Swatch
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │  Cloud Storage  │             │    Vertex AI    │
     │  (GCS Bucket)   │             │ (Gemini 2.0 F)  │
     └─────────────────┘             └─────────────────┘
```

### 5.2 Backend Service (Google Cloud Run)
- **Runtime:** Python 3.11-slim
- **Framework:** FastAPI with Uvicorn
- **Container Footprint:** Built using `opencv-python-headless`, `numpy`, and `scipy`. Container image size $\approx 240$MB (avoids the 1GB+ bloat of full desktop OpenCV).
- **Concurrency & Cold-Start Strategy:**
  - `min-instances: 1` during hackathon demo and submission evaluation window.
  - Concurrency: 80 requests per instance.
  - Memory: 1GiB RAM, 1 vCPU.
- **Health Check Endpoint:** `GET /healthz` returning `{"status": "healthy", "service": "threadlore-core"}`.

### 5.3 AI Service (Google Cloud Vertex AI)
- **Model:** `gemini-3.8-flash` on Vertex AI (with `google-genai==3.3.0`), configurable via `GEMINI_MODEL` (with fallback to `gemini-2.5-flash` or `gemini-2.0-flash`).
- **Endpoint Location:** Configurable via `LOCATION` (e.g. `global` or `us-central1`), decoupled from the Cloud Run hosting region.
- **Invocation:** Asynchronous REST call via official Google GenAI SDK (`google-genai`).
- **Heuristic Confidence Model:** `confidence` (float $0.0 \dots 1.0$) is treated strictly as an **uncalibrated heuristic indicator** of model certainty, not a mathematical verification of accuracy. The UI presents this as a helpful suggestion indicator (e.g., "Suggestion: Moderate Confidence"), never as verified ground truth.
- **Structured Output Schema:** Pydantic model enforcing:
  ```json
  {
    "status": "success",
    "weave_family": "twill_2_2",
    "twill_direction": "Z",
    "repeat_size": 4,
    "confidence": 0.94,
    "default_matrix": [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1]
    ],
    "technical_description": "2/2 Balanced Z-direction twill with diagonal float interlacing every 2 picks/ends. Requires 4 shafts and 4 treadles.",
    "float_risk_notes": "Symmetric float length of 2 threads on both faces, stable structural interlacing."
  }
  ```
  *Fallback Guarantee:* If API confidence is $< 0.60$, or network/quota error occurs, the service **never hallucinates a pattern with artificial confidence**. It returns `status: "unavailable"` and prompts the user to select from the 11 supported canonical weaves or configure the tile manually.

### 5.4 Storage (Google Cloud Storage)
- **Bucket:** `gs://threadlore-swatches-prod`
- **Lifecycle:** Auto-delete uploaded swatches after 24 hours to prevent storage accumulation and respect user privacy.
- **Client Upload Limit:** Strict client-side resize to max $800 \times 800$px ensures payloads are $< 1$MB, completely avoiding Cloud Run payload throttling.

---

## 6. Mathematical & Algorithmic Formulation

### 6.1 Boolean Matrix Factorization (Loom Solver)
Given a validated binary master drawdown matrix $D$ of size $N \times N$:
$$D_{i,j} \in \{0, 1\} \quad \text{for } 0 \le i, j < N$$
where $1$ denotes a warp thread over a weft thread, and $0$ denotes weft over warp.

1. **Shaft (Threading) Allocation:**
   - Scan columns $C_j = D_{*,j}$ for $j \in [0, N-1]$.
   - Identify unique column patterns $U_C = \{u_1, u_2, \dots, u_S\}$.
   - The number of shafts required is $S = |U_C|$.
   - Assign 1-based shaft index to each column: $\text{Shaft}(j) = \text{index of } C_j \text{ in } U_C + 1$.
   - **Constraint:** If $S > 4$, raise `LoomShaftOverflowError`.
   - *Test Interface Note:* For standard master tiles ($N \le 4$), $S$ can mathematically never exceed 4. To rigorously test the $S > 4$ guardrail, the compiler exposes an underlying `factor_matrix(matrix: list[list[int]])` function that accepts arbitrary matrices (e.g., $5\times5$ satin), while `factor_drawdown` enforces $N \in \{2, 3, 4\}$ for user swatches.

2. **Treadle (Treadling) Allocation:**
   - Scan rows $R_i = D_{i,*}$ for $i \in [0, N-1]$.
   - Identify unique row patterns $U_R = \{v_1, v_2, \dots, v_T\}$.
   - The number of treadles required is $T = |U_R|$.
   - Assign 1-based treadle index to each pick: $\text{Treadle}(i) = \text{index of } R_i \text{ in } U_R + 1$.
   - **Constraint:** If $T > 4$, raise `LoomTreadleOverflowError`.

3. **Tie-Up Matrix Generation ($M \in \{0, 1\}^{S \times T}$):**
   - For each shaft $s \in [1, S]$, select a representative column index $j_s \in [0, N-1]$ where $\text{Shaft}(j_s) = s$.
   - For each treadle $t \in [1, T]$, select a representative row index $i_t \in [0, N-1]$ where $\text{Treadle}(i_t) = t$.
   - The tie-up matrix entry is derived directly from the drawdown intersection:
     $$M_{s,t} = D_{i_t, j_s}$$
   - *Mathematical Correctness Proof:* On pick $i$, pressing treadle $t = \text{Treadle}(i)$ raises all shafts $s$ for which $M_{s,t} = 1$. For warp end $j$ assigned to shaft $s = \text{Shaft}(j)$, the end rises if and only if $M_{s,t} = 1$. Since $M_{s,t} = D_{i_t, j_s}$ and by definition of column/row equivalence $D_{i,j} = D_{i_t, j_s}$, the simulated drawdown $D'_{i,j} \equiv D_{i,j}$ for all $(i,j)$. Factorization is closed-form, deterministic, and $O(N^2)$.

### 6.2 Cyclic Float & Interlacing Validation Algorithm
Woven fabric repeats periodically in both warp and weft dimensions. A thread at index $N-1$ wraps cyclically into index $0$. Excessive un-interlaced floats cause snags and structural instability.

**Algorithm:**
```python
def validate_weave_structure(matrix: list[list[int]], max_allowed_float: int = 4) -> tuple[bool, str]:
    N = len(matrix)
    # Check 1: Uniform row or column rejection (threads that never interlace)
    for i, row in enumerate(matrix):
        if all(cell == 0 for cell in row) or all(cell == 1 for cell in row):
            return False, f"Row {i} is completely uniform; weft yarn never interlaces."
    
    for j in range(N):
        col = [matrix[i][j] for i in range(N)]
        if all(cell == 0 for cell in col) or all(cell == 1 for cell in col):
            return False, f"Column {j} is completely uniform; warp yarn never interlaces."

    # Check 2: Cyclic float run length on periodic expansion (2N wrap)
    for axis_name, sequences in [("Weft", matrix), ("Warp", list(zip(*matrix)))]:
        for idx, seq in enumerate(sequences):
            doubled = list(seq) + list(seq)
            for val, thread_type in [(1, "warp float"), (0, "weft float")]:
                current_run = 0
                max_run = 0
                for cell in doubled:
                    if cell == val:
                        current_run += 1
                        if current_run > max_run:
                            max_run = current_run
                    else:
                        current_run = 0
                # Float run cannot exceed the length of the repeat N
                effective_run = min(max_run, N)
                if effective_run > max_allowed_float:
                    return False, f"{axis_name} sequence {idx} has excessive cyclic {thread_type} of length {effective_run}."
                    
    return True, "Valid structural interlacing."
```
*Note:* This validation enforces structural interlacing integrity for rising-shed looms; it does not substitute for empirical yarn friction or tensile wear testing.

### 6.3 WIF 1.1 Specification Mapping Rules
- File extension: `.wif`
- Syntax: Standard INI formatting (`[SectionName]` followed by `Key=Value` pairs).
- **Indexing Rule:** WIF specifies **1-based indexing** for shafts, treadles, warp ends, and weft picks.
- Colors: Formatted as comma-separated RGB values ($0 \dots 255$).
- **Mandatory WIF 1.1 Sections:**
  - `[WIF]` (Version=1.1, Date, Developers=ThreadLore, Source Program=ThreadLore)
  - `[CONTENTS]` (Lists presence of active sections)
  - `[WEAVING]` (Mandatory: `Shafts=S`, `Treadles=T`, `Rising shed=1`)
  - `[WARP]` (Threads=$W$, Units=Inches | Centimeters | Decipoints, Thickness=...)
  - `[WEFT]` (Threads=$H$, Units=Inches | Centimeters | Decipoints, Thickness=...)
  - `[COLOR PALETTE]` (Entries=2, Range=0,255)
  - `[COLOR TABLE]` (1=Warp RGB, 2=Weft RGB)
  - `[WARP COLORS]` and `[WEFT COLORS]` (Per-thread color references)
  - `[THREADING]` (End $j \rightarrow$ Shaft $s$)
  - `[TIEUP]` (Treadle $t \rightarrow$ comma-separated list of raised shafts)
  - `[TREADLING]` (Pick $i \rightarrow$ Treadle $t$)
  - `[NOTES]` (Numbered 1-based lines containing user-supplied provenance metadata: `1=Title: ...`, `2=Origin: ...`, `3=Artisan: ...`, `4=Period: ...`, `5=Remarks: ...`)
- **Independent Reader Compliance:** Exported `.wif` files must validate cleanly against external tools (Handweaving.net, Asunder/pyweaving) without parser warnings.
- **Practical Repeat Expansion:** User can configure repeat count $K$ (e.g. expand a $4\times4$ master repeat into a $40 \times 40$ thread project draft) so the exported file is directly mountable on a physical loom.

---

## 7. Error Handling, Edge Cases & Mitigations

| Failure Mode | Impact | Root Cause | Automated Mitigation |
|---|---|---|---|
| **Lens Barrel Distortion** | Grid overlay drifts at edges. | Phone camera lens curvature on macro shots. | User crops a small $15\times15$ thread swatch where distortion is mathematically negligible ($< 0.5\%$). |
| **Non-Orthogonal Fabric** | Skewed grid lines (trapezoid). | Fabric is sheared or phone held at an angle. | OpenCV affine deskewer calculates angle $\theta$ and rotates the image to orthogonal alignment. |
| **Unequal Thread Density** | Square grid doesn't fit threads. | Ends Per Inch (EPI) $\ne$ Picks Per Inch (PPI). | Frontend provides independent $\Delta x$ and $\Delta y$ spacing sliders; FFT detects separate X/Y peaks. |
| **Single-Pixel Matrix Typo** | Broken symmetry blows up shafts to 16. | User misclicks on a large grid editor. | UX inversion: User **only edits the $N\times N$ master tile** ($N \le 4$). Symmetry is mathematically enforced by design. |
| **Loom Limit Overflow** | Pattern requires $> 4$ shafts/treadles. | User configured an incompatible pattern (e.g., satin). | Compiler rejects the draft, displays exact shaft count required, and prompts user to select a supported twill or plain weave. |
| **Float Snagging Risk** | Fragile cloth that physically fails. | Long thread runs without interlacing. | Cyclic validator flags runs $> 4$ threads and highlights the offending rows/columns in the UI. |
| **Cloud Run Cold Start** | Initial upload spinner takes $> 10$s. | Container scale-to-zero initialization. | `min-instances: 1` set for the Cloud Run service; lightweight `opencv-python-headless` keeps container $< 250$MB. |

---

## 8. Five-Day Implementation Schedule (Nov 16 – Nov 20)

```
Nov 16 (Today):  [Core Compiler & Math Engine] ───► Test Round-Trip Factorization & WIF 1.1
Nov 17:          [FastAPI Backend & Cloud Run] ───► OpenCV Deskewing + Vertex AI Gemini Integration
Nov 18:          [React Frontend & Canvas]     ───► Master Tile Editor + Live Overlay Sliders
Nov 19:          [Integration & Demo Asset]    ───► End-to-End Tests + 60s Video + PH Assets
Nov 20:          [Launch & Live Submission]    ───► Product Hunt Launch & Contest Opt-in
```

### Day 1: November 16 (Today) — Core Math & Serializer
- [ ] Implement Boolean Matrix Factorization algorithm (`compiler.py`).
- [ ] Implement Cyclic Float Validator (`validator.py`).
- [ ] Implement standards-compliant WIF 1.1 Serializer (`wif_serializer.py`).
- [ ] Write Pytest suite verifying 20 standard drafts (Plain weave, $2/1$ twill, $2/2$ twill, $3/1$ twill).
- [ ] Test `.wif` output in independent external viewer (Handweaving.net parser).

### Day 2: November 17 — Cloud Run Services & AI Integration
- [ ] Build FastAPI application with `/api/swatch` and `/api/compile` endpoints.
- [ ] Implement OpenCV preprocessing pipeline (FFT magnitude spectrum, $\Delta x / \Delta y$ extraction, affine deskew).
- [ ] Implement Vertex AI Gemini 2.0 Flash curation client with structured JSON output.
- [ ] Dockerize application with multi-stage build (`python:3.11-slim`, `opencv-python-headless`).
- [ ] Deploy initial service to Google Cloud Run; verify `/healthz` endpoint.

### Day 3: November 18 — React Frontend & Verification Canvas
- [ ] Set up React + TypeScript + Tailwind CSS project with Vite.
- [ ] Build Swatch Cropper component (1:1 square lock).
- [ ] Build HTML5 Canvas Live Tiled Overlay with interactive $\Delta x$, $\Delta y$, and opacity sliders.
- [ ] Build $2\times2$, $3\times3$, $4\times4$ Master Tile Editor with click-to-toggle cells.
- [ ] Integrate primary warp and weft color pickers.
- [ ] Connect frontend to Cloud Run API.

### Day 4: November 19 — Integration, Demo Recording & Submission Prep
- [ ] End-to-end integration testing across real photographed textile swatches.
- [ ] Set `min-instances: 1` on Cloud Run service.
- [ ] Record high-definition 60–90 second product walkthrough video:
  - 0:00–0:15: Physical fabric & cultural preservation challenge.
  - 0:15–0:35: Swatch upload, OpenCV deskewing, and Gemini pattern curation.
  - 0:35–0:55: Master tile live overlay alignment & instant draft compilation.
  - 0:55–1:15: WIF export downloaded and opened in Handweaving.net.
- [ ] Prepare Product Hunt launch copy, tagline, screenshots, and architecture write-up.
- [ ] Schedule Product Hunt launch for November 20.

### Day 5: November 20 — Launch Day
- [ ] Launch ThreadLore publicly on Product Hunt.
- [ ] Opt into the official Google Cloud Run Hackathon contest.
- [ ] Publish detailed architecture breakdown in the maker comment explaining Cloud Run backend and Vertex AI usage.
- [ ] Monitor Cloud Run metrics, container uptime, and respond to community feedback.

---

## 9. Success Criteria & Judging Scorecard

ThreadLore will be evaluated by the Google Cloud Run engineering team against three core pillars:

1. **"Build for Good" Purpose & Social Impact (Weight: High):**
   - The application demonstrably solves a real problem in cultural heritage preservation.
   - Output files are open, universal, and immediately actionable by physical weavers worldwide.
2. **Technical Architecture on Google Cloud Run (Weight: High):**
   - Real, non-trivial use of Cloud Run: heavy scientific computing (OpenCV FFT and matrix factorization) packaged into a lightweight, fast-booting container.
   - Clean orchestration with Google Cloud services: Vertex AI Gemini 2.0 Flash for semantic multimodal classification and Cloud Storage for stateless image processing.
3. **Execution, Polish & Completeness (Weight: Medium):**
   - Publicly accessible, functioning web application with zero crashes on valid inputs.
   - Generated WIF files open flawlessly in third-party weaving tools without schema errors.
   - Transparent handling of physical constraints (clear explanations when patterns exceed 4 shafts).
