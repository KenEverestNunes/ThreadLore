# Bundled Demonstration Swatches

This directory contains bundled reference images used for 1-click demonstrations and automated testing in ThreadLore.

---

### 1. `tartan_2_2_twill.jpg`

- **Purpose:** Macro textile sample for balanced twill testing.
- **Physical Weave Structure:** 2/2 balanced twill (two warp floats over two weft picks, forming symmetric 45-degree diagonal wales).
- **Observed Characteristics:** Multi-colored dyed wool yarns (indigo blue and slate gray-blue dominant clusters).
- **Basis for Label:** Direct visual inspection of the yarn interlacing pattern confirms an alternating over-2, under-2 float repeat across warp and weft.
- **Edits:** Cropped from a larger close-up photograph to focus on thread crossings.
- **Attribution & Provenance Status:** Added during Issue #46 development. Original photographer and textile maker are unconfirmed in repository records; treated as an internal demonstration sample pending archival attribution.

---

### 2. `denim_3_1_twill.jpg`

- **Purpose:** Macro textile sample for unbalanced warp-faced twill testing.
- **Physical Weave Structure:** 3/1 right-hand twill (warp-faced denim weave where dyed indigo warp passes over three ecru weft picks before passing under one).
- **Observed Characteristics:** Indigo warp yarns and undyed/ecru weft yarns with clear diagonal wale lines.
- **Basis for Label:** Direct visual inspection confirms a classic 3/1 twill repeat with prominent warp dominance on the technical face.
- **Edits:** Cropped from a close-up photograph and resized for macro demonstration.
- **Attribution & Provenance Status:** Added during Issue #46 development. Original photographer and denim manufacturer are unconfirmed in repository records; treated as an internal demonstration sample pending archival attribution.

---

### 3. `bamboo_basket_sample.jpg`

- **Purpose:** Non-textile negative control sample for AI safety validation.
- **Physical Structure:** Plaited split-cane bamboo basketry (rigid plant strips, not spun textile yarns).
- **Basis for Label:** Visual inspection confirms thick woody fibers and open plaiting, lacking pliable spun warp and weft threads. Used to verify that Vertex AI Gemini correctly flags `is_woven_textile: false` and locks draft compilation.
- **Edits:** Scaled down for lightweight web delivery.
- **Attribution & Provenance Status:** Added during Issue #46 development. Source photographer is unconfirmed in repository records; treated as an internal test control sample pending archival attribution.
