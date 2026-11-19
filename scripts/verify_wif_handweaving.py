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


def verify_wif_bytes(raw_bytes: bytes, source_name: str = "WIF") -> tuple[bool, list[str]]:
    """Validate raw WIF bytes, checking raw byte stream for mandatory CRLF endings."""
    if b"\r\n" not in raw_bytes:
        return False, [f"{source_name} must use Windows CRLF (\\r\\n) line endings (none found in raw bytes)."]

    try:
        wif_text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        return False, [f"{source_name} encoding error (expected UTF-8/ASCII): {exc}"]

    return verify_wif_text(wif_text)


def verify_wif_file(file_path: Path) -> tuple[bool, list[str]]:
    """Validate a .wif file on disk, checking raw bytes for CRLF line endings."""
    if not file_path.is_file():
        return False, [f"File not found: {file_path}"]

    raw_bytes = file_path.read_bytes()
    return verify_wif_bytes(raw_bytes, f"File '{file_path.name}'")


def main() -> int:
    """Run verification on sample generated WIF or command line file."""
    import subprocess

    # Ensure backend path is on sys.path
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from backend.app.core.compiler import factor_matrix
    from backend.app.core.types import ProvenanceMetadata
    from backend.app.core.wif import serialize_wif

    print("============================================================")
    print(" ThreadLore: WIF 1.1 Compliance & Interoperability Verifier")
    print("============================================================")

    all_passed = True

    # 1. Verify files provided via CLI arguments or stdin
    cli_args = sys.argv[1:]
    target_files: list[Path] = []

    for arg in cli_args:
        if arg == "-":
            print("\n[CHECK] Validating raw bytes from standard input (stdin):")
            stdin_bytes = sys.stdin.buffer.read()
            is_valid, errors = verify_wif_bytes(stdin_bytes, "stdin")
            if is_valid:
                print("[PASS] Standard input bytes strictly comply with WIF 1.1 specification.")
            else:
                print("[FAIL] Errors in stdin bytes:")
                for err in errors:
                    print(f"  - {err}")
                all_passed = False
        else:
            target_files.append(Path(arg))

    # If no files specified, also check standard committed validation file if present
    if not cli_args:
        default_validation_wif = project_root / "docs" / "assets" / "validation" / "Plain_Weave_Test.wif"
        if default_validation_wif.is_file():
            target_files.append(default_validation_wif)

    for target in target_files:
        print(f"\n[CHECK] Validating file on disk: {target}")
        is_valid, errors = verify_wif_file(target)
        if is_valid:
            print(f"[PASS] File '{target.name}' strictly complies with WIF 1.1 specification.")
        else:
            print(f"[FAIL] Errors in '{target.name}':")
            for err in errors:
                print(f"  - {err}")
            all_passed = False

    # 2. Verify committed Git blob bytes if git repository is available
    try:
        git_blob = subprocess.run(
            ["git", "show", "HEAD:docs/assets/validation/Plain_Weave_Test.wif"],
            cwd=str(project_root),
            capture_output=True,
            check=False,
        )
        if git_blob.returncode == 0 and git_blob.stdout:
            print("\n[CHECK] Validating committed Git blob (git show HEAD:docs/assets/validation/Plain_Weave_Test.wif):")
            is_valid, errors = verify_wif_bytes(git_blob.stdout, "Git blob")
            if is_valid:
                print("[PASS] Committed Git blob strictly complies with WIF 1.1 specification (CRLF preserved).")
            else:
                print("[FAIL] Committed Git blob failed CRLF compliance:")
                for err in errors:
                    print(f"  - {err}")
                all_passed = False
    except Exception:
        pass

    # 2. Verify synthetic generated draft serialization
    print("\n[CHECK] Validating synthetic draft serialization pipeline:")
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
    else:
        print("[FAIL] Generated WIF compliance errors detected:")
        for err in errors:
            print(f"  - {err}")
        all_passed = False

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
