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

### 1.2 Product Vision
**ThreadLore** is an open-access, web-based preservation tool deployed on **Google Cloud Run**. It allows cultural archivists, museum conservators, and hobbyist weavers to photograph a piece of heritage fabric and convert it into a standards-compliant **WIF 1.1 (Weaving Information File)** and a printable 4-part loom draft guide (Threading, Tie-Up, Treadling, and Drawdown).

### 1.3 Hackathon "Build for Good" Alignment
- **Cultural Preservation:** Democratizes textile archaeology by preserving fragile physical artifacts into immortal, open digital formats.
- **Empowering Artisans:** Enables modern weavers to resurrect lost ancestral patterns on standard 4-shaft floor or table looms.
- **Google Cloud Native:** Showcases Cloud Run's serverless container performance (OpenCV image geometry processing) coupled with Vertex AI (Gemini 2.0 Flash multimodal semantic curation).

---

## 2. Scope & Guardrails

To guarantee delivery within the 5-day sprint (Nov 16–Nov 20), strict boundaries are enforced.

### 2.1 In-Scope (MVP)
1. **Supported Weave Structures:**
   - Plain Weave (Tabby): $2\times2$ repeat (2 shafts, 2 treadles)
   - $2/1$ Twill: $3\times3$ repeat (3 shafts, 3 treadles)
   - $2/2$ Balanced Twill: $4\times4$ repeat (4 shafts, 4 treadles)
   - $3/1$ Warp-Faced Twill: $4\times4$ repeat (4 shafts, 4 treadles)
2. **Loom Constraints:** Strictly limited to single-layer rising-shed looms with **maximum 4 shafts and 4 treadles**.
3. **Yarn Color Support:** Dual-color contrast (independent warp yarn color and weft yarn color).
4. **Input Medium:** Macro-photograph swatches (tightly cropped patch of $\approx 15 \times 15$ threads) taken on standard smartphone cameras.
5. **Output Standard:** WIF 1.1 specification files (1-based indexing) with verified round-trip compatibility in external tools (Handweaving.net, Asunder, Fiberworks).

### 2.2 Explicitly Out-of-Scope (Non-Goals)
- **Satin Weaves:** Regular satins require $\ge 5$ shafts (5-end satin minimum) and are excluded to protect the 4-shaft limit.
- **Complex Structures:** Jacquard patterns, double-weave, pile rugs, knitting, crochet, and embroidery.
- **Blind Computer Vision:** No fully automated pixel-by-pixel intersection extraction across uncalibrated photos.
- **3D Physics Simulations:** Procedural cloth drape or yarn mechanics in Three.js (2D canvas preview only).
- **Automated Historical Certification:** ThreadLore assists reconstruction; it does not legally certify tribal or historical authenticity.

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
[ Step 3: Gemini Curation ] ──(Weave Family Classification & Template Pre-Fill)
       │
       ▼
[ Step 4: Master Tile Editor ] ◄──► [ Live Tiled Overlay ] (User Verification Loop)
       │
       ▼
[ Step 5: Python Compiler ] ──(Boolean Factorization: Shafts, Treadles, Tie-Up)
       │
       ▼
[ Step 6: Validation & Export ] ──(Cyclic Floats ≤ 4, Shafts ≤ 4 → WIF 1.1 Download)
```

1. **Upload & Crop:** User uploads a macro photo of the textile. Using a bounding box cropper, the user selects a flat, clean square patch ($\approx 15 \times 15$ threads).
2. **Optical Geometry (Cloud Run):** The backend executes 2D FFT to measure horizontal thread spacing ($\Delta x$) and vertical thread spacing ($\Delta y$), computes skew angle $\theta$, and rectifies perspective.
3. **AI Curation (Vertex AI):** Gemini 2.0 Flash evaluates the deskewed swatch, classifies the weave structure (e.g., "$2/2$ Z-Twill"), auto-selects the $4\times4$ master repeat tile, and drafts a cultural narrative.
4. **Master Tile Verification (React Frontend):** The UI pre-populates the $N \times N$ master tile ($N \in \{2, 3, 4\}$). The user only edits these 4 to 16 cells. The canvas live-tiles the master block directly over the photograph. The user adjusts $\Delta x$ and $\Delta y$ sliders to achieve optical lock.
5. **Deterministic Compilation (Cloud Run):** The user clicks "Compile Draft". The Python backend executes Boolean matrix factorization, resolving column sequences into shafts and row sequences into treadles.
6. **Integrity Validation & Export:** The backend verifies that shafts $\le 4$, treadles $\le 4$, and cyclic floats $\le 4$. Upon validation, the user downloads the standard `.wif` file and views the 4-part loom draft guide.

---

## 4. Functional Requirements

| ID | Feature | Description | Acceptance Criteria |
|---|---|---|---|
| **FR-1** | Swatch Cropper | Interactive browser-based image cropper restricting aspect ratio to 1:1. | User can zoom, pan, and crop a square swatch resized client-side to $\le 800\times800$px before upload. |
| **FR-2** | Optical Deskewing | OpenCV backend detects thread angle and straightens the image. | Returns deskewed image, estimated warp spacing $\Delta x$, weft spacing $\Delta y$, and rotation angle $\theta$. |
| **FR-3** | Zero-Shot AI Curation | Gemini 2.0 Flash classifies the weave structure from the deskewed swatch. | Returns structured JSON containing weave family (`plain`, `twill_2_1`, `twill_2_2`, `twill_3_1`), repeat size $N$, and cultural explanation. |
| **FR-4** | Master Tile Editor | $N \times N$ interactive binary toggle matrix ($N \in \{2, 3, 4\}$). | Clicking a cell toggles binary state (1 = Warp over Weft, 0 = Weft over Warp). Cell count capped at 16 cells max. |
| **FR-5** | Live Tiled Overlay | Semi-transparent rendering of the tiled master matrix directly on top of the original fabric photo. | Master tile replicates across the viewport. Independent sliders for $\Delta x$ (EPI), $\Delta y$ (PPI), and opacity (0–100%). |
| **FR-6** | Color Assignment | User selects primary yarn colors via standard HTML color pickers. | Allows setting `warp_color` and `weft_color` hex values. Maps colors to WIF color palette. |
| **FR-7** | Loom Factorization | Deterministic factorization of binary repeat matrix into loom instructions. | Factoring produces 3 sub-matrices: Threading ($S \times N$), Treadling ($T \times N$), and Tie-Up ($S \times T$). |
| **FR-8** | Constraint Engine | Validates physical loom boundaries and thread float stability. | Rejects matrices requiring $> 4$ shafts or $> 4$ treadles. Rejects matrices with cyclic floats $> 4$. |
| **FR-9** | WIF 1.1 Serialization | Generates standard-compliant `.wif` plain-text file. | Contains sections `[TEXTILE]`, `[WARP]`, `[WEFT]`, `[COLOR TABLE]`, `[WARP COLORS]`, `[WEFT COLORS]`, `[THREADING]`, `[TIEUP]`, `[TREADLING]`. 1-based indexing. Opens in Handweaving.net without errors. |
| **FR-10** | Printable Draft Card | Visual rendering of the 4-part weaving draft. | Displays Threading chart, Tie-Up grid, Treadling sequence, and Drawdown simulation. |

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
- **Model:** `gemini-2.0-flash`
- **Invocation:** Asynchronous REST call via Google GenAI SDK.
- **Structured Output:** Pydantic schema enforcing JSON response:
  ```json
  {
    "weave_family": "twill_2_2",
    "repeat_size": 4,
    "confidence": 0.94,
    "default_matrix": [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1]
    ],
    "cultural_description": "2/2 Balanced Twill exhibiting characteristic 45-degree diagonal wales. Universally used in Scottish tartans and historical Scandinavian woolens for warmth and durability.",
    "float_risk_notes": "All floats are length 2, well within structural integrity thresholds."
  }
  ```

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
   - Assign shaft index to each column: $\text{Shaft}(j) = \text{index of } C_j \text{ in } U_C$.
   - **Constraint:** If $S > 4$, raise `LoomShaftOverflowError`.

2. **Treadle (Treadling) Allocation:**
   - Scan rows $R_i = D_{i,*}$ for $i \in [0, N-1]$.
   - Identify unique row patterns $U_R = \{v_1, v_2, \dots, v_T\}$.
   - The number of treadles required is $T = |U_R|$.
   - Assign treadle index to each pick: $\text{Treadle}(i) = \text{index of } R_i \text{ in } U_R$.
   - **Constraint:** If $T > 4$, raise `LoomTreadleOverflowError`.

3. **Tie-Up Matrix Generation:**
   - Construct tie-up matrix $M \in \{0, 1\}^{S \times T}$.
   - For shaft $s \in [0, S-1]$ and treadle $t \in [0, T-1]$:
     $$M_{s,t} = U_C[s] \odot U_R[t]$$
     where $M_{s,t} = 1$ indicates that pressing treadle $t$ raises shaft $s$.

### 6.2 Cyclic Float Validation Algorithm
Fabric is periodic; thread $N-1$ wraps into thread $0$. A float of length $> 4$ creates loose loops that snag and unravel.

**Algorithm:**
```python
def check_cyclic_floats(matrix: list[list[int]], max_allowed: int = 4) -> bool:
    N = len(matrix)
    # Check horizontal weft floats (consecutive 0s) and warp floats (consecutive 1s)
    for row in matrix:
        doubled = row + row  # Simulates circular boundary
        # Count consecutive identical values up to N
        for val in (0, 1):
            run = 0
            for cell in doubled:
                if cell == val:
                    run += 1
                    if run > max_allowed and run <= N:
                        return False
                else:
                    run = 0
    # Repeat for columns (transposed matrix)
    ...
```

### 6.3 WIF 1.1 Specification Mapping Rules
- File extension: `.wif`
- Syntax: Standard INI formatting (`[SectionName]` followed by `Key=Value` pairs).
- **Indexing Rule:** WIF specifies **1-based indexing** for shafts, treadles, warp ends, and weft picks.
- Colors: Formatted as comma-separated RGB values ($0 \dots 255$).
- Required sections:
  - `[WIF]` (Version=1.1, Date, Developers)
  - `[CONTENTS]` (Lists presence of required sections)
  - `[COLOR TABLE]` (Defines symbol-to-RGB map)
  - `[WARP]` and `[WEFT]` (Thread count, default colors, thickness)
  - `[WARP COLORS]` and `[WEFT COLORS]` (Per-thread color references)
  - `[THREADING]` (End $j \rightarrow$ Shaft $s$)
  - `[TIEUP]` (Treadle $t \rightarrow$ list of raised shafts)
  - `[TREADLING]` (Pick $i \rightarrow$ Treadle $t$)

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
