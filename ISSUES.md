# 📋 ThreadLore — Issue Tracker & Bug Registry

This document tracks identified bugs, functional discrepancies, user interface enhancements, and their resolution status.

---

## Active & Resolved Issues

### Issue #001: Cropper Bounding Box & Zoom Visibility on Sample Load
- **GitHub Issue:** [#1](https://github.com/KenEverestNunes/ThreadLore/issues/1)
- **Status:** 🟢 Resolved
- **Severity:** Medium (UX / Interaction)
- **Reported By:** User
- **Component:** `frontend/src/components/SwatchCropper.tsx`, `frontend/src/components/PhotoUploader.tsx`
- **Symptoms:**
  1. When selecting a sample textile (e.g. "Plain Linen (1/1)" or "Harris Tweed"), the 1:1 square crop box and zoom controls were sometimes not immediately visible upon arriving at the crop step.
  2. If the user confirmed and then navigated back to the crop step via the stepper, the bounding box and selection elements appeared.
- **Root Cause:**
  - `SwatchCropper` gated rendering the crop box behind an `imageLoaded` boolean state triggered by `<img onLoad={onImageLoad} ... />`.
  - In modern browsers, when an image data URL or cached in-memory blob was supplied, the image element's `.complete` property already evaluated to `true` before React DOM attached the `onLoad` event handler, causing `onLoad` never to fire.
  - Zoom controls were limited to a single slider without dedicated Zoom In (`+`) / Zoom Out (`-`) push buttons, percentage badges, mouse wheel support, or direct drag-resizing.
- **Resolution:**
  - Re-engineered `SwatchCropper.tsx` to initialize and render the crop overlay immediately when `rawImage` is present.
  - Added in-memory `new Image()` preloader and DOM `.complete` inspection on mount to guarantee instant dimension detection.
  - Formulated strict aspect-ratio geometry: `widthPercent = (cropSize / imgWidth) * 100` and `heightPercent = (cropSize / imgHeight) * 100` guaranteeing a true 1:1 mathematical square on screen for any image dimensions.
  - Added dedicated Zoom In (`+`) and Zoom Out (`-`) push buttons with `lucide-react` icons.
  - Added interactive mouse-wheel zooming over the image canvas.
  - Added four corner resize handles (`nw`, `ne`, `sw`, `se`) allowing direct drag-to-resize of the crop box.
  - Added quick macro presets (`30% Tight`, `50% Std`, `75% Wide`), floating badge (`1:1 Macro • XX%`), keyboard arrow nudging, and "Reset Crop" / "Change Photo" controls.

---

### Issue #002: Dedicated ThreadLore Brand Icon & Favicon
- **GitHub Issue:** [#2](https://github.com/KenEverestNunes/ThreadLore/issues/2)
- **Status:** 🟢 Resolved
- **Severity:** Low (Branding / Polish)
- **Reported By:** User
- **Component:** `frontend/public/icon.svg`, `frontend/public/favicon.svg`, `frontend/index.html`, `frontend/src/components/ThreadLoreIcon.tsx`, `frontend/src/App.tsx`
- **Symptoms:**
  1. Header navbar displayed a generic text placeholder ("TL") in a rounded square.
  2. `index.html` referenced `/vite.svg` placeholder rather than a bespoke textile identity.
- **Root Cause:**
  - Initial scaffolding used a minimal text box as a placeholder.
- **Resolution:**
  - Designed custom vector SVG brand marks (`frontend/public/icon.svg`, `frontend/public/favicon.svg`) featuring interwoven warp (indigo) and weft (amber) yarns forming a stylized "TL" monogram with 3D woven texture and loom shuttle core.
  - Updated `frontend/index.html` favicon link to `/icon.svg`.
  - Created reusable typed React component `<ThreadLoreIcon />` in `frontend/src/components/ThreadLoreIcon.tsx`.
  - Replaced the placeholder "TL" box in `frontend/src/App.tsx` with `<ThreadLoreIcon className="h-8 w-8 shadow-sm flex-shrink-0" />`.

---

### Issue #003: Stepper Allows Premature Navigation to "Verify & Align" Before Swatch Is Cropped
- **GitHub Issue:** [#3](https://github.com/KenEverestNunes/ThreadLore/issues/3)
- **Status:** 🟢 Resolved
- **Severity:** Medium (Workflow / UX Integrity)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/App.tsx`
- **Description:**
  The top stepper navigation allows the user to click and navigate directly to step 3 ("Verify & Align") immediately after selecting or dropping a photo in step 1, bypassing the required 1:1 macro crop step.
- **Reproduction Steps:**
  1. Go to the upload page and select or drop an image (or click a sample).
  2. While on the "1:1 Macro Crop" step, click "Verify & Align" in the top stepper without clicking "Confirm & Analyze".
  3. Observe that the user enters the verification screen with `croppedImageUrl = null`.
- **Expected Behavior:**
  The "Verify & Align" step in the stepper should remain disabled (`disabled={!croppedImageUrl}`) until the user actually crops and confirms a swatch.
- **Actual Behavior:**
  The stepper was enabled because the condition only checked `rawImage !== null`. The CanvasOverlay rendered an empty black box with no image or optical metrics.
- **Resolution:**
  - Updated `App.tsx` stepper button to require `croppedImageUrl !== null` for both `disabled` and `onClick` handlers.
  - Updated `isCompleted` step status: `crop` requires `croppedImageUrl !== null` and `verify` requires `compiledResult !== null`.
  - Added automated unit and regression tests in `frontend/src/test/stepper_guard.test.tsx` verifying negative and positive states.
  - Resolved via PR #21 (commit `0336eb0`).

---

### Issue #004: Missing Fine Rotation Angle Slider and Wale Mirroring Controls in Canvas Overlay
- **GitHub Issue:** [#4](https://github.com/KenEverestNunes/ThreadLore/issues/4)
- **Status:** 🔴 Open
- **Severity:** High (Feature Incomplete / Optical Alignment)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/CanvasOverlay.tsx`
- **Description:**
  Real textile photographs rarely sit at an exact 0.00° orthogonal angle; handwoven fabrics typically exhibit 2°–8° of skew or camera rotation. While rotation math (`fineAngle`) exists inside the canvas rendering pipeline, there is no rotation slider or angle input in the UI controls. Additionally, there is no horizontal/vertical mirror toggle to test S-twill vs. Z-twill diagonal wale orientation against the photo.
- **Reproduction Steps:**
  1. Upload or crop a fabric photo with slight angular skew (e.g., 5° off-axis).
  2. Arrive at "Verify & Align".
  3. Inspect the slider panel below the canvas: only "Overlay Transparency", "Δx", and "Δy" sliders exist.
- **Expected Behavior:**
  A "Fine Rotation Angle" slider (-15° to +15° with 0.1° precision) and a "Mirror Twill Wale (S ↔ Z)" toggle button allowing weavers to align overlay grid lines to angled yarns.
- **Actual Behavior:**
  No angle slider or mirroring button exists in the UI; weavers cannot align skewed fabric photos.

---

### Issue #005: Canvas Mouse Drag Drift Due to Coordinate Buffer Resolution Mismatch
- **GitHub Issue:** [#5](https://github.com/KenEverestNunes/ThreadLore/issues/5)
- **Status:** 🔴 Open
- **Severity:** Medium (UX / Visual Precision)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/CanvasOverlay.tsx`
- **Description:**
  The `<canvas>` element's internal drawing buffer is hardcoded to 450×450 px, while its CSS rendering size is styled to 400×400 px (`h-[400px] w-[400px] max-w-full`). When the user drags the canvas to adjust the grid phase offset, screen pixel deltas are added directly to buffer coordinates without scaling (`offsetX + deltaX`), causing the grid to drift and lag behind the mouse cursor by ~12.5% (and worse on mobile screens).
- **Reproduction Steps:**
  1. On the "Verify & Align" screen, click and drag across the canvas.
  2. Observe that moving the mouse 100 pixels moves the grid overlay only ~88 pixels, causing the grid to slip out of alignment with the user's cursor.
- **Expected Behavior:**
  Mouse movement deltas should be scaled by `canvas.width / rect.width` and `canvas.height / rect.height` so dragging is 1:1 with cursor travel.
- **Actual Behavior:**
  Mouse dragging drifts due to unscaled buffer-to-display pixel ratios.

---

### Issue #006: Lack of Real-Time Float and Structural Validity Feedback in Master Tile Editor
- **GitHub Issue:** [#6](https://github.com/KenEverestNunes/ThreadLore/issues/6)
- **Status:** 🔴 Open
- **Severity:** High (Core Weaving Usability)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/MasterTileEditor.tsx`, `frontend/src/context/WeaveContext.tsx`
- **Description:**
  When a user toggles matrix cells or resizes a repeat (e.g. from 2×2 to 3×3, which zero-pads and creates an empty row), there is no live client-side structural validation. If a user accidentally creates a uniform row/column (e.g. all 0s or all 1s) or an excessive float (> 4 threads), no visual warning is shown. The user only finds out when they click "Compile 4-Shaft Loom Draft" and wait for a server roundtrip error.
- **Reproduction Steps:**
  1. On the "Verify & Align" screen, click the "3×3" repeat button.
  2. Notice the matrix now contains row 3 as all 0s and column 3 as all 0s.
  3. No warning is displayed.
  4. Click "Compile 4-Shaft Loom Draft".
  5. The compiler returns an error: "Uniform row detected! Every end is down."
- **Expected Behavior:**
  - Resizing repeat size should sensibly wrap or modularly repeat existing weave patterns rather than appending empty 0s.
  - The tile editor should highlight invalid rows/columns in real-time with an advisory warning badge before the user clicks Compile.
- **Actual Behavior:**
  Zero-padding breaks factorization silently; errors are only caught on backend compilation.

---

### Issue #007: Swatch Analysis Error Handler Swallows Server Error Details
- **GitHub Issue:** [#7](https://github.com/KenEverestNunes/ThreadLore/issues/7)
- **Status:** 🔴 Open
- **Severity:** Medium (Error Handling / Diagnostics)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/context/WeaveContext.tsx`
- **Description:**
  When the `/api/swatch` endpoint returns an HTTP error (e.g. 413 Payload Too Large, 400 Minimum Resolution Not Met, or 500/503 network failures), `handleCropComplete` catches the error and overwrites it with a generic fallback: `"Automated weave suggestion was unavailable. Please select a preset or configure the matrix manually."`
- **Reproduction Steps:**
  1. Upload a file that violates backend constraints (e.g. cropped image below 100×100 px or payload over 2MB).
  2. Click "Confirm & Analyze".
  3. The backend returns 400 or 413 with an informative error message.
  4. The UI displays the generic message: `"Automated weave suggestion was unavailable..."`
- **Expected Behavior:**
  The specific error reason returned by the server (e.g., "Image resolution 80x80 px is below minimum 100x100 px") should be displayed in the error banner.
- **Actual Behavior:**
  The server's specific diagnostic error message is completely masked.

---

### Issue #008: File Upload Errors Not Rendered in PhotoUploader UI
- **GitHub Issue:** [#8](https://github.com/KenEverestNunes/ThreadLore/issues/8)
- **Status:** 🔴 Open
- **Severity:** Low (UX Polish)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/PhotoUploader.tsx`
- **Description:**
  `PhotoUploader.tsx` does not consume the `error` state from `WeaveContext`. If `handleFileSelect` encounters an invalid file or `FileReader.onerror` triggers, the error message is placed in context but never rendered anywhere on the upload screen.
- **Reproduction Steps:**
  1. Trigger a file read failure or invalid file format on the upload screen.
  2. Observe that nothing happens and no message appears on screen.
- **Expected Behavior:**
  An alert banner appears in `PhotoUploader` explaining why the file could not be loaded.
- **Actual Behavior:**
  Silent failure with no visual user feedback.

---

### Issue #009: Missing Printable Physical Loom Card / Bench Draft Sheet View
- **GitHub Issue:** [#9](https://github.com/KenEverestNunes/ThreadLore/issues/9)
- **Status:** 🔴 Open
- **Severity:** Medium (Handweaver Workflow)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/LoomDraftCard.tsx`
- **Description:**
  Handweavers require a physical printed sheet at the loom showing threading heddle sequences, tie-up matrix, and treadling order. ThreadLore currently provides only a `.WIF` download and a raw plaintext drawer. Browser printing (`Ctrl+P`) renders the full dark web page with sidebars, buttons, and navigation rather than a high-contrast black-and-white printable loom card.
- **Reproduction Steps:**
  1. Complete draft compilation and navigate to the "Loom Draft & WIF" step.
  2. Press `Ctrl + P` to print.
  3. Notice the print preview renders a dark cluttered webpage rather than a clean loom draft sheet.
- **Expected Behavior:**
  A "Print Loom Card" button with dedicated `@media print` CSS that formats a clean, high-contrast, black-and-white loom draft sheet ready to be taped to the loom.
- **Actual Behavior:**
  No print action exists; standard page print is unformatted and consumes ink needlessly.

---

### Issue #010: WIF 1.1 Plaintext Code Drawer Lacks One-Click "Copy to Clipboard"
- **GitHub Issue:** [#10](https://github.com/KenEverestNunes/ThreadLore/issues/10)
- **Status:** 🔴 Open
- **Severity:** Low (Ergonomics)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/LoomDraftCard.tsx`
- **Description:**
  The WIF 1.1 drawer displays the raw plaintext in a scrolling `<pre>` box with only a "Download File" button. Weavers pasting into weaving software (WeavePoint, Fiberworks, Handweaving.net) must manually highlight hundreds of lines inside the box.
- **Reproduction Steps:**
  1. On the "Loom Draft & WIF" screen, click "View WIF Spec".
  2. Look for a "Copy to Clipboard" button.
- **Expected Behavior:**
  A "Copy WIF" button with transient checkmark confirmation ("Copied!").
- **Actual Behavior:**
  Only a "Download File" button is present.

---

### Issue #011: Drawdown and Treadling Previews Truncated with No Scale/Zoom Controls
- **GitHub Issue:** [#11](https://github.com/KenEverestNunes/ThreadLore/issues/11)
- **Status:** 🔴 Open
- **Severity:** Low (Visualization)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/LoomDraftCard.tsx`
- **Description:**
  For projects with higher repeat counts (e.g. 20 repeats of 4×4 = 80 ends), the visual drawdown is hard-truncated at `slice(0, 60)` and treadling at `slice(0, 40)`. The cells are fixed at 8×8 px with no zoom controls to view fine yarn interlacing or inspect the entire fabric repeat.
- **Reproduction Steps:**
  1. Set repeat warp and weft to 20 on the verification screen.
  2. Compile draft.
  3. Inspect the drawdown simulation: only the first 60 ends and picks are shown, with no indication of how many are hidden or how to view the full project.
- **Expected Behavior:**
  Zoom controls (e.g., Small / Medium / Large cell size) and a full drawdown view toggle or banner indicating the preview scale.
- **Actual Behavior:**
  Arbitrarily sliced to 60 ends without controls to inspect full project dimensions.

---

### Issue #012: Inability to Switch to Light Mode (Hardcoded Dark Theme)
- **GitHub Issue:** [#12](https://github.com/KenEverestNunes/ThreadLore/issues/12)
- **Status:** 🟢 Resolved
- **Severity:** Low (Accessibility / User Preference)
- **Reported Date:** 2026-11-16
- **Resolved Date:** 2026-11-17
- **Component:** `frontend/index.html`, `frontend/src/App.tsx`
- **Description:**
  Every component contains complete Tailwind light/dark mode pairs (e.g., `bg-white dark:bg-zinc-900`), but `index.html` hardcoded `<html lang="en" class="dark">` and there was no theme toggle button in the header. Weavers working in brightly illuminated studios could not toggle to light mode.
- **Reproduction Steps:**
  1. Inspect the header navbar.
  2. Look for a Theme / Dark Mode toggle button.
- **Expected Behavior:**
  A theme toggle button in the top navigation bar allowing users to switch between Dark, Light, and System themes.
- **Actual Behavior:**
  App was permanently locked to dark mode.
- **Resolution:**
  - Added theme switcher control in `frontend/src/App.tsx` header navbar with dedicated buttons for Light, Dark, and System themes.
  - Implemented client-side theme persistence with `localStorage` and dynamic system color scheme listener.
  - Updated `frontend/index.html` with theme initialization script and responsive body background classes.
  - Added automated unit regression tests in `frontend/src/test/theme_toggle.test.tsx`.

---

### Issue #013: Network-Dependent WIF File Download When Text Is Held in Memory
- **GitHub Issue:** [#13](https://github.com/KenEverestNunes/ThreadLore/issues/13)
- **Status:** 🔴 Open
- **Severity:** Low (Reliability / Offline Capability)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/services/api.ts`, `backend/app/api/server.py`
- **Description:**
  When clicking "Download .WIF File", the client sends a POST request over the network to `/api/download-wif` just to receive back the exact same `wif_text` already held in client memory. If the backend server is unreachable or offline, the download fails even though the full WIF file is already rendered on screen.
- **Reproduction Steps:**
  1. Compile a draft.
  2. Disconnect backend or simulate network interruption.
  3. Click "Download .WIF File".
  4. The download fails with a network error.
- **Expected Behavior:**
  Generate a client-side `Blob([wifText], { type: "text/plain;charset=utf-8" })` directly in the browser for instant, 100% offline-reliable downloads.
- **Actual Behavior:**
  Makes an unnecessary network roundtrip.

---

### Issue #014: Stale Compiled WIF and Draft Accessible After Verification Changes (TL-QA-003)
- **GitHub Issue:** [#14](https://github.com/KenEverestNunes/ThreadLore/issues/14)
- **Status:** 🔴 Open
- **Severity:** High (Data Consistency)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/context/WeaveContext.tsx`, `frontend/src/App.tsx`, `frontend/src/components/LoomDraftCard.tsx`
- **Description:**
  After compiling a draft, if a user navigates back to "Verify & Align" and modifies matrix cells, yarn colors, repeats, units, or provenance metadata, `compiledResult` is not invalidated or marked dirty. The top stepper allows navigating directly back to "Loom Draft & WIF", displaying the stale prior draft whose threading, tie-up, drawdown, and downloaded WIF disagree with the newly edited state.
- **Reproduction Steps:**
  1. Compile a valid draft and view the draft card.
  2. Click "Back to Editor".
  3. Toggle matrix cells or change warp/weft colors or project repeats.
  4. Click "Loom Draft & WIF" in the top stepper without recompiling.
- **Expected Behavior:**
  Modifying any weave or metadata setting should clear or mark `compiledResult` as stale, disabling direct stepper access to Draft or requiring recompilation.
- **Actual Behavior:**
  Stale draft remains displayed and downloadable.

---

### Issue #015: Ingestion of New Swatch Does Not Clear Prior Analysis or Draft Results (TL-QA-004)
- **GitHub Issue:** [#15](https://github.com/KenEverestNunes/ThreadLore/issues/15)
- **Status:** 🔴 Open
- **Severity:** High (Workflow Integrity)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/context/WeaveContext.tsx`
- **Description:**
  When a user returns to the Upload step and selects or drops a new image, `handleFileSelect` sets `rawImage` and moves to `crop`, but does not reset `analysisResult`, `compiledResult`, or `masterMatrix`. If the new image's analysis fails or is cancelled, prior analysis data and stale draft state persist.
- **Reproduction Steps:**
  1. Process and compile image A.
  2. Return to the Upload step and select image B.
  3. If image B analysis fails or is cancelled, observe that prior suggestion and draft from image A remain.
- **Expected Behavior:**
  Selecting a new photo should completely clear prior analysis results, compiled drafts, and active matrices.
- **Actual Behavior:**
  Prior photo analysis and draft persist in state.

---

### Issue #016: Failed/Unavailable Analysis Displays Misleading "AI Suggestion" Badge (TL-QA-013)
- **GitHub Issue:** [#16](https://github.com/KenEverestNunes/ThreadLore/issues/16)
- **Status:** 🔴 Open
- **Severity:** Medium (UX / Clarity)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/MasterTileEditor.tsx`
- **Description:**
  When Gemini weave analysis fails or returns `status: "unavailable"`, the UI still displays an active pill badge in `MasterTileEditor` stating: `"AI Suggestion: Custom Master Tile (0% heuristic)"`, misleading the user into thinking Gemini specifically suggested a custom matrix.
- **Reproduction Steps:**
  1. Trigger an analysis failure or run without Vertex AI credentials.
  2. Arrive at the "Verify & Align" screen.
  3. Inspect the top-right pill badge on the Master Tile Editor.
- **Expected Behavior:**
  When analysis status is unavailable, the badge should clearly state: `"AI Suggestion Unavailable: Manual Selection Required"` or be hidden entirely.
- **Actual Behavior:**
  Displays `"AI Suggestion: Custom Master Tile (0% heuristic)"`.

---

### Issue #017: Canvas and Cropper Interaction Handlers Lack Touch / PointerEvent Support (TL-QA-010)
- **GitHub Issue:** [#17](https://github.com/KenEverestNunes/ThreadLore/issues/17)
- **Status:** 🔴 Open
- **Severity:** Medium (Mobile / Tablet Accessibility)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/SwatchCropper.tsx`, `frontend/src/components/CanvasOverlay.tsx`
- **Description:**
  Both `SwatchCropper` and `CanvasOverlay` rely exclusively on desktop `MouseEvent` listeners (`mousedown`, `mousemove`, `mouseup`). Users operating touch devices (iPads, Surface tablets, touchscreens) cannot drag the crop box, resize corner handles, or drag the canvas grid phase.
- **Reproduction Steps:**
  1. Open ThreadLore on a touchscreen device or emulate mobile touch in DevTools.
  2. Attempt to drag the crop box in SwatchCropper or pan the grid in CanvasOverlay.
- **Expected Behavior:**
  Unified `PointerEvent` (`onPointerDown`, `onPointerMove`, `onPointerUp`) handling enabling seamless dragging on touchscreens, stylus devices, and mice alike.
- **Actual Behavior:**
  Interactions do not respond to touch.

---

### Issue #018: Optical Spacing Slider Limits (8 to 50 px) Cannot Accommodate Dense or Coarse Threads (TL-QA-008)
- **GitHub Issue:** [#18](https://github.com/KenEverestNunes/ThreadLore/issues/18)
- **Status:** 🔴 Open
- **Severity:** Low (Edge-Case Textiles)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/CanvasOverlay.tsx`, `backend/app/cv/fft_profiler.py`
- **Description:**
  The FFT profiler can detect thread spacing below 8 px (very fine silk/linen micro-weaves) or above 50 px (chunky handspun wool or close-up macro shots). However, the manual sliders in `CanvasOverlay` are hard-clamped to `min="8"` and `max="50"`. If FFT detects 6.5 px or 62 px, moving the slider snaps away from the measured value and cannot return to it.
- **Reproduction Steps:**
  1. Use an image whose thread spacing is 6 px or 60 px.
  2. Arrive at "Verify & Align" and touch the spacing slider.
- **Expected Behavior:**
  Dynamic slider limits (e.g. min 4 px, max 100 px, or auto-scaling range based on detected spacing).
- **Actual Behavior:**
  Slider is clamped to 8..50 px.

---

### Issue #019: Unmeasured Default Thread Spacing (22 px) Rendered Without "Manual Guess" Label (TL-QA-007)
- **GitHub Issue:** [#19](https://github.com/KenEverestNunes/ThreadLore/issues/19)
- **Status:** 🔴 Open
- **Severity:** Low (Clarity)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/CanvasOverlay.tsx`
- **Description:**
  When FFT optical profiling cannot detect periodic thread peaks (`spacing_detected: false`), `CanvasOverlay` falls back to an arbitrary default of 22.0 px without visually labeling it as an unmeasured manual placeholder. Weavers may assume 22.0 px is an accurate optical measurement.
- **Reproduction Steps:**
  1. Upload an image where FFT frequency analysis fails (e.g. low-contrast plain swatch).
  2. Arrive at "Verify & Align".
  3. Inspect Δx and Δy readouts: displays "22.0 px" with no indication of uncertainty.
- **Expected Behavior:**
  Display an indicator or badge: "22.0 px (Default Placeholder: Optical detection uncertain)" prompting manual adjustment.
- **Actual Behavior:**
  Displays 22.0 px as if it were a detected value.

---

### Issue #020: Sample Swatches Lack Explicit "Synthetic / Simulated" Labeling (TL-QA-014)
- **GitHub Issue:** [#20](https://github.com/KenEverestNunes/ThreadLore/issues/20)
- **Status:** 🔴 Open
- **Severity:** Low (Transparency)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/components/PhotoUploader.tsx`
- **Description:**
  In `PhotoUploader`, buttons read "Plain Linen (1/1)" and "Harris Tweed (2/2 Twill)". These samples are procedurally generated via HTML Canvas with synthetic colored rectangles rather than authentic archival textile photographs. Users may believe they are testing genuine museum samples.
- **Reproduction Steps:**
  1. Visit the Upload screen.
  2. Observe sample buttons under "Try sample:".
- **Expected Behavior:**
  Label samples transparently, e.g. "Synthetic Plain Linen (1/1)" and "Simulated 2/2 Twill", and offer a real photographic sample.
- **Actual Behavior:**
  Lacks explicit synthetic/demo labeling.

---

### Issue #022: Brand Logo in Header Should Redirect to Home Page on Click
- **GitHub Issue:** [#22](https://github.com/KenEverestNunes/ThreadLore/issues/22)
- **Status:** 🟢 Resolved
- **Severity:** Low (Navigation / UX Polish)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/src/App.tsx`
- **Description:**
  In the top navigation bar, the ThreadLore brand icon and title are rendered as an unclickable static div. Users navigating between steps (such as Macro Crop, Verify & Align, or Loom Draft) expect clicking the brand logo to return them to the initial home screen (Upload Swatch, step "upload").
- **Reproduction Steps:**
  1. Open ThreadLore.
  2. Select a sample swatch or upload an image to transition to the "crop" or "verify" step.
  3. Attempt to click on the ThreadLore logo or title in the top navigation header.
  4. Notice the cursor remains default/pointer-less and nothing happens.
- **Expected Behavior:**
  Clicking the brand logo/title should navigate back to the home page (step "upload"), providing standard web application navigation and allowing users to easily return to the start.
- **Actual Behavior:**
  The brand logo and title were non-interactive elements without click handlers or cursor pointer styles.
- **Resolution:**
  - Extracted `<Header />` as a child component of `<WeaveProvider>` to access `useWeave()`.
  - Wrapped the brand logo and title in an accessible `<button>` with `onClick={() => setStep("upload")}`, `aria-label="ThreadLore home"`, and `cursor-pointer` styling.
  - Added automated regression tests in `frontend/src/test/logo_navigation.test.tsx` verifying navigation back to the upload step from both `crop` and `verify` steps.

---

## Issue Log Template (For Adding Future Issues)

```markdown
### Issue #00X: [Brief Title]
- **Status:** 🔴 Open / 🟡 In Progress / 🟢 Resolved
- **Severity:** Critical / High / Medium / Low
- **Reported Date:** YYYY-MM-DD
- **Component:** [Affected File / Endpoint]
- **Description:** [Detailed description of the issue]
- **Reproduction Steps:**
  1. Step 1
  2. Step 2
- **Expected Behavior:** [What should happen]
- **Actual Behavior:** [What actually happened]
- **Resolution / Notes:** [Fix details and commit SHA]
```
