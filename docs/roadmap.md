# ThreadLore  -  Exhaustive Implementation Roadmap

---

## 1. Project Context & Architectural Invariants

ThreadLore is an AI-assisted textile preservation application engineered for the **Google Cloud Run "Build for Good" Hackathon** (Product Hunt Launch: November 20, 2026).

**Core Positioning:** *"Preserve the weave, not just the photograph."*  
ThreadLore is an **AI-assisted, human-verified weave reconstruction tool** that converts macro photographs of supported woven fabrics into editable, mathematically validated, loom-compatible WIF drafts. It does not attempt automated archaeological discovery or speculative cultural storytelling from pixels alone.

### Architectural Invariants & Scope Rules
- **Loom Harness Limits:** Single-layer rising-shed loom with strictly $\le 4$ shafts and $\le 4$ treadles.
- **Supported Weave Set (11 Canonical Variations):**
  - Plain weave ($1/1$, $2\times2$, 2 shafts, 2 treadles)
  - All 5 straight-twill ratios in both S-twill and Z-twill diagonal directions:
    - $1/2$ Twill (S and Z): $3\times3$ repeat (3 shafts, 3 treadles)
    - $2/1$ Twill (S and Z): $3\times3$ repeat (3 shafts, 3 treadles)
    - $1/3$ Twill (S and Z): $4\times4$ repeat (4 shafts, 4 treadles)
    - $2/2$ Balanced Twill (S and Z): $4\times4$ repeat (4 shafts, 4 treadles)
    - $3/1$ Warp-Faced Twill (S and Z): $4\times4$ repeat (4 shafts, 4 treadles)
  - Satin is strictly excluded ($\ge 5$ shafts).
- **Export Standards:** Standards-compliant WIF 1.1 with 1-based indexing, mandatory `[WEAVING]` section (`Shafts=`, `Treadles=`, `Rising shed=1`), valid physical measurement units (`Inches`, `Centimeters`, `Decipoints`), numbered 1-based `[NOTES]` lines (`1=Title: ...`), dual-color palettes, and user-configurable project repeat dimensions (e.g. $40\times40$). Verified against independent WIF readers. PDF export is excluded for MVP (in-browser visual 4-part draft card provided).
- **AI Operational Role:** Gemini Flash (targeting `gemini-3.8-flash` on Vertex AI, configurable via `GEMINI_MODEL` with fallback to `gemini-2.5-flash`) performs macro-swatch weave classification, suggests a candidate template, and provides technical descriptions of weave mechanics. Its confidence score is treated as an **uncalibrated heuristic suggestion**, not proof of ground truth. If uncertain, it returns `status: "unavailable"` and prompts manual selection. It **never** fabricates cultural origin narratives or extracts raw pixel crossing matrices directly.
- **Cultural Provenance:** Cultural origin, maker/artisan, date/period, and historical context are strictly user-supplied metadata fields preserved in project records and WIF remarks.
- **Computer Vision Role:** OpenCV executes 2D FFT to measure thread spacing ($\Delta x, \Delta y$), calculates skew angle $\theta$, and performs affine rotation deskewing. It does **not** attempt automated over/under crossing classification, and **never invents synthetic measurements** when frequency peaks are ambiguous (returns `spacing_detected: false` with manual slider controls).
- **Editing UX & Canvas Alignment:** User edits a $2\times2$, $3\times3$, or $4\times4$ master repeat tile (max 16 cells). The canvas live-tiles the master block over the photo with draggable $X/Y$ grid origin offsets (`offsetX`, `offsetY`), zoom, angle fine-tuning, and opacity sliders.
- **Physical Interlacing Check:** Enforces cyclic float run lengths $\le 4$ across periodic boundary wrapping ($2N$) and rejects completely uniform rows/columns (threads that never interlace).
- **Mathematical Factorization:** Closed-form deterministic tie-up derivation $M[s,t] = D[i_t, j_s]$ from representative row/column intersections. Tested for $\le 4$ shaft ceilings via an underlying general matrix solver interface (`factor_matrix`).

---

## 2. Complete Master Phase Index

- **Phase 0:** Repository Inception, Workspace Topology & Toolchain Baseline (with CI Setup)
- **Phase 1:** Deterministic Weaving Mathematics, Draft Factorization & Structural Validation
- **Phase 2:** Standards-Compliant WIF 1.1 Serialization & Interoperability Engine
- **Phase 3:** Fast Fourier Transform (FFT) Geometry Profiler & Optical Rectification Engine
- **Phase 4:** Vertex AI Gemini 3.8 Flash Multimodal Technical Curation Client & Schema Gate
- **Phase 5:** FastAPI Core Service Architecture, Orchestration Pipelines & Test Harness
- **Phase 6:** React + TypeScript Frontend Foundation, State Core & Swatch Cropper
- **Phase 7:** Master Repeat Tile Editor, Interactive Canvas Overlay & Phase Alignment Loop
- **Phase 8:** End-to-End Client-Server Orchestration, WIF Delivery & Visual Draft Card
- **Phase 9:** Production Containerization, Google Cloud Run Infrastructure & Cloud Storage
- **Phase 10:** Automated Quality Gate, Adversarial Verification & Load Baseline
- **Phase 11:** Production Documentation, Recruiter Portfolio Polish & Release Readiness

---

## Phase 0: Repository Inception, Workspace Topology & Toolchain Baseline

**Goal:**  
Establish a deterministic, monorepo workspace branching off existing tracked Git history into `develop`, containing isolated Python 3.11 and Node 20 runtime environments, locked dependency trees (including `scipy` and modern `google-genai==3.3.0`), strict code quality tooling (`ruff`, `mypy`, `eslint`, `prettier`), and foundational GitHub Actions CI.

**Dependencies:**
- Python 3.11 installed locally.
- Node.js 20 LTS and `npm` installed locally.
- Git repository tracked at `https://github.com/KenEverestNunes/ThreadLore.git`.

**Files Created / Modified:**
- `.gitignore`  -  Universal ignore rules for Python, Node, OS, IDE, and Cloud artifacts (already established).
- `.editorconfig`  -  Consistent indentation, encoding, and newline rules across IDEs.
- `pyproject.toml`  -  Python packaging, tool configurations for Ruff, Mypy, and Pytest.
- `backend/requirements.txt`  -  Pinned production dependencies for backend service (includes `scipy` and `google-genai==3.3.0`).
- `backend/requirements-dev.txt`  -  Pinned testing and quality analysis dependencies.
- `frontend/package.json`  -  Frontend package definition and build scripts.
- `frontend/tsconfig.json`  -  Strict TypeScript compiler configuration.
- `frontend/tsconfig.node.json`  -  TypeScript configuration for Vite tooling.
- `frontend/vite.config.ts`  -  Vite build and dev server configuration with proxy.
- `frontend/tailwind.config.js`  -  Tailwind CSS token configuration.
- `frontend/postcss.config.js`  -  PostCSS runner configuration.
- `.github/workflows/ci.yml`  -  Initial automated CI testing and linting workflow.
- `Makefile`  -  Standardized developer workflow shortcuts (`make lint`, `make test`, `make run`).

**Implementation Details & Micro-Tasks:**
1. Switch to integration branch: `git checkout -b develop` (and feature branch `feat/core-engine`).
2. Ensure `.gitignore` and `.editorconfig` are active and enforced.
3. Configure `pyproject.toml` targeting Python 3.11, Ruff line length 100, strict Mypy settings with zero `Any` escapes, and Pytest test paths.
4. Pin production dependencies in `backend/requirements.txt`:
   - `fastapi==0.115.5`
   - `uvicorn[standard]==0.32.1`
   - `pydantic==2.10.2`
   - `pydantic-settings==2.6.1`
   - `numpy==1.26.4`
   - `scipy==1.14.1`
   - `opencv-python-headless==4.10.0.84`
   - `google-genai==3.3.0`
   - `google-cloud-storage==2.18.2`
   - `python-multipart==0.0.17`
5. Pin development dependencies in `backend/requirements-dev.txt`: `pytest==8.3.3`, `pytest-asyncio==0.24.0`, `httpx==0.27.2`, `ruff==0.8.0`, `mypy==1.13.0`.
6. Scaffold frontend using Vite with React 18, strict TypeScript, Lucide icons, and Tailwind CSS.
7. Configure initial `.github/workflows/ci.yml` running linting (`ruff`, `eslint`), typing (`mypy`, `tsc`), and test runners on every push.
8. Configure root `Makefile` targets: `setup`, `lint-backend`, `lint-frontend`, `test-backend`, `test-frontend`, `check`, `run`.

**Verification Steps:**
1. Execute `make setup` (or manual `pip install -r backend/requirements.txt -r backend/requirements-dev.txt` and `npm --prefix frontend install`).
2. Run `ruff check backend/` and `mypy backend/` $\rightarrow$ Expect zero errors.
3. Run `npm --prefix frontend run build` $\rightarrow$ Expect clean build into `frontend/dist/`.
4. Run `git status` $\rightarrow$ Confirm zero untracked caches or `.venv` files.

**Recommended Atomic Git Commits:**
- `chore(repo): initialize workspace topology, scipy dependency, and CI baseline`

---

## Phase 1: Deterministic Weaving Mathematics, Draft Factorization & Structural Validation

**Goal:**  
Implement the core mathematical compiler that factors arbitrary $2\times2$, $3\times3$, and $4\times4$ binary drawdown matrices into valid physical loom components (Threading, Treadling, and Tie-Up matrices) using exact closed-form derivation $M[s,t] = D[i_t, j_s]$, enforces 4-shaft/4-treadle limits, expands repeat counts for practical weaving, and cyclically validates float and interlacing boundaries.

**Dependencies:**
- Phase 0 completed.
- `numpy==1.26.4` and `pytest==8.3.3` active in `.venv`.

**Files Created / Modified:**
- `backend/app/core/__init__.py`  -  Package export interface.
- `backend/app/core/types.py`  -  Strongly typed domain models, enums (11 canonical weaves), provenance metadata, and matrix definitions.
- `backend/app/core/compiler.py`  -  Boolean matrix factorization algorithm deriving shafts, treadles, exact tie-up $M[s,t] = D[i_t, j_s]$, and project repeat expansion.
- `backend/app/core/validator.py`  -  Structural interlacing validator (uniform row/col rejection) and cyclic float counter ($2N$ toroidal wrap).
- `backend/tests/conftest.py`  -  Pytest fixtures for all 11 canonical ground-truth weave matrices and edge cases.
- `backend/tests/test_compiler.py`  -  Mathematical round-trip, factorization, and repeat expansion unit tests.
- `backend/tests/test_validator.py`  -  Boundary unit tests for uniform row/col detection, cyclic float limits, and shaft overflow.

**Implementation Details & Micro-Tasks:**
1. Define domain types in `backend/app/core/types.py`:
   - `WeaveFamily` enum supporting all 11 canonical variations: `plain_1_1`, `twill_1_2_s`, `twill_1_2_z`, `twill_2_1_s`, `twill_2_1_z`, `twill_1_3_s`, `twill_1_3_z`, `twill_2_2_s`, `twill_2_2_z`, `twill_3_1_s`, `twill_3_1_z`, and `custom`.
   - `ProvenanceMetadata` model: `title: str`, `origin: str | None`, `maker: str | None`, `date_period: str | None`, `notes: str | None`.
   - `BinaryMatrix` ($list[list[int]]$), `LoomDraft` (with 1-based indexing for threading, treadling, and tie-up), and `ValidationResult`.
2. Implement `factor_matrix(matrix: BinaryMatrix) -> LoomDraft` and `factor_drawdown(drawdown: BinaryMatrix, repeat_warp: int = 1, repeat_weft: int = 1) -> LoomDraft` in `backend/app/core/compiler.py`:
   - `factor_matrix`: General Boolean factorization engine. Groups unique columns into shafts ($S = |U_C|$) and unique rows into treadles ($T = |U_R|$). Derives Tie-Up $M[s,t] = D[i_t, j_s]$. Raises `LoomShaftOverflowError` if $S > 4$ and `LoomTreadleOverflowError` if $T > 4$.
   - `factor_drawdown`: Public API wrapper validating master repeat dimensions ($N \in \{2, 3, 4\}$) and binary values ($0$ or $1$). Calls `factor_matrix` and executes repeat expansion ($W = N \times repeat\_warp$, $H = N \times repeat\_weft$).
   - Simulates drawdown $D'$ from generated draft and asserts $D' \equiv D$ identically (100% mathematical round-trip proof).
3. Implement `validate_draft(draft: LoomDraft, matrix: BinaryMatrix, max_float: int = 4) -> ValidationResult` in `backend/app/core/validator.py`:
   - Checks shaft ceiling: $S \le 4$. Rejects if $S > 4$.
   - Checks treadle ceiling: $T \le 4$. Rejects if $T > 4$.
   - Interlacing check: Rejects completely uniform rows or columns (yarns that never interlace).
   - Cyclic float check: Checks contiguous identical runs across doubled arrays ($2N$ wrap). Enforces max cyclic float $\le 4$.
   - Clarifies float validation as structural weave stability, distinguishing it from empirical fabric durability.
4. Configure Pytest fixtures in `backend/tests/conftest.py` covering all 11 canonical weaves, uniform row/col edge cases, and a 5-end satin ($5\times5$) fixture.
5. Implement unit tests in `test_compiler.py` and `test_validator.py` verifying exact shaft counts, tie-up matrices, cyclic float calculations, and rejection of over-limit drafts (calling `factor_matrix` directly with 5-end satin to verify 5-shaft overflow rejection without conflicting with master tile $N \le 4$ constraints).

**Verification Steps:**
1. Run `pytest backend/tests/test_compiler.py -v` $\rightarrow$ Expect 100% passing tests (including 5-shaft overflow test).
2. Run `pytest backend/tests/test_validator.py -v` $\rightarrow$ Expect 100% passing tests.
3. Run `mypy backend/app/core/` and `ruff check backend/app/core/`.

**Recommended Atomic Git Commits:**
- `feat(weave): implement boolean matrix draft compiler with closed-form tie-up factorization`
- `feat(validation): implement cyclic float and structural interlacing validator`

---

## Phase 2: Standards-Compliant WIF 1.1 Serialization & Interoperability Engine

**Goal:**  
Develop a zero-dependency WIF 1.1 serializer that converts compiled `LoomDraft` objects, yarn colors, project repeat counts, and user provenance metadata into standards-compliant plain text files using the official `[WEAVING]` specification, valid physical units (`Inches`, `Centimeters`, `Decipoints`), and numbered `[NOTES]` lines, accompanied by an independent round-trip parser and external reader verification.

**Dependencies:**
- Phase 1 completed (`LoomDraft` active).

**Files Created / Modified:**
- `backend/app/core/wif.py`  -  WIF 1.1 serializer and validation parser.
- `backend/tests/test_wif.py`  -  Compliance, indexing, physical units, color palette, independent reader verification, and round-trip tests.

**Implementation Details & Micro-Tasks:**
1. Implement strict conformance with official WIF 1.1 specification:
   - Line delimiter: Windows CRLF (`\r\n`).
   - 1-based indexing for ends, picks, shafts, treadles, and colors.
   - Mandatory sections: `[WIF]`, `[CONTENTS]`, `[WEAVING]` (`Shafts=`, `Treadles=`, `Rising shed=1`), `[WARP]`, `[WEFT]`, `[COLOR PALETTE]`, `[COLOR TABLE]`, `[WARP COLORS]`, `[WEFT COLORS]`, `[THREADING]`, `[TIEUP]`, `[TREADLING]`, `[NOTES]`.
   - Physical units: `Units=Inches`, `Centimeters`, or `Decipoints` exclusively (never `Pixels`).
   - Numbered `[NOTES]` section: `1=Title: ...`, `2=Origin: ...`, `3=Artisan: ...`, `4=Period: ...`, `5=Remarks: ...`.
2. Implement dual-color palette serialization mapping hex colors to 8-bit integer RGB tuples (`Range=0,255`).
3. Embed optional user-supplied provenance metadata in `[NOTES]` section using standard numbered line formatting.
4. Implement practical repeat expansion so users can export full-sized projects (e.g. 40 ends $\times$ 40 picks) rather than isolated 4-thread repeats.
5. Implement `serialize_wif(draft: LoomDraft, warp_hex: str, weft_hex: str, provenance: ProvenanceMetadata | None, units: str = "Centimeters") -> str`.
6. Implement `parse_wif(wif_text: str) -> LoomDraft` using Python `configparser` to parse sections, re-simulate the drawdown, and prove 100% round-trip fidelity.
7. Author comprehensive unit tests in `test_wif.py`:
   - Strict `[WEAVING]` section verification (`Rising shed=1`).
   - Valid physical units check (`Units in {"Inches", "Centimeters", "Decipoints"}`).
   - Numbered `[NOTES]` line formatting check.
   - External parser compatibility: validate exported WIF files against an independent WIF reader / parsing grammar (not just ThreadLore's parser).
   - Round-trip identity on all 11 canonical weaves.
   - 1-based indexing verification (assert absence of `0=` keys).
   - CRLF binary line ending verification.

**Verification Steps:**
1. Run `pytest backend/tests/test_wif.py -v` $\rightarrow$ Confirm all compliance and round-trip tests pass.
2. Inspect serialized twill sample output to verify header, `[WEAVING]`, valid physical units, and numbered `[NOTES]` formatting.

**Recommended Atomic Git Commits:**
- `feat(wif): implement WIF 1.1 serializer with WEAVING section, physical units, and repeat expansion`
- `test(wif): add compliance parser and external reader verification tests`

---

## Phase 3: Fast Fourier Transform (FFT) Geometry Profiler & Optical Rectification Engine

**Goal:**  
Build an image preprocessing and frequency-domain analysis engine using OpenCV, NumPy, and SciPy that rectifies textile rotation skew and measures independent horizontal ($\Delta x$) and vertical ($\Delta y$) thread spacing from macro photographic swatches, reporting an uncertain status rather than inventing synthetic measurements when peaks are ambiguous.

**Dependencies:**
- Phase 0 completed.
- `opencv-python-headless==4.10.0.84`, `numpy==1.26.4`, and `scipy==1.14.1` active in `.venv`.

**Files Created / Modified:**
- `backend/app/cv/__init__.py`  -  Package exports.
- `backend/app/cv/preprocessor.py`  -  Color space transforms, bilateral filtering, CLAHE contrast enhancement, and affine image rotation deskewing.
- `backend/app/cv/fft_profiler.py`  -  2D Fast Fourier Transform, magnitude spectrum computation, and harmonic peak detection for $\Delta x$ and $\Delta y$.
- `backend/tests/fixtures/synthetic_textiles.py`  -  Deterministic synthetic image generator for plain weave and twill fabrics with known ground-truth thread counts and rotation angles.
- `backend/tests/test_cv.py`  -  Unit tests verifying frequency detection, rotation correction, and edge-case handling.

**Implementation Details & Micro-Tasks:**
1. Author `generate_synthetic_weave` in `backend/tests/fixtures/synthetic_textiles.py` to produce mathematical sinusoidal weave images with configurable angles, thread spacing, and Gaussian noise.
2. Implement `ImagePreprocessor` in `backend/app/cv/preprocessor.py`:
   - `decode_and_validate`: Decodes bytes, checks minimum resolution ($100\times100$px), and caps maximum dimension at $800$px using `cv2.INTER_AREA`.
   - `enhance_contrast`: Converts to LAB, applies CLAHE on $L$-channel (`clipLimit=2.0, tileGridSize=(8,8)`).
   - `suppress_fuzz`: Bilateral filtering (`d=7, sigmaColor=50, sigmaSpace=50`) to remove fiber noise without blurring thread boundaries.
   - `rotate_image`: Affine rotation matrix with border-reflect padding.
3. Implement `FFTProfiler` in `backend/app/cv/fft_profiler.py`:
   - `compute_spectrum`: Applies 2D Hanning window, runs 2D FFT (`np.fft.fft2`), shifts DC component (`np.fft.fftshift`), computes log magnitude spectrum.
   - `detect_dominant_angle`: Analyzes principal frequency components, extracts skew angle $\theta$ relative to nearest orthogonal axis.
   - `estimate_thread_spacing`: Integrates 1D orthogonal projection profiles, uses `scipy.signal.find_peaks` with prominence thresholding, and extracts fundamental spatial frequencies.
   - **Never Invent Measurements:** If peaks are ambiguous or Prominence $< Threshold$, sets `spacing_detected: false`, `dx_px: None`, `dy_px: None` and status `uncertain`. Does **not** invent a synthetic measurement like 20.0px. Prompts weaver to adjust spacing manually via UI sliders.
   - *Phase Ambiguity Handling:* Explicitly document that FFT measures frequency $(\Delta x, \Delta y)$ but cannot establish spatial phase origin $(x_0, y_0)$; spatial phase alignment is delegated to the interactive canvas overlay via draggable origin offsets.
4. Author unit tests in `test_cv.py` for plain weave, twill, asymmetric density ($EPI \ne PPI$), rotated samples, blank image buffers, low-contrast uncertain fallbacks, and corrupted inputs.

**Verification Steps:**
1. Run `pytest backend/tests/test_cv.py -v` $\rightarrow$ Confirm all frequency, angle, and edge-case tests pass.
2. Execute benchmark script validating detected spacing within $\pm 1.5$px of ground truth on clean swatches, and asserting `spacing_detected == False` on low-contrast/noise swatches.

**Recommended Atomic Git Commits:**
- `feat(cv): implement optical preprocessor with bilateral filtering and deskewing`
- `feat(cv): implement 2D FFT thread spacing profiler with scipy peak detection and uncertain fallback`

---

## Phase 4: Vertex AI Gemini 3.8 Flash Multimodal Technical Curation Client & Schema Gate

**Goal:**  
Integrate the Google GenAI SDK (`google-genai==3.3.0`) to call `gemini-3.8-flash` on Vertex AI (with configurable model and endpoint location), classifying textile weave structures from macro swatch images, suggesting canonical template presets, explaining technical weave mechanics, and treating confidence as an uncalibrated heuristic suggestion with graceful fallback to manual pattern selection if uncertain.

**Dependencies:**
- Phase 1 completed (`types.py` active).
- `google-genai==3.3.0` and `pydantic==2.10.2` installed in `.venv`.
- GCP Project ID and Vertex AI API access configured.

**Files Created / Modified:**
- `backend/app/config.py`  -  Environment configuration management using `pydantic-settings` (`GEMINI_MODEL`, `LOCATION`).
- `backend/app/ai/__init__.py`  -  Package exports.
- `backend/app/ai/gemini_curator.py`  -  Multimodal Gemini client, prompt definitions, and structured response parser.
- `backend/tests/test_gemini.py`  -  Unit tests using mock replay fixtures and gated live integration tests.

**Implementation Details & Micro-Tasks:**
1. Implement `Settings` in `backend/app/config.py` reading:
   - `PROJECT_ID: str = "threadlore-prod"`
   - `LOCATION: str = "global"` (or `us-central1`, decoupled from Cloud Run region)
   - `GEMINI_MODEL: str = "gemini-3.8-flash"` (configurable via environment variable)
   - `GCS_BUCKET_NAME: str = "threadlore-swatches-prod"`
   - `MAX_UPLOAD_SIZE_BYTES: int = 2097152`
   - `CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8080"]`
2. Define `GeminiWeaveSuggestion` Pydantic model with strict field validators:
   - `status: Literal["success", "unavailable"]`
   - `weave_family: WeaveFamily`
   - `twill_direction: Literal["S", "Z"] | None`
   - `repeat_size: int` ($N \in \{2, 3, 4\}$)
   - `confidence: float` (treated strictly as an **uncalibrated heuristic score**)
   - `default_matrix: list[list[int]] | None`
   - `technical_description: str`
   - `float_risk_notes: str | None`
3. Implement `GeminiCurator` in `backend/app/ai/gemini_curator.py`:
   - Initialize Vertex AI GenAI client using `google.genai.Client`.
   - Author prompt focusing strictly on physical weave mechanics, twill float intervals, and diagonal orientation. Explicitly prohibit generating cultural origin or ethnic ancestry narratives.
   - Enforce structured JSON schema output matching `GeminiWeaveSuggestion`.
   - Implement exponential backoff retry (max 2 retries) and timeout management (8-second ceiling).
   - Implement graceful fallback: If confidence $< 0.60$ or API fails, returns `status: "unavailable"` and prompts user to pick from the 11 supported presets or configure manually. **Never invent a pattern with artificial confidence.**
4. Author unit tests in `test_gemini.py` covering successful schema deserialization, malformed LLM response rejection, timeout handling, unavailable fallback path, and verify a real multimodal structured-output request against Vertex AI when configured.

**Verification Steps:**
1. Run `pytest backend/tests/test_gemini.py -v -m "not integration"` $\rightarrow$ Verify 100% pass on mocked responses and error handling.
2. Verify `mypy backend/app/ai/` and `ruff check backend/app/ai/`.

**Recommended Atomic Git Commits:**
- `feat(ai): define Gemini curation schemas and Pydantic validation models`
- `feat(ai): implement Vertex AI Gemini Flash curation client with manual selection fallback`

---

## Phase 5: FastAPI Core Service Architecture, Orchestration Pipelines & Test Harness

**Goal:**  
Assemble the computer vision, AI technical curation, compiler, and WIF serialization engines into a production-grade FastAPI application featuring stateless endpoints, CORS security, request validation, error handling, repeat expansion, and end-to-end integration tests.

**Dependencies:**
- Phase 1, 2, 3, and 4 completed.
- `fastapi==0.115.5`, `uvicorn==0.32.1`, `httpx==0.27.2` active.

**Files Created / Modified:**
- `backend/app/__init__.py`  -  Root package exports.
- `backend/app/api/__init__.py`  -  API routing module.
- `backend/app/api/schemas.py`  -  REST request and response DTO schemas (including `ProvenanceMetadata`).
- `backend/app/api/routes_swatch.py`  -  Endpoint for photo upload, CV deskewing, and Gemini technical curation (with `unavailable` fallback).
- `backend/app/api/routes_compile.py`  -  Endpoint for master tile compilation, repeat expansion, validation, and WIF generation.
- `backend/app/api/server.py`  -  FastAPI application instantiation, middleware, and lifecycle handlers.
- `backend/tests/test_api.py`  -  Comprehensive API integration tests using Starlette/HTTPX `TestClient`.

**Implementation Details & Micro-Tasks:**
1. Define REST DTO schemas in `backend/app/api/schemas.py`:
   - `ProvenanceMetadata`: `title: str`, `origin: str | None`, `maker: str | None`, `date_period: str | None`, `notes: str | None`.
   - `SwatchAnalysisResponse`: `status: str`, `weave_family: WeaveFamily`, `twill_direction: str | None`, `repeat_size: int`, `confidence: float` (uncalibrated heuristic indicator), `default_matrix: list[list[int]] | None`, `technical_description: str`, `float_risk_notes: str | None`, `dx_px: float | None`, `dy_px: float | None`, `spacing_detected: bool`, `rotation_degrees: float`.
   - `CompileDraftRequest`: `matrix: list[list[int]]`, `warp_color_hex: str = "#1E293B"`, `weft_color_hex: str = "#E2E8F0"`, `repeat_warp: int = 10`, `repeat_weft: int = 10`, `provenance: ProvenanceMetadata | None = None`.
   - `CompileDraftResponse`: `draft: LoomDraft`, `is_valid: bool`, `validation_errors: list[str]`, `wif_text: str`.
2. Implement `POST /api/swatch` in `routes_swatch.py`:
   - Validates upload MIME type (`image/jpeg`, `image/png`) and size limit ($\le 2$MB).
   - Executes preprocessor decoding, contrast enhancement, FFT orientation/spacing profiling, and affine rotation deskewing.
   - If FFT peak detection fails, sets `spacing_detected: false`, `dx_px: null`, `dy_px: null` and returns `status: "uncertain"` without synthetic spacing guesses.
   - Encodes rectified swatch to JPEG in memory and dispatches to `GeminiCurator`.
   - If Gemini confidence $< 0.60$ or API fails, returns `status: "unavailable"` and prompts user manual selection.
3. Implement `POST /api/compile` in `routes_compile.py`:
   - Ingests `CompileDraftRequest`, factors matrix, checks uniform row/col interlacing and cyclic floats, executes repeat expansion, serializes WIF text with `[WEAVING]` and user provenance, and returns `CompileDraftResponse`.
4. Implement `POST /api/download-wif`: Streams generated WIF file with `Content-Disposition: attachment; filename="threadlore_draft.wif"`.
5. Assemble `app` in `server.py` with CORS middleware, global exception handlers, and `GET /healthz` endpoint.
6. Author comprehensive API integration tests in `test_api.py` covering health check, image uploads, oversized payload rejection, twill compilation, shaft overflow rejection, uniform row/col rejection, repeat expansion, and WIF download streams.

**Verification Steps:**
1. Run `pytest backend/tests/ -v` $\rightarrow$ Confirm all unit and integration tests pass.
2. Launch server locally with `uvicorn` and probe `/healthz` and `/api/compile` with `curl`.
3. Verify `ruff check backend/` and `mypy backend/`.

**Recommended Atomic Git Commits:**
- `feat(api): define REST DTO schemas with provenance and compile endpoints`
- `feat(api): implement swatch analysis endpoint and server assembly`
- `test(api): add comprehensive HTTP integration test harness`

---

## Phase 6: React + TypeScript Frontend Foundation, State Core & Swatch Cropper

**Goal:**  
Establish the React client architecture, TypeScript domain contracts, centralized application state store, provenance metadata capture, and an interactive 1:1 square macro-swatch cropper with client-side image compression.

**Dependencies:**
- Phase 0 completed (Frontend toolchain initialized).
- Phase 5 completed (Backend API contracts defined in `schemas.py`).

**Files Created / Modified:**
- `frontend/src/types/weave.ts`  -  TypeScript interfaces matching backend DTO schemas (11 canonical weaves + provenance).
- `frontend/src/services/api.ts`  -  HTTP client service wrapping `fetch` with error boundaries.
- `frontend/src/context/WeaveContext.tsx`  -  React Context and custom hook for workflow state.
- `frontend/src/components/CaptureGuidance.tsx`  -  Modal displaying macro photography instructions and human-in-the-loop workflow.
- `frontend/src/components/ProvenanceForm.tsx`  -  Optional form for user-supplied textile origin, maker, date, and history.
- `frontend/src/components/SwatchCropper.tsx`  -  Interactive square cropping component.
- `frontend/src/index.css`  -  Global monochrome styles and canvas reset.

**Implementation Details & Micro-Tasks:**
1. Define strict TypeScript interfaces in `frontend/src/types/weave.ts`: `WeaveFamily` (11 variations), `ProvenanceMetadata`, `BinaryMatrix`, `SwatchAnalysisResponse`, `CompileDraftRequest`, `CompileDraftResponse`, `WorkflowStep`.
2. Implement HTTP service in `frontend/src/services/api.ts` with `analyzeSwatch()`, `compileDraft()`, and `downloadWifFile()`.
3. Implement `WeaveContext` in `frontend/src/context/WeaveContext.tsx` managing workflow lifecycle, raw image, cropped blob, analysis response, master tile state, colors, project repeat dimensions, user provenance metadata, and compilation outputs.
4. Implement `CaptureGuidance` modal explaining macro lighting, flatness, focus, minimum thread density ($15\times15$), and the human verification step.
5. Implement `ProvenanceForm` capturing optional user-supplied cultural and historical metadata without automated AI speculation.
6. Implement `SwatchCropper` using HTML5 Canvas enforcing strict $1:1$ aspect ratio, bounding box repositioning, client-side downscaling to $\le 800\times800$px, and JPEG blob export.

**Verification Steps:**
1. Run `npm --prefix frontend run lint` and `npm --prefix frontend run build` $\rightarrow$ Confirm zero errors.
2. Test image upload and verify cropper enforces 1:1 square aspect ratio and exports compressed JPEG.

**Recommended Atomic Git Commits:**
- `feat(ui): define TypeScript domain types and API client service`
- `feat(ui): implement WeaveContext store, provenance form, and swatch cropper`

---

## Phase 7: Master Repeat Tile Editor, Interactive Canvas Overlay & Phase Alignment Loop

**Goal:**  
Develop the interactive verification interface: an $N \times N$ master repeat tile editor ($N \in \{2, 3, 4\}$, max 16 toggle cells) with presets for all 11 supported weaves, and a high-performance HTML5 Canvas component that live-tiles the master block over the rectified photograph with independent $\Delta x$ / $\Delta y$ density sliders and draggable $X/Y$ grid phase alignment.

**Dependencies:**
- Phase 6 completed (`WeaveContext` active).

**Files Created / Modified:**
- `frontend/src/components/MasterTileEditor.tsx`  -  Interactive $N \times N$ toggle grid with repeat size selector and 11-weave preset dropdown.
- `frontend/src/components/ColorPickerRow.tsx`  -  Independent warp and weft yarn color selectors.
- `frontend/src/components/CanvasOverlay.tsx`  -  HTML5 Canvas rendering rectified photo with live tiled weave pattern and draggable phase alignment ($X/Y$ offset).
- `frontend/src/components/VerificationPanel.tsx`  -  Container orchestrating the live feedback loop.

**Implementation Details & Micro-Tasks:**
1. Implement `MasterTileEditor` in `frontend/src/components/MasterTileEditor.tsx`:
   - Preset selector for all 11 canonical weaves: Plain (1/1), 1/2 Twill (S/Z), 2/1 Twill (S/Z), 1/3 Twill (S/Z), 2/2 Twill (S/Z), 3/1 Twill (S/Z), and custom blank.
   - Interactive $N \times N$ CSS grid capped at 16 cells max ($N \in \{2, 3, 4\}$).
   - Click toggles cell between `1` (warp over) and `0` (weft over) with visual yarn glyphs and color styling.
2. Implement `ColorPickerRow` in `frontend/src/components/ColorPickerRow.tsx` with warp and weft color pickers and preset palettes (Indigo/Ecru, Tartan Red/Green, Heritage Wool).
3. Implement `CanvasOverlay` in `frontend/src/components/CanvasOverlay.tsx`:
   - Draws rectified photo background.
   - Enables dragging/panning directly on canvas to adjust grid origin offsets (`offsetX`, `offsetY`), solving optical phase alignment over yarn crossings.
   - Live-tiles master repeat pattern with transparency slider ($\alpha \in [0, 1]$), scale slider, angle fine-tuning ($\pm 5^\circ$), and independent $\Delta x$ (EPI) and $\Delta y$ (PPI) sliders.
4. Implement `VerificationPanel` connecting master tile updates to live canvas redraws in real time ($< 16$ms).

**Verification Steps:**
1. Launch frontend dev server: `npm --prefix frontend run dev`.
2. Select presets $\rightarrow$ Verify master tile updates. Toggle cell $\rightarrow$ Verify live canvas overlay instantly updates.
3. Drag canvas overlay $\rightarrow$ Confirm grid origin offsets ($X/Y$) shift pattern over photograph threads.
4. Move $\Delta x$ and $\Delta y$ sliders $\rightarrow$ Confirm smooth thread density adjustments.

**Recommended Atomic Git Commits:**
- `feat(editor): implement MasterTileEditor with 11-weave presets and manual fallback`
- `feat(editor): implement live tiled Canvas overlay with draggable phase offsets and dx/dy sliders`

---

## Phase 8: End-to-End Client-Server Orchestration, WIF Delivery & Visual Draft Card

**Goal:**  
Wire the complete frontend user journey to the FastAPI backend, implementing the 4-part visual loom draft card (Threading, Tie-Up, Treadling, Drawdown), project repeat count configuration, WIF file download trigger, provenance metadata embedding, and comprehensive error feedback.

**Dependencies:**
- Phase 5 completed (FastAPI server active).
- Phase 6 and 7 completed (React components active).

**Files Created / Modified:**
- `frontend/src/components/DraftCard.tsx`  -  Standard 4-part loom draft visualization.
- `frontend/src/components/WeaveNotes.tsx`  -  Technical weave explanation and user-supplied provenance display.
- `frontend/src/components/ExportToolbar.tsx`  -  Project repeat counts, WIF 1.1 download button, and reset actions.
- `frontend/src/components/ConstraintAlert.tsx`  -  Error banner explaining loom limit, uniform thread, or float violations.
- `frontend/src/App.tsx`  -  Main application shell orchestrating the 6-step workflow.
- `frontend/src/App.test.tsx`  -  Frontend integration tests using Vitest and React Testing Library.

**Implementation Details & Micro-Tasks:**
1. Implement `DraftCard` rendering universal 4-part loom draft: Threading (top-left), Tie-Up (top-right), Treadling (bottom-right), and Drawdown (bottom-left) with crisp monochrome styling.
2. Implement `WeaveNotes` displaying Gemini technical weave explanation, detected twill direction, float stability notes, and user-supplied provenance metadata.
3. Implement `ConstraintAlert` for shaft overflow ($> 4$), treadle overflow ($> 4$), uniform threads (no interlacing), or excessive cyclic floats ($> 4$).
4. Implement `ExportToolbar` allowing configuration of project repeats (e.g. 10x repeat $\rightarrow$ 40 warp ends $\times$ 40 weft picks) and triggering direct WIF 1.1 download.
5. Assemble full user journey in `frontend/src/App.tsx`: Upload $\rightarrow$ Geometry & Suggestion $\rightarrow$ Verify & Align Master Tile $\rightarrow$ Loom Draft & WIF Export.
6. Author integration tests in `App.test.tsx` validating step progression, manual fallback on `unavailable` suggestion, and error banner rendering.

**Verification Steps:**
1. Start backend and frontend servers locally.
2. Walk through complete workflow: upload sample macro photo $\rightarrow$ verify suggestion or pick preset $\rightarrow$ align grid with $X/Y$ drag and $\Delta x/\Delta y$ $\rightarrow$ click Compile $\rightarrow$ verify 4-part draft renders $\rightarrow$ configure $40\times40$ project repeat $\rightarrow$ download WIF 1.1 file.
3. Run `npm --prefix frontend run test`.

**Recommended Atomic Git Commits:**
- `feat(ui): implement 4-part loom draft card and weave notes panel`
- `feat(ui): orchestrate full end-to-end workflow with repeat configuration in App component`

---

## Phase 9: Production Containerization, Google Cloud Run Infrastructure & Cloud Storage

**Goal:**  
Package the unified full-stack application into an optimized, multi-stage Docker container where FastAPI serves both the REST API and the compiled React SPA, and deploy it to Google Cloud Run with Vertex AI permissions and Cloud Storage integration.

**Dependencies:**
- Phase 5 (FastAPI backend) and Phase 8 (React frontend) completed.
- Google Cloud SDK (`gcloud`) CLI installed and authenticated.
- Active GCP Project with billing enabled.

**Files Created / Modified:**
- `Dockerfile`  -  Production multi-stage build container.
- `docker-compose.yml`  -  Local production container simulation.
- `.dockerignore`  -  Build context exclusions.
- `backend/app/storage/gcs.py`  -  Cloud Storage client for raw swatch archiving.
- `backend/app/api/server.py`  -  Updated to mount compiled frontend static files and serve SPA fallback.
- `deploy.sh`  -  Automated deployment script using Google Cloud CLI.

**Implementation Details & Micro-Tasks:**
1. Update `backend/app/api/server.py` to mount compiled static assets under `/assets` and serve `index.html` fallback for client routes while preserving `/api/*` and `/healthz`.
2. Implement `StorageService` in `backend/app/storage/gcs.py` to upload swatches to `gs://threadlore-swatches-prod` with 24-hour auto-deletion lifecycle.
3. Construct multi-stage `Dockerfile`:
   - Stage 1: `node:20-alpine` builds React frontend into `/build/dist`.
   - Stage 2: `python:3.11-slim` installs system libraries (`libglib2.0-0`, `libgomp1`), installs Python requirements (`opencv-python-headless`), copies backend code, copies Stage 1 static build into `/app/static`, and sets `uvicorn` entrypoint on port `8080`.
   - Final container image size: $\approx 245$MB.
4. Author `docker-compose.yml` for local container simulation.
5. Author `deploy.sh` script automating project setup, enabling GCP APIs (`run`, `artifactregistry`, `aiplatform`, `storage`), running Cloud Build, and executing `gcloud run deploy` with `min-instances: 1`, `memory: 1Gi`, `cpu: 1`, and `concurrency: 80`.
6. Configure IAM permissions for Cloud Run service account: `roles/aiplatform.user` and `roles/storage.objectAdmin`.

**Verification Steps:**
1. Build container locally: `docker build -t threadlore:local .`
2. Run local container and verify `GET http://localhost:8080/healthz` returns healthy and root `GET /` serves React SPA.
3. Execute `deploy.sh` and verify live Cloud Run URL functions with SSL.

**Recommended Atomic Git Commits:**
- `feat(storage): implement Google Cloud Storage swatch archive client`
- `build(infra): create multi-stage Dockerfile and SPA static mounting`
- `ci(infra): add automated Google Cloud Run deployment script`

---

## Phase 10: Automated CI/CD Pipelines, Adversarial Verification & Load Baseline

**Goal:**  
Establish automated GitHub Actions CI workflows for linting, type-checking, unit testing, container build validation, and adversarial edge-case verification across extreme textile inputs.

**Dependencies:**
- Phase 0 through Phase 9 completed.

**Files Created / Modified:**
- `.github/workflows/ci.yml`  -  Extended GitHub Actions workflow with container build and full matrix testing.
- `backend/tests/test_adversarial.py`  -  Adversarial stress tests (extreme noise, blank images, invalid WIF payloads).
- `scripts/verify_wif_handweaving.py`  -  Automated verification script testing generated WIFs against external parsing rules.

**Implementation Details & Micro-Tasks:**
1. Extend the baseline `.github/workflows/ci.yml` established in Phase 0 by adding:
   - `container-verify`: Validates multi-stage Dockerfile compilation via `docker/build-push-action`.
   - `wif-external-verify`: Executes `python scripts/verify_wif_handweaving.py` to ensure WIF interoperability against independent specification rules.
2. Implement adversarial stress tests in `backend/tests/test_adversarial.py`:
   - Pure black and pure white image inputs (graceful default handling).
   - High-frequency noise inputs.
   - Micro-resolution ($10\times10$px) and oversized uploads ($50$MB, 413 rejection).
   - Incompatible 5-shaft matrix (clear rejection).
   - Malicious cyclic float matrix (unbroken float rejection).
3. Author `scripts/verify_wif_handweaving.py` validating generated WIFs against Handweaving.net compliance rules.

**Verification Steps:**
1. Run `pytest backend/tests/test_adversarial.py -v` $\rightarrow$ 100% pass.
2. Run `python scripts/verify_wif_handweaving.py` $\rightarrow$ 100% pass.
3. Push to GitHub and verify all GitHub Actions workflow jobs pass green.

**Recommended Atomic Git Commits:**
- `test(adversarial): add stress tests for image edge cases and float boundaries`
- `ci: add GitHub Actions workflow for linting, testing, and container build`

---

## Phase 11: Production Documentation, Recruiter Portfolio Polish & Release Readiness

**Goal:**  
Author comprehensive technical documentation, architecture specifications, reproducible developer setup guides, demo walk-through scripts, and final recruiter portfolio presentation assets.

**Dependencies:**
- Phase 0 through Phase 10 completed and verified.

**Files Created / Modified:**
- `README.md`  -  Production-grade project overview and recruiter landing page.
- `docs/architecture.md`  -  Deep technical architecture breakdown with diagrams.
- `docs/wif_spec_guide.md`  -  Weaving Information File standard compliance explanation.
- `SECURITY.md`  -  Vulnerability reporting and security posture.
- `CONTRIBUTING.md`  -  Developer setup, code standards, and PR guidelines.
- `LICENSE`  -  MIT License declaration.
- `.env.example`  -  Template environment variables.

**Implementation Details & Micro-Tasks:**
1. Author `README.md` with:
   - Technology badges (FastAPI, React, TypeScript, OpenCV, Vertex AI, Cloud Run, Pytest, MIT).
   - 10-second value proposition for cultural heritage preservation.
   - Embedded high-res architecture diagram (`docs/assets/threadlore_architecture.png`).
   - Core features breakdown.
   - One-command quickstart (`make setup && make run`).
   - API reference table (`/healthz`, `/api/swatch`, `/api/compile`, `/api/download-wif`).
   - Testing instructions and honest engineering trade-offs disclosure.
2. Author `docs/architecture.md` explaining Boolean matrix factorization mathematical proofs and 2D FFT frequency analysis.
3. Author `docs/wif_spec_guide.md` explaining 1-based indexing and color table structure.
4. Author `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE` (MIT), and `.env.example`.
5. Create semantic Git release tags: `v0.1.0` (core math), `v0.5.0` (integrated backend), `v1.0.0` (production release).

**Verification Steps:**
1. Verify `README.md` formatting, relative links, and image embeds.
2. Test setup instructions from scratch in a fresh shell.
3. Verify Git release tags via `git tag -n`.

**Recommended Atomic Git Commits:**
- `docs: author technical architecture deep-dive and WIF compliance guide`
- `docs: author production README, governance files, and environment template`

---

## Complete GitHub Portfolio & Recruiter Impression Checklist

### 1. Two-Minute Recruiter Scan (First Impressions)
- [ ] **Immediate Value Clarity:** First 3 lines of `README.md` explain what ThreadLore is and the cultural problem it solves.
- [ ] **Visual Evidence:** High-resolution whiteboard architecture diagram displayed before code blocks.
- [ ] **Live Working Demo:** Working link to live Google Cloud Run service.
- [ ] **Passing Badges:** GitHub Actions CI, Python 3.11, React 18, License (MIT).
- [ ] **One-Command Setup:** `make setup && make run` works out of the box.

### 2. Engineering Rigor & Code Quality
- [ ] **Strict Typing Everywhere:** Zero `Any` escapes in Python (`mypy --strict`); strict TypeScript compiler (`noUncheckedIndexedAccess: true`).
- [ ] **Conventional Git Commits:** Clean Git log adhering to Conventional Commits v1.0.0.
- [ ] **Real Testing:** Ground-truth factorization tests, cyclic float boundary tests, WIF round-trip tests, and adversarial stress tests.
- [ ] **Lightweight Containerization:** Multi-stage Docker image $< 260$MB using `opencv-python-headless`.

### 3. Architectural Honesty & Maturity
- [ ] **No Artificial AI Hype:** Explains why Gemini is used for pattern curation rather than raw pixel crossing guessing.
- [ ] **No Fragile Computer Vision Promises:** Explains the master tile verification loop over automated guessing.
- [ ] **Domain Authenticity:** Output certified compliant with the 1997 WIF 1.1 standard with 1-based indexing.
