"""Unit tests for computer vision preprocessor and 2D FFT frequency profiler."""

from __future__ import annotations

import cv2
import numpy as np
import pytest

from backend.app.cv import CVAnalysisResult, FFTProfiler, ImagePreprocessor
from backend.tests.fixtures.synthetic_textiles import generate_synthetic_weave


def test_decode_and_validate_success() -> None:
    """Verify clean image bytes decode properly with dimension limits respected."""
    # Create valid synthetic image in memory
    raw_img = np.full((300, 400, 3), 120, dtype=np.uint8)
    _, encoded = cv2.imencode(".png", raw_img)
    decoded = ImagePreprocessor.decode_and_validate(encoded.tobytes())

    assert decoded.shape == (300, 400, 3)
    assert decoded.dtype == np.uint8


def test_decode_and_validate_oversized_downscaling() -> None:
    """Verify images exceeding 800px max dimension are scaled down proportionally."""
    raw_img = np.full((1200, 1600, 3), 100, dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", raw_img)
    decoded = ImagePreprocessor.decode_and_validate(encoded.tobytes())

    h, w = decoded.shape[:2]
    assert max(h, w) == ImagePreprocessor.MAX_DIMENSION
    assert w == 800
    assert h == 600


def test_decode_and_validate_errors() -> None:
    """Verify validation errors on empty, corrupt, or sub-resolution image buffers."""
    with pytest.raises(ValueError, match="Empty image bytes"):
        ImagePreprocessor.decode_and_validate(b"")

    with pytest.raises(ValueError, match="Invalid or corrupted"):
        ImagePreprocessor.decode_and_validate(b"not_an_image_binary_content")

    # Sub-resolution image (< 100x100)
    small_img = np.zeros((80, 80, 3), dtype=np.uint8)
    _, encoded_small = cv2.imencode(".png", small_img)
    with pytest.raises(ValueError, match="below minimum required resolution"):
        ImagePreprocessor.decode_and_validate(encoded_small.tobytes())


def test_preprocessor_filters() -> None:
    """Verify CLAHE contrast enhancement and bilateral fuzz filtering execute cleanly."""
    img = generate_synthetic_weave(width=200, height=200, noise_std=10.0)

    enhanced = ImagePreprocessor.enhance_contrast(img)
    assert enhanced.shape == img.shape
    assert enhanced.dtype == np.uint8

    filtered = ImagePreprocessor.suppress_fuzz(enhanced)
    assert filtered.shape == img.shape
    assert filtered.dtype == np.uint8

    # Rotation with 0 angle returns copy
    rotated_0 = ImagePreprocessor.rotate_image(filtered, 0.0)
    assert np.array_equal(rotated_0, filtered)

    # Rotation with 15 degrees produces valid image
    rotated_15 = ImagePreprocessor.rotate_image(filtered, 15.0)
    assert rotated_15.shape == filtered.shape


def test_fft_profiler_plain_weave() -> None:
    """Verify exact frequency detection on synthetic plain weave."""
    img = generate_synthetic_weave(
        width=400,
        height=400,
        weave_type="plain_1_1",
        spacing_x=20.0,
        spacing_y=20.0,
        angle_deg=0.0,
        noise_std=4.0,
    )
    result: CVAnalysisResult = FFTProfiler.profile_image(img)

    assert result.spacing_detected is True
    assert result.status == "detected"
    assert result.dx_px is not None and abs(result.dx_px - 20.0) <= 1.0
    assert result.dy_px is not None and abs(result.dy_px - 20.0) <= 1.0
    assert abs(result.rotation_degrees) <= 1.5


def test_fft_profiler_twill_2_2() -> None:
    """Verify harmonic peak detection on 2/2 straight twill."""
    img = generate_synthetic_weave(
        width=400,
        height=400,
        weave_type="twill_2_2",
        spacing_x=20.0,
        spacing_y=20.0,
        angle_deg=0.0,
        noise_std=4.0,
    )
    result = FFTProfiler.profile_image(img)

    assert result.spacing_detected is True
    assert result.status == "detected"
    assert result.dx_px is not None and abs(result.dx_px - 20.0) <= 1.5
    assert result.dy_px is not None and abs(result.dy_px - 20.0) <= 1.5


def test_fft_profiler_asymmetric_density() -> None:
    """Verify independent horizontal and vertical thread spacing (EPI != PPI)."""
    img = generate_synthetic_weave(
        width=400,
        height=400,
        weave_type="plain_1_1",
        spacing_x=16.0,
        spacing_y=25.0,
        angle_deg=0.0,
        noise_std=3.0,
    )
    result = FFTProfiler.profile_image(img)

    assert result.spacing_detected is True
    assert result.dx_px is not None and abs(result.dx_px - 16.0) <= 1.0
    assert result.dy_px is not None and abs(result.dy_px - 25.0) <= 1.0


def test_fft_profiler_rotation_detection() -> None:
    """Verify orientation angle detection on rotated swatch."""
    target_angle = 10.0
    img = generate_synthetic_weave(
        width=400,
        height=400,
        weave_type="plain_1_1",
        spacing_x=20.0,
        spacing_y=20.0,
        angle_deg=target_angle,
        noise_std=3.0,
    )
    result = FFTProfiler.profile_image(img)

    assert abs(result.rotation_degrees - target_angle) <= 2.0


def test_fft_profiler_uncertain_fallback_never_invents_measurements() -> None:
    """Crucial safety test: flat/noisy swatches MUST return uncertain, NEVER 20.0px."""
    flat_img = generate_synthetic_weave(
        width=400, height=400, weave_type="flat", noise_std=5.0
    )
    result = FFTProfiler.profile_image(flat_img)

    assert result.spacing_detected is False
    assert result.status == "uncertain"
    assert result.dx_px is None
    assert result.dy_px is None


def test_fft_profiler_uniform_image() -> None:
    """Verify zero-contrast uniform image triggers uncertain status gracefully."""
    uniform_img = np.full((300, 300, 3), 128, dtype=np.uint8)
    result = FFTProfiler.profile_image(uniform_img)

    assert result.spacing_detected is False
    assert result.status == "uncertain"
    assert result.dx_px is None
    assert result.dy_px is None
