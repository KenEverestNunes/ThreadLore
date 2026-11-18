"""Adversarial stress testing and failure mode verification for ThreadLore."""

from __future__ import annotations

import cv2
import numpy as np
import pytest

from backend.app.core.compiler import factor_drawdown, factor_matrix
from backend.app.core.types import LoomShaftOverflowError, ProvenanceMetadata
from backend.app.core.wif import parse_wif, serialize_wif
from backend.app.cv.fft_profiler import FFTProfiler
from backend.app.cv.preprocessor import ImagePreprocessor


def test_adversarial_zero_contrast_noise() -> None:
    """Verify that pure Gaussian noise swatches never report false harmonic periodicity."""
    rng = np.random.default_rng(12345)
    noise_img = rng.integers(0, 256, (300, 300, 3), dtype=np.uint8)

    res = FFTProfiler.profile_image(noise_img)
    assert res.spacing_detected is False
    assert res.dx_px is None
    assert res.dy_px is None
    assert res.status == "uncertain"


def test_adversarial_salt_and_pepper_fuzz() -> None:
    """Verify extreme impulse noise does not trick peak detector into false lock."""
    # Create plain weave and corrupt 40% of pixels with impulse noise
    from backend.tests.fixtures.synthetic_textiles import generate_synthetic_weave

    base_img = generate_synthetic_weave(width=300, height=300, spacing_x=20.0, spacing_y=20.0)
    rng = np.random.default_rng(999)
    mask = rng.random((300, 300)) < 0.40
    corrupted = base_img.copy()
    corrupted[mask] = rng.integers(0, 256, (int(np.sum(mask)), 3), dtype=np.uint8)

    # Preprocessing bilateral filter helps smooth impulse noise
    enhanced = ImagePreprocessor.enhance_contrast(corrupted)
    fuzz_free = ImagePreprocessor.suppress_fuzz(enhanced)
    res = FFTProfiler.profile_image(fuzz_free)

    # Either recovers the true peak (~20px) or flags uncertain; MUST NEVER guess wild numbers
    if res.spacing_detected and res.dx_px is not None:
        assert abs(res.dx_px - 20.0) <= 2.0
    else:
        assert res.status == "uncertain"


def test_adversarial_extreme_aspect_ratios() -> None:
    """Verify preprocessor handles extreme banner-like aspect ratios."""
    banner_img = np.full((120, 960, 3), 150, dtype=np.uint8)
    _, enc = cv2.imencode(".png", banner_img)
    decoded = ImagePreprocessor.decode_and_validate(enc.tobytes())

    h, w = decoded.shape[:2]
    assert max(h, w) <= ImagePreprocessor.MAX_DIMENSION
    assert h >= ImagePreprocessor.MIN_DIMENSION or h == int(round(120 * (800 / 960)))


def test_adversarial_large_scale_repeat_expansion() -> None:
    """Verify compiler handles large repeat expansions (e.g. 50 repeats = 200 ends) without memory exhaustion."""
    twill_4x4 = [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [1, 0, 0, 1],
    ]
    draft = factor_drawdown(twill_4x4, repeat_warp=50, repeat_weft=50)

    assert draft.warp_threads == 200
    assert draft.weft_picks == 200
    assert draft.shafts == 4
    assert draft.treadles == 4
    assert len(draft.threading) == 200
    assert len(draft.treadling) == 200


def test_adversarial_provenance_special_characters_and_multilingual() -> None:
    """Verify WIF serializer safely handles accents, Unicode, and punctuation in notes."""
    twill = [[1, 0], [0, 1]]
    draft = factor_matrix(twill)

    provenance = ProvenanceMetadata(
        title="Gàidhlig & 日本の織物 / Ancient Tweed #42",
        origin="Isle of Lewis / 京都市 (Kyoto)",
        maker="Weaver: Seòras MacLeòid & 伝統工芸士",
        date_period="Meiji Era (明治) / c. 1890—1910",
        notes="Notes with CRLF\r\nand special chars: \", ', =, ;, #, %, @, &, <, >.",
    )

    wif = serialize_wif(draft, "#000000", "#FFFFFF", provenance=provenance)
    assert "[NOTES]" in wif
    assert "Gàidhlig & 日本の織物" in wif
    assert "京都市" in wif

    # Round trip test
    parsed = parse_wif(wif)
    assert parsed.shafts == 2
    assert parsed.treadles == 2


def test_adversarial_satin_overflow_rejection() -> None:
    """Verify 5-shaft satin pattern is rejected as physical loom overflow."""
    satin_5 = [
        [1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0],
    ]
    with pytest.raises(LoomShaftOverflowError):
        factor_matrix(satin_5)
