#!/usr/bin/env python3
"""Automated WIF 1.1 compliance validator for handweaving software compatibility.

Validates that exported WIF files strictly adhere to the official Weaving Information
File (WIF) 1.1 specification, including CRLF line delimiters, [WEAVING] rising-shed
declarations, physical measurement units, numbered notes, and 1-based indexing.
"""

from __future__ import annotations

import configparser
import sys
from pathlib import Path


def verify_wif_text(wif_text: str) -> tuple[bool, list[str]]:
    """Validate raw WIF string against WIF 1.1 standard requirements."""
    errors: list[str] = []

    # 1. Verify CRLF line endings
    if "\r\n" not in wif_text:
        errors.append("WIF file must use Windows CRLF (\\r\\n) line endings.")

    # 2. Parse using strict configparser
    config = configparser.ConfigParser(interpolation=None, strict=False)
    try:
        config.read_string(wif_text)
    except Exception as exc:
        errors.append(f"ConfigParser failed to parse WIF structure: {exc}")
        return False, errors

    # 3. Mandatory sections check
    mandatory_sections = [
        "WIF",
        "CONTENTS",
        "WEAVING",
        "WARP",
        "WEFT",
        "COLOR PALETTE",
        "COLOR TABLE",
        "WARP COLORS",
        "WEFT COLORS",
        "THREADING",
        "TIEUP",
        "TREADLING",
    ]
    for sec in mandatory_sections:
        if not config.has_section(sec):
            errors.append(f"Missing mandatory WIF section: [{sec}]")

    # 4. Check [WEAVING] section specification
    if config.has_section("WEAVING"):
        weaving = config["WEAVING"]
        if "shafts" not in weaving:
            errors.append("[WEAVING] missing 'Shafts=' key.")
        if "treadles" not in weaving:
            errors.append("[WEAVING] missing 'Treadles=' key.")
        if weaving.get("rising shed") != "1":
            errors.append("[WEAVING] 'Rising shed' must equal '1'.")

    # 5. Check physical units (Inches, Centimeters, Decipoints)
    valid_units = {"inches", "centimeters", "decipoints"}
    for sec_name in ["WARP", "WEFT"]:
        if config.has_section(sec_name):
            units = config[sec_name].get("units", "").strip().lower()
            if units not in valid_units:
                errors.append(
                    f"[{sec_name}] invalid units '{units}'. Must be Inches, Centimeters, or Decipoints."
                )

    # 6. Check 1-based indexing (strictly no 0= keys)
    indexed_sections = ["WARP COLORS", "WEFT COLORS", "THREADING", "TIEUP", "TREADLING", "COLOR TABLE"]
    for sec_name in indexed_sections:
        if config.has_section(sec_name):
            for key in config[sec_name]:
                if key == "0":
                    errors.append(f"[{sec_name}] contains invalid 0-based index '0='.")
                try:
                    num = int(key)
                    if num < 1:
                        errors.append(f"[{sec_name}] contains non-positive index: '{key}'.")
                except ValueError:
                    pass

    # 7. Check [NOTES] numbered line formatting
    if config.has_section("NOTES"):
        for key in config["NOTES"]:
            try:
                num = int(key)
                if num < 1:
                    errors.append(f"[NOTES] line key '{key}' is not positive 1-based integer.")
            except ValueError:
                errors.append(f"[NOTES] key '{key}' is not numbered (must be 1=, 2=, etc.).")

    return len(errors) == 0, errors


def main() -> int:
    """Run verification on sample generated WIF or command line file."""
    # Ensure backend path is on sys.path
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from backend.app.core.compiler import factor_matrix
    from backend.app.core.types import ProvenanceMetadata
    from backend.app.core.wif import serialize_wif

    print("============================================================")
    print(" ThreadLore — WIF 1.1 Compliance & Interoperability Verifier")
    print("============================================================")

    twill_2_2 = [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [1, 0, 0, 1],
    ]
    draft = factor_matrix(twill_2_2)
    prov = ProvenanceMetadata(
        title="Verification Tweed",
        origin="Outer Hebrides",
        maker="Heritage Weaver",
        date_period="1930",
        notes="Automated handweaving compliance verification sample.",
    )
    wif = serialize_wif(draft, "#1E293B", "#E2E8F0", provenance=prov, units="Centimeters")

    is_valid, errors = verify_wif_text(wif)
    if is_valid:
        print("[PASS] Generated WIF 1.1 passes all handweaving compatibility checks:")
        print("  - CRLF line endings verified")
        print("  - [WEAVING] rising shed verified")
        print("  - Numbered [NOTES] verified")
        print("  - Valid physical units ('Centimeters') verified")
        print("  - 1-based indexing verified")
        return 0
    else:
        print("[FAIL] WIF compliance errors detected:")
        for err in errors:
            print(f"  - {err}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
