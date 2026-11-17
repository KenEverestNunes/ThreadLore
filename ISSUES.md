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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
  The stepper is enabled because the condition only checks `rawImage !== null`. The CanvasOverlay renders an empty black box with no image or optical metrics.

---

### Issue #004: Missing Fine Rotation Angle Slider and Wale Mirroring Controls in Canvas Overlay
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
- **Severity:** Low (Accessibility / User Preference)
- **Reported Date:** 2026-11-16
- **Component:** `frontend/index.html`, `frontend/src/App.tsx`
- **Description:**
  Every component contains complete Tailwind light/dark mode pairs (e.g., `bg-white dark:bg-zinc-900`), but `index.html` hardcodes `<html lang="en" class="dark">` and there is no theme toggle button in the header. Weavers working in brightly illuminated studios cannot toggle to light mode.
- **Reproduction Steps:**
  1. Inspect the header navbar.
  2. Look for a Theme / Dark Mode toggle button.
- **Expected Behavior:**
  A theme toggle button in the top navigation bar allowing users to switch between Dark, Light, and System themes.
- **Actual Behavior:**
  App is permanently locked to dark mode.

---

### Issue #013: Network-Dependent WIF File Download When Text Is Held in Memory
- **Status:** 🔴 Open (Pending User Triage)
- **GitHub Issue:** *Not created (Awaiting user review & confirmation)*
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
