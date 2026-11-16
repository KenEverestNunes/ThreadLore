# ThreadLore — Exhaustive Implementation Roadmap

---

## 1. Project Context & Architectural Invariants

ThreadLore is an AI-assisted textile preservation application engineered for the **Google Cloud Run "Build for Good" Hackathon** (Product Hunt Launch: November 20, 2026).

The user uploads a close-up photograph of a flat woven textile. Computer vision estimates the thread grid, Gemini suggests a supported weaving pattern, and the user verifies or corrects a small master repeat tile. A deterministic Python compiler converts the approved weave structure into loom instructions, validates the resulting draft, and exports a standards-compliant WIF 1.1 file.

### Architectural Invariants & Scope Rules
- **Loom Harness Limits:** Single-layer rising-shed loom with strictly $\le 4$ shafts and $\le 4$ treadles.
- **Supported Weave Set:** Plain weave ($2\times2$), $2/1$ twill ($3\times3$), $2/2$ twill ($4\times4$), $3/1$ twill ($4\times4$). Satin is strictly excluded ($\ge 5$ shafts).
- **Export Standards:** Standards-compliant WIF 1.1 with 1-based indexing and color palettes. PDF export is excluded for MVP (in-browser visual draft card provided).
- **AI Operational Role:** Gemini 2.0 Flash performs macro-swatch weave classification, pre-fills the master repeat tile, and drafts provenance/safety notes. It **never** extracts raw pixel-by-pixel intersection matrices directly.
- **Computer Vision Role:** OpenCV runs 2D FFT to measure thread spacing ($\Delta x, \Delta y$), calculates skew angle $\theta$, and performs affine rectification. It does **not** attempt automated over/under crossing classification.
- **Editing UX Inversion:** User exclusively toggles a $2\times2$, $3\times3$, or $4\times4$ master repeat tile (max 16 cells) which live-tiles across the photograph.
- **Physical Integrity Check:** Toroidal (cyclic) float checks enforce consecutive yarn runs $\le 4$ threads across repeating tile boundaries.

---

## 2. Complete Master Phase Index

- **Phase 0:** Repository Inception, Workspace Topology & Toolchain Baseline
- **Phase 1:** Deterministic Weaving Mathematics, Draft Factorization & Structural Validation
- **Phase 2:** Standards-Compliant WIF 1.1 Serialization & Interoperability Engine
- **Phase 3:** Fast Fourier Transform (FFT) Geometry Profiler & Optical Rectification Engine
- **Phase 4:** Vertex AI Gemini 2.0 Flash Multimodal Curation Client & Schema Gate
- **Phase 5:** FastAPI Core Service Architecture, Orchestration Pipelines & Test Harness
- **Phase 6:** React + TypeScript Frontend Foundation, State Core & Swatch Cropper
- **Phase 7:** Master Repeat Tile Editor, Interactive Canvas Overlay & Verification Loop
- **Phase 8:** End-to-End Client-Server Orchestration, WIF Delivery & Visual Draft Card
- **Phase 9:** Production Containerization, Google Cloud Run Infrastructure & Cloud Storage
- **Phase 10:** Automated CI/CD Pipelines, Adversarial Verification & Load Baseline
- **Phase 11:** Production Documentation, Recruiter Portfolio Polish & Release Readiness

---

## Phase 0: Repository Inception, Workspace Topology & Toolchain Baseline

**Goal:**  
Establish a deterministic, monorepo workspace containing isolated Python and TypeScript runtime environments, locked dependency trees, strict code quality tooling (`ruff`, `mypy`, `eslint`, `prettier`), and automated pre-commit verification hooks.

**Dependencies:**
- Python 3.11 installed locally.
- Node.js 20 LTS and `npm` installed locally.
- Git 2.40+ installed locally.

**Files Created / Modified:**
- `.gitignore` — Universal ignore rules for Python, Node, OS, IDE, and Cloud artifacts.
- `.editorconfig` — Consistent indentation, encoding, and newline rules across IDEs.
- `pyproject.toml` — Python packaging, tool configurations for Ruff, Mypy, and Pytest.
- `backend/requirements.txt` — Pinned production dependencies for backend service.
- `backend/requirements-dev.txt` — Pinned testing and quality analysis dependencies.
- `frontend/package.json` — Frontend package definition and build scripts.
- `frontend/tsconfig.json` — Strict TypeScript compiler configuration.
- `frontend/tsconfig.node.json` — TypeScript configuration for Vite tooling.
- `frontend/vite.config.ts` — Vite build and dev server configuration with proxy.
- `frontend/tailwind.config.js` — Tailwind CSS token configuration.
- `frontend/postcss.config.js` — PostCSS runner configuration.
- `Makefile` — Standardized developer workflow shortcuts (`make lint`, `make test`, `make run`).

**Implementation Details & Micro-Tasks:**
1. Initialize git repository: `git init -b main`.
2. Configure `.gitignore` with comprehensive rules for Python (`__pycache__`, `.venv`, `.pytest_cache`), Node (`node_modules`, `dist`), IDEs (`.vscode`, `.idea`), and GCP secrets (`*.pem`, `service-account.json`, `.env`).
3. Configure `.editorconfig` enforcing LF line endings, UTF-8, and spaces (4 for Python, 2 for TS/JSON).
4. Configure `pyproject.toml` targeting Python 3.11, Ruff line length 100, strict Mypy settings with zero `Any` escapes, and Pytest paths.
5. Pin production dependencies in `backend/requirements.txt`: `fastapi==0.115.5`, `uvicorn[standard]==0.32.1`, `pydantic==2.10.2`, `pydantic-settings==2.6.1`, `numpy==1.26.4`, `opencv-python-headless==4.10.0.84`, `google-genai==0.1.1`, `google-cloud-storage==2.18.2`, `python-multipart==0.0.17`.
6. Pin development dependencies in `backend/requirements-dev.txt`: `pytest==8.3.3`, `pytest-asyncio==0.24.0`, `httpx==0.27.2`, `ruff==0.8.0`, `mypy==1.13.0`.
7. Scaffold frontend using Vite with React 18 and strict TypeScript, Lucide icons, and Tailwind CSS.
8. Configure root `Makefile` targets: `setup`, `lint-backend`, `lint-frontend`, `test-backend`, `test-frontend`, `check`, `run`.

**Verification Steps:**
1. Execute `make setup` (or manual `pip install` and `npm install`).
2. Run `ruff check backend/` and `mypy backend/` $\rightarrow$ Expect zero errors.
3. Run `npm --prefix frontend run build` $\rightarrow$ Expect clean build into `frontend/dist/`.
4. Run `git status` $\rightarrow$ Confirm zero untracked caches or `.venv` files.

**Recommended Atomic Git Commits:**
- `chore(repo): initialize workspace topology and project toolchains`

---

## Phase 1: Deterministic Weaving Mathematics, Draft Factorization & Structural Validation

**Goal:**  
Implement the core mathematical compiler that factors arbitrary $2\times2$, $3\times3$, and $4\times4$ binary drawdown matrices into valid physical loom components (Threading, Treadling, and Tie-Up matrices), enforces 4-shaft/4-treadle limits, and cyclically validates float boundaries.

**Dependencies:**
- Phase 0 completed.
- `numpy==1.26.4` and `pytest==8.3.3` active in `.venv`.

**Files Created / Modified:**
- `backend/app/core/__init__.py` — Package export interface.
- `backend/app/core/types.py` — Strongly typed domain models, enums, and matrix definitions.
- `backend/app/core/compiler.py` — Boolean matrix factorization algorithm solving shafts, treadles, and tie-up.
- `backend/app/core/validator.py` — Physical float counter (toroidal wrapping) and loom boundary checks.
- `backend/tests/conftest.py` — Pytest fixtures for canonical ground-truth weave matrices.
- `backend/tests/test_compiler.py` — Mathematical round-trip and factorization unit tests.
- `backend/tests/test_validator.py` — Boundary and edge-case unit tests for float and shaft limits.

**Implementation Details & Micro-Tasks:**
1. Define domain types in `backend/app/core/types.py`: `WeaveFamily` enum (`plain`, `twill_2_1`, `twill_2_2`, `twill_3_1`, `custom`), `BinaryMatrix`, `LoomDraft` (with 1-based indexing for threading/treadling and tie-up matrix), `ValidationResult`.
2. Implement `factor_drawdown(drawdown: BinaryMatrix) -> LoomDraft` in `backend/app/core/compiler.py`:
   - Validates input dimensions ($N \in \{2, 3, 4\}$) and binary values ($0$ or $1$).
   - Groups unique columns into shafts ($S = |U_C|$) with 1-based threading.
   - Groups unique rows into treadles ($T = |U_R|$) with 1-based treadling.
   - Solves Tie-Up Matrix $M \in \{0, 1\}^{S \times T}$ where $M[s][t] = D[i][j]$.
   - Simulates drawdown $D'$ from generated draft and asserts $D' \equiv D$ (100% round-trip proof).
3. Implement `validate_draft(draft: LoomDraft) -> ValidationResult` in `backend/app/core/validator.py`:
   - Checks shaft ceiling: $S \le 4$. Rejects if $S > 4$.
   - Checks treadle ceiling: $T \le 4$. Rejects if $T > 4$.
   - Checks cyclic floats in rows and columns across periodic wrapping boundaries using doubled arrays ($2N$ wrap). Enforces max float $\le 4$.
4. Configure Pytest fixtures in `backend/tests/conftest.py` for canonical ground-truth matrices (`PLAIN_2X2`, `TWILL_2_1_3X3`, `TWILL_2_2_4X4`, `TWILL_3_1_4X4`, and 5-end satin negative test).
5. Implement unit tests in `test_compiler.py` and `test_validator.py` verifying exact shaft counts, tie-up matrices, cyclic float calculations, and rejection of over-limit drafts.

**Verification Steps:**
1. Run `pytest backend/tests/test_compiler.py -v` $\rightarrow$ Expect 100% passing tests.
2. Run `pytest backend/tests/test_validator.py -v` $\rightarrow$ Expect 100% passing tests.
3. Run `mypy backend/app/core/` and `ruff check backend/app/core/`.

**Recommended Atomic Git Commits:**
- `feat(weave): implement boolean matrix draft compiler and factorization`
- `feat(validation): implement toroidal float checking and loom constraint engine`

---

## Phase 2: Standards-Compliant WIF 1.1 Serialization & Interoperability Engine

**Goal:**  
Develop a zero-dependency WIF 1.1 serializer that converts compiled `LoomDraft` objects and yarn color configurations into standards-compliant plain text files, accompanied by a standalone round-trip parser that validates interoperability.

**Dependencies:**
- Phase 1 completed (`LoomDraft` active).

**Files Created / Modified:**
- `backend/app/core/wif.py` — WIF 1.1 serializer and validation parser.
- `backend/tests/test_wif.py` — Compliance, indexing, color palette, and round-trip verification tests.

**Implementation Details & Micro-Tasks:**
1. Implement strict conformance with WIF 1.1 specification:
   - Line delimiter: Windows CRLF (`\r\n`).
   - 1-based indexing for ends, picks, shafts, treadles, and colors.
   - Mandatory sections: `[WIF]`, `[CONTENTS]`, `[TEXTILE]`, `[COLOR PALETTE]`, `[COLOR TABLE]`, `[WARP]`, `[WEFT]`, `[WARP COLORS]`, `[WEFT COLORS]`, `[THREADING]`, `[TIEUP]`, `[TREADLING]`.
2. Implement dual-color palette serialization mapping hex colors to 8-bit integer RGB tuples (`Range=0,255`).
3. Implement `serialize_wif(draft: LoomDraft, warp_hex, weft_hex, textile_name) -> str`.
4. Implement `parse_wif(wif_text: str) -> LoomDraft` using Python `configparser` to parse sections, re-simulate the drawdown, and prove 100% round-trip fidelity.
5. Author comprehensive unit tests in `test_wif.py`:
   - Round-trip identity on all canonical weaves.
   - 1-based indexing verification (assert absence of `0=` keys).
   - CRLF binary line ending verification.
   - Negative tests for malformed WIF text.

**Verification Steps:**
1. Run `pytest backend/tests/test_wif.py -v` $\rightarrow$ Confirm all tests pass.
2. Inspect serialized twill sample output to verify header and section formatting.

**Recommended Atomic Git Commits:**
- `feat(wif): implement WIF 1.1 serializer with dual-color palette support`
- `test(wif): add compliance parser and drawdown round-trip verification`

---

## Phase 3: Fast Fourier Transform (FFT) Geometry Profiler & Optical Rectification Engine

**Goal:**  
Build an image preprocessing and frequency-domain analysis engine using OpenCV and NumPy that rectifies textile skew and measures independent horizontal ($\Delta x$) and vertical ($\Delta y$) thread spacing from macro photographic swatches.

**Dependencies:**
- Phase 0 completed.
- `opencv-python-headless==4.10.0.84`, `numpy==1.26.4`, and `scipy` active in `.venv`.

**Files Created / Modified:**
- `backend/app/cv/__init__.py` — Package exports.
- `backend/app/cv/preprocessor.py` — Color space transforms, bilateral filtering, CLAHE contrast enhancement, and affine image deskewing.
- `backend/app/cv/fft_profiler.py` — 2D Fast Fourier Transform, magnitude spectrum computation, and harmonic peak detection for $\Delta x$ and $\Delta y$.
- `backend/tests/fixtures/synthetic_textiles.py` — Deterministic synthetic image generator for plain weave and twill fabrics with known ground-truth thread counts and rotation angles.
- `backend/tests/test_cv.py` — Unit tests verifying frequency detection, rotation correction, and edge-case handling.

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
   - `estimate_thread_spacing`: Integrates 1D orthogonal projection profiles, uses `scipy.signal.find_peaks` with prominence thresholding, extracts fundamental spatial frequencies, and converts to pixel spacing $\Delta x$ and $\Delta y$. Defaults to $20.0$px fallback on low-contrast swatches.
4. Author unit tests in `test_cv.py` for plain weave, twill, asymmetric density ($EPI \ne PPI$), rotated samples, blank image buffers, and corrupted inputs.

**Verification Steps:**
1. Run `pytest backend/tests/test_cv.py -v` $\rightarrow$ Confirm all frequency, angle, and edge-case tests pass.
2. Execute benchmark script validating detected spacing within $\pm 1.5$px of ground truth.

**Recommended Atomic Git Commits:**
- `feat(cv): implement optical preprocessor with bilateral filtering and deskewing`
- `feat(cv): implement 2D FFT thread spacing and orientation profiler`

---

## Phase 4: Vertex AI Gemini 2.0 Flash Multimodal Curation Client & Schema Gate

**Goal:**  
Integrate the Google GenAI SDK to call Gemini 2.0 Flash on Vertex AI, classifying textile weave structures from macro swatch images, generating canonical $2\times2$, $3\times3$, or $4\times4$ template suggestions, and drafting cultural provenance notes under strict Pydantic JSON schemas.

**Dependencies:**
- Phase 1 completed (`types.py` active).
- `google-genai==0.1.1` and `pydantic==2.10.2` installed in `.venv`.
- GCP Project ID and Vertex AI API access configured.

**Files Created / Modified:**
- `backend/app/config.py` — Environment configuration management using `pydantic-settings`.
- `backend/app/ai/__init__.py` — Package exports.
- `backend/app/ai/gemini_curator.py` — Multimodal Gemini client, prompt definitions, and structured response parser.
- `backend/tests/test_gemini.py` — Unit tests using mock replay fixtures and integration tests with live API.

**Implementation Details & Micro-Tasks:**
1. Implement `Settings` in `backend/app/config.py` reading `PROJECT_ID`, `LOCATION`, `GEMINI_MODEL`, `GCS_BUCKET_NAME`, `MAX_UPLOAD_SIZE_BYTES`, and `CORS_ORIGINS`.
2. Define `GeminiWeaveSuggestion` Pydantic model with strict field validators enforcing square dimensions, binary values, and repeat size $N \in \{2, 3, 4\}$.
3. Implement `GeminiCurator` in `backend/app/ai/gemini_curator.py`:
   - Initialize Vertex AI GenAI client.
   - Define domain persona system instruction.
   - Author multimodal analysis prompt passing JPEG bytes.
   - Enforce structured JSON schema output matching `GeminiWeaveSuggestion`.
   - Implement exponential backoff retry (max 2 retries) and timeout management (8-second ceiling).
   - Implement `fallback_suggestion()` returning standard $2/2$ twill template with $50\%$ confidence if API call fails.
4. Author unit tests in `test_gemini.py` covering successful schema deserialization, malformed LLM response rejection, timeout handling, and gated live Vertex AI integration tests.

**Verification Steps:**
1. Run `pytest backend/tests/test_gemini.py -v -m "not integration"` $\rightarrow$ Verify 100% pass on mocked responses and error handling.
2. Verify `mypy backend/app/ai/` and `ruff check backend/app/ai/`.

**Recommended Atomic Git Commits:**
- `feat(ai): define Gemini curation schemas and Pydantic validation models`
- `feat(ai): implement Vertex AI Gemini 2.0 Flash curation client with fallback`

---

## Phase 5: FastAPI Core Service Architecture, Orchestration Pipelines & Test Harness

**Goal:**  
Assemble the computer vision, AI curation, compiler, and WIF serialization engines into a production-grade FastAPI application featuring stateless endpoints, CORS security, request validation, error handling, and end-to-end integration tests.

**Dependencies:**
- Phase 1, 2, 3, and 4 completed.
- `fastapi==0.115.5`, `uvicorn==0.32.1`, `httpx==0.27.2` active.

**Files Created / Modified:**
- `backend/app/__init__.py` — Root package exports.
- `backend/app/api/__init__.py` — API routing module.
- `backend/app/api/schemas.py` — REST request and response DTO schemas.
- `backend/app/api/routes_swatch.py` — Endpoint for photo upload, CV deskewing, and Gemini curation.
- `backend/app/api/routes_compile.py` — Endpoint for master tile compilation, validation, and WIF generation.
- `backend/app/api/server.py` — FastAPI application instantiation, middleware, and lifecycle handlers.
- `backend/tests/test_api.py` — Comprehensive API integration tests using Starlette/HTTPX `TestClient`.

**Implementation Details & Micro-Tasks:**
1. Define REST DTO schemas in `backend/app/api/schemas.py`: `SwatchAnalysisResponse`, `CompileDraftRequest`, and `CompileDraftResponse`.
2. Implement `POST /api/swatch` in `routes_swatch.py`:
   - Validates upload MIME type (`image/jpeg`, `image/png`) and size limit ($\le 2$MB).
   - Executes preprocessor decoding, contrast enhancement, FFT orientation/spacing profiling, and affine deskewing.
   - Encodes rectified swatch to JPEG in memory and dispatches to `GeminiCurator`.
   - Returns full `SwatchAnalysisResponse`.
3. Implement `POST /api/compile` in `routes_compile.py`:
   - Ingests `CompileDraftRequest`, factors matrix, runs draft validation, serializes WIF text, and returns `CompileDraftResponse`.
4. Implement `POST /api/download-wif`: Streams generated WIF file with `Content-Disposition: attachment; filename="threadlore_draft.wif"`.
5. Assemble `app` in `server.py` with CORS middleware, global exception handlers, and `GET /healthz` endpoint.
6. Author comprehensive API integration tests in `test_api.py` covering health check, image uploads, oversized payload rejection, twill compilation, shaft overflow rejection, and WIF download streams.

**Verification Steps:**
1. Run `pytest backend/tests/ -v` $\rightarrow$ Confirm all unit and integration tests pass.
2. Launch server locally with `uvicorn` and probe `/healthz` and `/api/compile` with `curl`.
3. Verify `ruff check backend/` and `mypy backend/`.

**Recommended Atomic Git Commits:**
- `feat(api): define REST DTO schemas and compile endpoints`
- `feat(api): implement swatch analysis endpoint and server assembly`
- `test(api): add comprehensive HTTP integration test harness`

---

## Phase 6: React + TypeScript Frontend Foundation, State Core & Swatch Cropper

**Goal:**  
Establish the React client architecture, TypeScript domain contracts, centralized application state store, and an interactive 1:1 square macro-swatch cropper with client-side image compression.

**Dependencies:**
- Phase 0 completed (Frontend toolchain initialized).
- Phase 5 completed (Backend API contracts defined in `schemas.py`).

**Files Created / Modified:**
- `frontend/src/types/weave.ts` — TypeScript interfaces matching backend DTO schemas.
- `frontend/src/services/api.ts` — HTTP client service wrapping `fetch` with error boundaries.
- `frontend/src/context/WeaveContext.tsx` — React Context and custom hook for workflow state.
- `frontend/src/components/CaptureGuidance.tsx` — Modal displaying macro photography instructions.
- `frontend/src/components/SwatchCropper.tsx` — Interactive square cropping component.
- `frontend/src/index.css` — Global monochrome styles and canvas reset.

**Implementation Details & Micro-Tasks:**
1. Define strict TypeScript interfaces in `frontend/src/types/weave.ts`: `WeaveFamily`, `BinaryMatrix`, `SwatchAnalysisResponse`, `CompileDraftRequest`, `CompileDraftResponse`, `WorkflowStep`.
2. Implement HTTP service in `frontend/src/services/api.ts` with `analyzeSwatch()`, `compileDraft()`, and `downloadWifFile()`.
3. Implement `WeaveContext` in `frontend/src/context/WeaveContext.tsx` managing workflow lifecycle, raw image, cropped blob, analysis response, master tile state, colors, and compilation outputs.
4. Implement `CaptureGuidance` modal explaining macro lighting, flatness, focus, and minimum thread density ($15\times15$).
5. Implement `SwatchCropper` using HTML5 Canvas enforcing strict $1:1$ aspect ratio, bounding box repositioning, client-side downscaling to $\le 800\times800$px, and JPEG blob export.

**Verification Steps:**
1. Run `npm --prefix frontend run lint` and `npm --prefix frontend run build` $\rightarrow$ Confirm zero errors.
2. Test image upload and verify cropper enforces 1:1 square aspect ratio and exports compressed JPEG.

**Recommended Atomic Git Commits:**
- `feat(ui): define TypeScript domain types and API client service`
- `feat(ui): implement WeaveContext store and interactive swatch cropper`

---

## Phase 7: Master Repeat Tile Editor, Interactive Canvas Overlay & Verification Loop

**Goal:**  
Develop the interactive verification interface: an $N \times N$ master repeat tile editor ($N \in \{2, 3, 4\}$, max 16 toggle cells) and a high-performance HTML5 Canvas component that live-tiles the master block over the rectified textile photograph with independent $\Delta x$ / $\Delta y$ density sliders.

**Dependencies:**
- Phase 6 completed (`WeaveContext` active).

**Files Created / Modified:**
- `frontend/src/components/MasterTileEditor.tsx` — Interactive $N \times N$ toggle grid with repeat size selector.
- `frontend/src/components/ColorPickerRow.tsx` — Independent warp and weft yarn color selectors.
- `frontend/src/components/CanvasOverlay.tsx` — HTML5 Canvas rendering rectified photo with live tiled weave pattern.
- `frontend/src/components/VerificationPanel.tsx` — Container orchestrating the live feedback loop.

**Implementation Details & Micro-Tasks:**
1. Implement `MasterTileEditor` in `frontend/src/components/MasterTileEditor.tsx`:
   - Repeat size tabs for `2×2 (Plain)`, `3×3 (2/1 Twill)`, `4×4 (2/2 Twill)`.
   - $N \times N$ interactive CSS grid capped at 16 cells max.
   - Click toggles cell between `1` (warp over) and `0` (weft over) with visual yarn glyphs and color styling.
2. Implement `ColorPickerRow` in `frontend/src/components/ColorPickerRow.tsx` with warp and weft color pickers and preset palettes (Denim, High Contrast, Heritage Wool).
3. Implement `CanvasOverlay` in `frontend/src/components/CanvasOverlay.tsx`:
   - Draws rectified photo background.
   - Calculates periodic repetition counts across canvas based on $\Delta x$ and $\Delta y$.
   - Live-tiles master repeat pattern with transparency slider ($\alpha \in [0, 1]$) and independent $\Delta x$ (EPI) and $\Delta y$ (PPI) sliders.
4. Implement `VerificationPanel` connecting master tile updates to live canvas redraws in real time ($< 16$ms).

**Verification Steps:**
1. Launch frontend dev server: `npm --prefix frontend run dev`.
2. Toggle master tile cell $\rightarrow$ Verify live canvas overlay instantly updates corresponding repeated columns.
3. Move $\Delta x$ and $\Delta y$ sliders $\rightarrow$ Confirm smooth thread density adjustments.

**Recommended Atomic Git Commits:**
- `feat(editor): implement MasterTileEditor with 2x2, 3x3, and 4x4 repeat toggles`
- `feat(editor): implement live tiled Canvas overlay with independent dx/dy sliders`

---

## Phase 8: End-to-End Client-Server Orchestration, WIF Delivery & Visual Draft Card

**Goal:**  
Wire the complete frontend user journey to the FastAPI backend, implementing the 4-part visual loom draft card (Threading, Tie-Up, Treadling, Drawdown), Gemini cultural notes presentation, WIF file download trigger, and comprehensive error feedback.

**Dependencies:**
- Phase 5 completed (FastAPI server active).
- Phase 6 and 7 completed (React components active).

**Files Created / Modified:**
- `frontend/src/components/DraftCard.tsx` — Standard 4-part loom draft visualization.
- `frontend/src/components/CulturalNotes.tsx` — Gemini AI narrative, weave lineage, and float safety display.
- `frontend/src/components/ExportToolbar.tsx` — WIF 1.1 download button and project reset actions.
- `frontend/src/components/ConstraintAlert.tsx` — Error banner explaining loom limit or float violations.
- `frontend/src/App.tsx` — Main application shell orchestrating the 6-step workflow.
- `frontend/src/App.test.tsx` — Frontend integration tests using Vitest and React Testing Library.

**Implementation Details & Micro-Tasks:**
1. Implement `DraftCard` rendering universal 4-part loom draft: Threading (top-left), Tie-Up (top-right), Treadling (bottom-right), and Drawdown (bottom-left) with crisp monochrome styling.
2. Implement `CulturalNotes` displaying Gemini weave title, confidence meter, cultural narrative, and physical float safety notes.
3. Implement `ConstraintAlert` for shaft overflow ($> 4$ shafts) or excessive floats ($> 4$ threads).
4. Implement `ExportToolbar` triggering direct WIF 1.1 download and raw draft JSON export.
5. Assemble full user journey in `frontend/src/App.tsx`: Upload $\rightarrow$ AI Curation $\rightarrow$ Verify Master Tile $\rightarrow$ Loom Draft & WIF Export.
6. Author integration tests in `App.test.tsx` validating step progression and error banner rendering.

**Verification Steps:**
1. Start backend and frontend servers locally.
2. Walk through complete workflow: upload sample macro photo $\rightarrow$ verify Gemini suggestion $\rightarrow$ adjust $\Delta x/\Delta y$ $\rightarrow$ click Compile $\rightarrow$ verify 4-part draft renders $\rightarrow$ download WIF 1.1 file.
3. Run `npm --prefix frontend run test`.

**Recommended Atomic Git Commits:**
- `feat(ui): implement 4-part loom draft card and cultural notes panel`
- `feat(ui): orchestrate full end-to-end workflow in App component`

---

## Phase 9: Production Containerization, Google Cloud Run Infrastructure & Cloud Storage

**Goal:**  
Package the unified full-stack application into an optimized, multi-stage Docker container where FastAPI serves both the REST API and the compiled React SPA, and deploy it to Google Cloud Run with Vertex AI permissions and Cloud Storage integration.

**Dependencies:**
- Phase 5 (FastAPI backend) and Phase 8 (React frontend) completed.
- Google Cloud SDK (`gcloud`) CLI installed and authenticated.
- Active GCP Project with billing enabled.

**Files Created / Modified:**
- `Dockerfile` — Production multi-stage build container.
- `docker-compose.yml` — Local production container simulation.
- `.dockerignore` — Build context exclusions.
- `backend/app/storage/gcs.py` — Cloud Storage client for raw swatch archiving.
- `backend/app/api/server.py` — Updated to mount compiled frontend static files and serve SPA fallback.
- `deploy.sh` — Automated deployment script using Google Cloud CLI.

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
- `.github/workflows/ci.yml` — GitHub Actions automated build, test, and lint workflow.
- `backend/tests/test_adversarial.py` — Adversarial stress tests (extreme noise, blank images, invalid WIF payloads).
- `scripts/verify_wif_handweaving.py` — Automated verification script testing generated WIFs against external parsing rules.

**Implementation Details & Micro-Tasks:**
1. Author `.github/workflows/ci.yml` executing three parallel/staged jobs:
   - `backend-quality`: Sets up Python 3.11, runs Ruff lint/format checks, runs Mypy, runs Pytest with coverage.
   - `frontend-quality`: Sets up Node 20, runs ESLint, runs TypeScript build verification.
   - `container-verify`: Validates Dockerfile compilation via `docker/build-push-action`.
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
- `README.md` — Production-grade project overview and recruiter landing page.
- `docs/architecture.md` — Deep technical architecture breakdown with diagrams.
- `docs/wif_spec_guide.md` — Weaving Information File standard compliance explanation.
- `SECURITY.md` — Vulnerability reporting and security posture.
- `CONTRIBUTING.md` — Developer setup, code standards, and PR guidelines.
- `LICENSE` — MIT License declaration.
- `.env.example` — Template environment variables.

**Implementation Details & Micro-Tasks:**
1. Author `README.md` with:
   - Technology badges (FastAPI, React, TypeScript, OpenCV, Vertex AI, Cloud Run, Pytest, MIT).
   - 10-second value proposition for cultural heritage preservation.
   - Embedded high-res architecture diagram (`threadlore_architecture.png`).
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
