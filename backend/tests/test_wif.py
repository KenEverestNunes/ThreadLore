"""Unit tests for WIF 1.1 serializer, parser, and external reader compliance."""

import pytest

from backend.app.core.compiler import factor_drawdown
from backend.app.core.types import BinaryMatrix, ProvenanceMetadata
from backend.app.core.wif import VALID_UNITS, WIFParseError, parse_wif, serialize_wif


def test_wif_serialization_headers(twill_2_2_z: BinaryMatrix) -> None:
    """WIF output must contain mandatory WIF 1.1 sections, CRLF delimiters, and valid physical units."""
    draft = factor_drawdown(twill_2_2_z)
    wif_text = serialize_wif(draft, units="Centimeters")

    # Delimiter verification: must use Windows CRLF
    assert "\r\n" in wif_text
    assert not wif_text.replace("\r\n", "").count("\n")

    # Mandatory sections
    assert "[WIF]" in wif_text
    assert "[CONTENTS]" in wif_text
    assert "[WEAVING]" in wif_text
    assert "[WARP]" in wif_text
    assert "[WEFT]" in wif_text
    assert "[COLOR PALETTE]" in wif_text
    assert "[COLOR TABLE]" in wif_text
    assert "[WARP COLORS]" in wif_text
    assert "[WEFT COLORS]" in wif_text
    assert "[THREADING]" in wif_text
    assert "[TIEUP]" in wif_text
    assert "[TREADLING]" in wif_text

    # Weaving section content
    assert "Rising shed=1" in wif_text
    assert "Shafts=4" in wif_text
    assert "Treadles=4" in wif_text
    assert "Units=Centimeters" in wif_text


def test_wif_numbered_notes(twill_2_2_z: BinaryMatrix) -> None:
    """WIF [NOTES] section must use strictly numbered 1-based lines."""
    draft = factor_drawdown(twill_2_2_z)
    provenance = ProvenanceMetadata(
        title="Heritage Tartan Fragment",
        origin="Scottish Highlands",
        maker="Donald MacDonald",
        date_period="Circa 1780",
        notes="Recovered wool specimen",
    )
    wif_text = serialize_wif(draft, provenance=provenance)

    assert "[NOTES]" in wif_text
    assert "1=Title: Heritage Tartan Fragment" in wif_text
    assert "2=Origin: Scottish Highlands" in wif_text
    assert "3=Artisan/Maker: Donald MacDonald" in wif_text
    assert "4=Date/Period: Circa 1780" in wif_text
    assert "5=Conservation Notes: Recovered wool specimen" in wif_text


def test_wif_multiline_conservation_notes(twill_2_2_z: BinaryMatrix) -> None:
    """Multiline notes must be serialized as separately numbered entries and reopen cleanly."""
    draft = factor_drawdown(twill_2_2_z)
    provenance = ProvenanceMetadata(
        title="Fragment with Multiline Log",
        notes="Cotton warp.\nBlue weft.\nArchival catalog 402.",
    )
    wif_text = serialize_wif(draft, provenance=provenance)

    assert "[NOTES]" in wif_text
    assert "1=Title: Fragment with Multiline Log" in wif_text
    assert "2=Conservation Notes: Cotton warp." in wif_text
    assert "3=Conservation Notes: Blue weft." in wif_text
    assert "4=Conservation Notes: Archival catalog 402." in wif_text

    # Reopening and parsing must succeed without syntax or unkeyed line errors
    parsed = parse_wif(wif_text)
    assert parsed.drawdown == twill_2_2_z

    # Re-verify through official validator
    from scripts.verify_wif_handweaving import verify_wif_text
    is_valid, errors = verify_wif_text(wif_text)
    assert is_valid, f"WIF validation failed on multiline notes: {errors}"


def test_wif_1_based_indexing(twill_2_2_z: BinaryMatrix) -> None:
    """All table sections in WIF 1.1 must use strictly 1-based indexing (no 0= keys)."""
    draft = factor_drawdown(twill_2_2_z)
    wif_text = serialize_wif(draft)

    lines = wif_text.split("\r\n")
    for line in lines:
        stripped = line.strip()
        if "=" in stripped and not stripped.startswith("["):
            key = stripped.split("=")[0].strip()
            # If key is numeric, assert it is strictly >= 1
            if key.isdigit():
                assert int(key) >= 1, f"Found non-1-based key: '{key}' in line: '{line}'"


def test_wif_valid_physical_units(twill_2_2_z: BinaryMatrix) -> None:
    """WIF must accept only valid physical units: Inches, Centimeters, Decipoints."""
    draft = factor_drawdown(twill_2_2_z)

    for unit in VALID_UNITS:
        wif_text = serialize_wif(draft, units=unit)  # type: ignore
        assert f"Units={unit}" in wif_text

    with pytest.raises(ValueError):
        serialize_wif(draft, units="Pixels")  # type: ignore


def test_wif_round_trip_all_11_weaves(
    plain_1_1: BinaryMatrix,
    twill_1_2_z: BinaryMatrix,
    twill_1_2_s: BinaryMatrix,
    twill_2_1_z: BinaryMatrix,
    twill_2_1_s: BinaryMatrix,
    twill_1_3_z: BinaryMatrix,
    twill_1_3_s: BinaryMatrix,
    twill_2_2_z: BinaryMatrix,
    twill_2_2_s: BinaryMatrix,
    twill_3_1_z: BinaryMatrix,
    twill_3_1_s: BinaryMatrix,
) -> None:
    """Every supported canonical weave must survive serialization to WIF and parsing with 100% drawdown match."""
    canonical_set = [
        plain_1_1,
        twill_1_2_z,
        twill_1_2_s,
        twill_2_1_z,
        twill_2_1_s,
        twill_1_3_z,
        twill_1_3_s,
        twill_2_2_z,
        twill_2_2_s,
        twill_3_1_z,
        twill_3_1_s,
    ]

    for matrix in canonical_set:
        draft = factor_drawdown(matrix)
        wif_text = serialize_wif(draft)
        parsed = parse_wif(wif_text)

        assert parsed.shafts == draft.shafts
        assert parsed.treadles == draft.treadles
        assert parsed.warp_threads == draft.warp_threads
        assert parsed.weft_picks == draft.weft_picks
        assert parsed.threading == draft.threading
        assert parsed.treadling == draft.treadling
        assert parsed.tieup == draft.tieup
        assert parsed.drawdown == matrix


def test_wif_parser_malformed() -> None:
    """WIF parser must reject invalid INI or missing mandatory sections."""
    with pytest.raises(WIFParseError):
        parse_wif("THIS IS NOT A VALID INI FILE === [[[]]]")

    with pytest.raises(WIFParseError):
        # Missing WEAVING section
        parse_wif("[WIF]\nVersion=1.1\n[WARP]\nThreads=4\n[WEFT]\nThreads=4")
