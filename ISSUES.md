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
