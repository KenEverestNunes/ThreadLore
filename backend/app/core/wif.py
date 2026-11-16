"""Standards-compliant WIF 1.1 serializer and parser for 4-shaft rising-shed looms."""

import configparser
from datetime import datetime
from io import StringIO
from typing import Literal

from backend.app.core.compiler import simulate_drawdown
from backend.app.core.types import LoomDraft, ProvenanceMetadata, WeaveError

VALID_UNITS = ("Inches", "Centimeters", "Decipoints")
ValidUnitType = Literal["Inches", "Centimeters", "Decipoints"]


class WIFParseError(WeaveError):
    """Raised when parsing an invalid or malformed WIF file."""

    pass


def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    """Convert hex color string (#RRGGBB) to (R, G, B) tuple in range 0..255."""
    clean = hex_str.lstrip("#")
    if len(clean) != 6:
        return (0, 0, 0)
    try:
        return int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)
    except ValueError:
        return (0, 0, 0)


def serialize_wif(
    draft: LoomDraft,
    warp_hex: str = "#1E293B",
    weft_hex: str = "#E2E8F0",
    provenance: ProvenanceMetadata | None = None,
    units: ValidUnitType = "Centimeters",
) -> str:
    """Serialize a LoomDraft into a standards-compliant WIF 1.1 file string.

    Specifications:
    - Line delimiter: Windows CRLF (\\r\\n).
    - 1-based indexing for ends, picks, shafts, treadles, and colors.
    - Mandatory sections: [WIF], [CONTENTS], [WEAVING], [WARP], [WEFT],
      [COLOR PALETTE], [COLOR TABLE], [WARP COLORS], [WEFT COLORS],
      [THREADING], [TIEUP], [TREADLING].
    - Optional [NOTES] section with numbered lines (1=Title: ...).
    - Valid physical units: "Inches", "Centimeters", or "Decipoints".
    """
    if units not in VALID_UNITS:
        raise ValueError(f"Invalid WIF units '{units}'. Must be one of {VALID_UNITS}.")

    warp_rgb = hex_to_rgb(warp_hex)
    weft_rgb = hex_to_rgb(weft_hex)
    date_str = datetime.now().strftime("%B %d, %Y")

    lines: list[str] = [
        "[WIF]",
        "Version=1.1",
        f"Date={date_str}",
        "Developers=ThreadLore Team",
        "Source Program=ThreadLore",
        "",
        "[CONTENTS]",
        "COLOR PALETTE=true",
        "COLOR TABLE=true",
        "WEAVING=true",
        "WARP=true",
        "WEFT=true",
        "THREADING=true",
        "TIEUP=true",
        "TREADLING=true",
        "WARP COLORS=true",
        "WEFT COLORS=true",
    ]

    has_notes = provenance is not None and bool(
        provenance.title
        or provenance.origin
        or provenance.maker
        or provenance.date_period
        or provenance.notes
    )
    if has_notes:
        lines.append("NOTES=true")

    lines.extend(
        [
            "",
            "[WEAVING]",
            f"Shafts={draft.shafts}",
            f"Treadles={draft.treadles}",
            "Rising shed=1",
            "",
            "[WARP]",
            f"Threads={draft.warp_threads}",
            f"Units={units}",
            "Thickness=0.1",
            "",
            "[WEFT]",
            f"Threads={draft.weft_picks}",
            f"Units={units}",
            "Thickness=0.1",
            "",
            "[COLOR PALETTE]",
            "Entries=2",
            "Range=0,255",
            "",
            "[COLOR TABLE]",
            f"1={warp_rgb[0]},{warp_rgb[1]},{warp_rgb[2]}",
            f"2={weft_rgb[0]},{weft_rgb[1]},{weft_rgb[2]}",
            "",
            "[WARP COLORS]",
        ]
    )

    for j in range(1, draft.warp_threads + 1):
        lines.append(f"{j}=1")

    lines.extend(["", "[WEFT COLORS]"])
    for i in range(1, draft.weft_picks + 1):
        lines.append(f"{i}=2")

    lines.extend(["", "[THREADING]"])
    for j in range(1, draft.warp_threads + 1):
        lines.append(f"{j}={draft.threading[j - 1]}")

    lines.extend(["", "[TIEUP]"])
    # For each treadle t (1-based), list shafts s (1-based) where tieup[s-1][t-1] == 1
    for t in range(1, draft.treadles + 1):
        raised_shafts = [
            str(s) for s in range(1, draft.shafts + 1) if draft.tieup[s - 1][t - 1] == 1
        ]
        shafts_str = ",".join(raised_shafts)
        lines.append(f"{t}={shafts_str}")

    lines.extend(["", "[TREADLING]"])
    for i in range(1, draft.weft_picks + 1):
        lines.append(f"{i}={draft.treadling[i - 1]}")

    if has_notes and provenance is not None:
        lines.extend(["", "[NOTES]"])
        note_idx = 1
        if provenance.title:
            lines.append(f"{note_idx}=Title: {provenance.title}")
            note_idx += 1
        if provenance.origin:
            lines.append(f"{note_idx}=Origin: {provenance.origin}")
            note_idx += 1
        if provenance.maker:
            lines.append(f"{note_idx}=Artisan/Maker: {provenance.maker}")
            note_idx += 1
        if provenance.date_period:
            lines.append(f"{note_idx}=Date/Period: {provenance.date_period}")
            note_idx += 1
        if provenance.notes:
            lines.append(f"{note_idx}=Conservation Notes: {provenance.notes}")
            note_idx += 1
        lines.append(f"{note_idx}=Reconstructed via ThreadLore (Google Cloud Run)")

    # Join using official WIF Windows CRLF line delimiter
    return "\r\n".join(lines) + "\r\n"


def parse_wif(wif_text: str) -> LoomDraft:
    """Parse a WIF 1.1 string and reconstruct the verified LoomDraft."""
    parser = configparser.ConfigParser(interpolation=None)
    # WIF keys can be case-insensitive, preserve casing
    parser.optionxform = str  # type: ignore

    try:
        parser.read_file(StringIO(wif_text))
    except Exception as e:
        raise WIFParseError(f"Malformed WIF INI structure: {e}") from e

    # Section lookup helper (case-insensitive)
    sections_map = {s.upper(): s for s in parser.sections()}

    for required in ("WIF", "WEAVING", "WARP", "WEFT", "THREADING", "TIEUP", "TREADLING"):
        if required not in sections_map:
            raise WIFParseError(f"Missing mandatory WIF section: [{required}].")

    weaving_sec = parser[sections_map["WEAVING"]]
    shafts = int(weaving_sec.get("Shafts", "4"))
    treadles = int(weaving_sec.get("Treadles", "4"))

    warp_sec = parser[sections_map["WARP"]]
    warp_threads = int(warp_sec.get("Threads", "0"))

    weft_sec = parser[sections_map["WEFT"]]
    weft_picks = int(weft_sec.get("Threads", "0"))

    # Parse threading (1-based indices)
    threading_sec = parser[sections_map["THREADING"]]
    threading: list[int] = []
    for j in range(1, warp_threads + 1):
        key = str(j)
        if key not in threading_sec:
            raise WIFParseError(f"Missing threading for warp end {j}.")
        threading.append(int(threading_sec[key]))

    # Parse treadling (1-based indices)
    treadling_sec = parser[sections_map["TREADLING"]]
    treadling: list[int] = []
    for i in range(1, weft_picks + 1):
        key = str(i)
        if key not in treadling_sec:
            raise WIFParseError(f"Missing treadling for weft pick {i}.")
        treadling.append(int(treadling_sec[key]))

    # Parse tie-up (S × T matrix)
    tieup_sec = parser[sections_map["TIEUP"]]
    tieup = [[0] * treadles for _ in range(shafts)]

    for t in range(1, treadles + 1):
        key = str(t)
        if key in tieup_sec and tieup_sec[key].strip():
            raised_str = tieup_sec[key].strip()
            raised_list = [int(s.strip()) for s in raised_str.split(",") if s.strip()]
            for s in raised_list:
                if 1 <= s <= shafts:
                    tieup[s - 1][t - 1] = 1

    # Simulate drawdown from parsed draft
    drawdown = simulate_drawdown(threading, treadling, tieup)

    return LoomDraft(
        shafts=shafts,
        treadles=treadles,
        warp_threads=warp_threads,
        weft_picks=weft_picks,
        threading=threading,
        treadling=treadling,
        tieup=tieup,
        drawdown=drawdown,
    )
