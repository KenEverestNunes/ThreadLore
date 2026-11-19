# Weaving Information File (WIF 1.1) Specification & Compliance Guide

## 1. Overview of WIF 1.1

The **Weaving Information File (WIF)** specification, ratified in October 1997 by the international computer-aided handweaving community, serves as the open interchange format across loom design software (WeavePoint, Fiberworks PCW, ArahWeave, Handweaving.net, and AVL Compu-Dobby looms).

ThreadLore adheres to the October 1997 WIF 1.1 specification, verified with automated compliance parsing (scripts/verify_wif_handweaving.py) to ensure correct syntax, section headers, coordinate indexing, and physical loom constraints.

---

## 2. Mandatory File Structure

Every valid WIF file is formatted as an INI-style plain text document with **Windows CRLF (`\r\n`) line endings**.

### 2.1 Header Sections
```ini
[WIF]
Version=1.1
Date=November 16, 2026
Developers=ThreadLore Team
Source Program=ThreadLore

[CONTENTS]
COLOR PALETTE=true
COLOR TABLE=true
WEAVING=true
WARP=true
WEFT=true
THREADING=true
TIEUP=true
TREADLING=true
WARP COLORS=true
WEFT COLORS=true
NOTES=true
```

---

## 3. Loom Mechanics: The `[WEAVING]` Section

WIF 1.1 uses `[WEAVING]` to define the physical loom constraints and shed action:

```ini
[WEAVING]
Shafts=4
Treadles=4
Rising shed=1
```

> [!IMPORTANT]
> - `Rising shed=1` signifies a rising-shed (jack) loom where a tie-up value of `1` indicates that the shaft is lifted on that treadle depression.
> - ThreadLore strictly limits drafts to `Shafts <= 4` and `Treadles <= 4` to match standard entry-level table and floor looms.

---

## 4. Physical Dimensions & Measurement Units

The `[WARP]` and `[WEFT]` sections specify the thread count and physical dimensions:

```ini
[WARP]
Threads=40
Units=Centimeters
Thickness=0.1

[WEFT]
Threads=40
Units=Centimeters
Thickness=0.1
```

> [!WARNING]
> WIF 1.1 permits only three valid values for `Units`:
> 1. `Inches`
> 2. `Centimeters`
> 3. `Decipoints`
>
> Setting `Units=Pixels` is invalid and will cause independent WIF parsers to reject the file.

---

## 5. Color Palette & Table

Dual-color palettes are serialized with integer RGB tuples in the range `[0, 255]`:

```ini
[COLOR PALETTE]
Entries=2
Range=0,255

[COLOR TABLE]
1=30,41,59
2=226,232,240
```

Individual ends and picks are mapped using 1-based indexing:

```ini
[WARP COLORS]
1=1
2=1
...
[WEFT COLORS]
1=2
2=2
...
```

---

## 6. Cultural Provenance & Numbered `[NOTES]`

The WIF standard requires the `[NOTES]` section to use **numbered lines**:

```ini
[NOTES]
1=Title: Harris Tweed Heritage Twill
2=Origin: Outer Hebrides, Scotland
3=Artisan/Maker: Traditional Croft Weaver
4=Date/Period: c. 1920
5=Conservation Notes: Handwoven virgin wool sample
6=Reconstructed via ThreadLore (Google Cloud Run)
```

ThreadLore embeds user-supplied provenance into standard numbered lines, preserving textile history directly inside the loom file.

---

## 7. Verification Tooling

To verify WIF compliance programmatically, run ThreadLore's automated verifier:

```bash
python scripts/verify_wif_handweaving.py
```
