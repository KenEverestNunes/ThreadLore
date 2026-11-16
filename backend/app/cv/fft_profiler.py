"""2D Fast Fourier Transform (FFT) textile geometry and frequency profiler.

Extracts spatial thread periodicity (dx, dy) and dominant weave orientation skew.
Follows the fundamental design constraint: Never invent synthetic measurements
when harmonic peaks are ambiguous or below the prominence threshold.
Instead, marks analysis status as 'uncertain' and returns None for spacing.

Note on Phase Ambiguity:
2D FFT frequency analysis measures thread periodicity (delta_x, delta_y) and
orthogonal orientation, but inherently discards spatial phase origin (x0, y0).
Accurate alignment with individual yarn crowns is resolved via the interactive
frontend canvas overlay with draggable grid origin offsets (offsetX, offsetY).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import cv2
import numpy as np
from scipy import signal


@dataclass(frozen=True)
class CVAnalysisResult:
    """Optical and frequency analysis metrics extracted from swatch image."""

    spacing_detected: bool
    dx_px: float | None
    dy_px: float | None
    rotation_degrees: float
    status: Literal["detected", "uncertain"]


class FFTProfiler:
    """Analyzes textile macro swatches in the 2D frequency domain."""

    MIN_PROMINENCE_RATIO: float = 3.0
    MIN_THREAD_SPACING_PX: float = 4.0

    @classmethod
    def compute_spectrum(
        cls, image_gray: np.ndarray[Any, Any]
    ) -> tuple[np.ndarray[Any, Any], np.ndarray[Any, Any]]:
        """Compute windowed 2D Fast Fourier Transform and shifted magnitude spectrum.

        Applies a 2D Hanning window to suppress boundary discontinuities,
        computes the 2D FFT, and shifts zero frequency (DC) to the center.

        Args:
            image_gray: Single-channel uint8 or float32 image array.

        Returns:
            tuple[np.ndarray, np.ndarray]:
                - shifted_fft: Complex 2D array of centered Fourier coefficients.
                - log_magnitude: Centered log-magnitude spectrum log(1 + |F|).
        """
        h, w = image_gray.shape[:2]
        float_img = image_gray.astype(np.float32)
        zero_mean = float_img - float(np.mean(float_img))

        window_y = np.hanning(h)
        window_x = np.hanning(w)
        window_2d = window_y[:, None] * window_x[None, :]

        windowed = zero_mean * window_2d
        fft_raw = np.fft.fft2(windowed)
        shifted_fft = np.fft.fftshift(fft_raw)
        magnitude = np.abs(shifted_fft)
        log_magnitude = np.log1p(magnitude)

        return shifted_fft, log_magnitude

    @classmethod
    def detect_dominant_angle(cls, image_gray: np.ndarray[Any, Any]) -> float:
        """Detect orientation skew angle of warp/weft yarns relative to orthogonal axes.

        Analyzes principal frequency components in the 2D magnitude spectrum,
        folding radial angles into the range [-45.0, 45.0] degrees.

        Args:
            image_gray: Single-channel grayscale image array.

        Returns:
            float: Estimated skew angle in degrees (rounded to 1 decimal place).
        """
        h, w = image_gray.shape[:2]
        shifted_fft, _ = cls.compute_spectrum(image_gray)
        mag = np.abs(shifted_fft)
        cy, cx = h // 2, w // 2

        # Mask low-frequency DC component
        r_mask = max(6, int(min(h, w) * 0.02))
        y_idx, x_idx = np.ogrid[:h, :w]
        dist_sq = (x_idx - cx) ** 2 + (y_idx - cy) ** 2
        mag[dist_sq < r_mask**2] = 0.0

        threshold = float(np.percentile(mag, 99.8))
        if threshold <= 0.0:
            return 0.0

        top_pts = np.argwhere(mag >= threshold)
        if len(top_pts) == 0:
            return 0.0

        angles: list[float] = []
        weights: list[float] = []
        for y, x in top_pts:
            dy = float(y - cy)
            dx = float(x - cx)
            deg = float(np.degrees(np.arctan2(dy, dx)))
            # Fold into [-45, 45] relative to nearest orthogonal axis (0, 90, 180, -90)
            folded = float((deg + 45.0) % 90.0 - 45.0)
            angles.append(folded)
            weights.append(float(mag[y, x]))

        angles_arr = np.array(angles, dtype=np.float64)
        weights_arr = np.array(weights, dtype=np.float64)
        if np.sum(weights_arr) <= 0.0:
            return 0.0

        coarse_angle = float(np.average(angles_arr, weights=weights_arr))

        # Fine-grained radial line search around coarse estimate (+/- 3 degrees)
        fine_angles = np.arange(coarse_angle - 3.0, coarse_angle + 3.1, 0.2)
        radii = np.arange(r_mask + 2, min(cy, cx) - 5)
        if len(radii) == 0:
            return float(round(coarse_angle, 1))

        best_score = -1.0
        best_angle = coarse_angle
        for fa in fine_angles:
            rad1 = np.radians(fa)
            rad2 = np.radians(fa + 90.0)
            xs1 = np.clip(np.round(cx + radii * np.cos(rad1)).astype(int), 0, w - 1)
            ys1 = np.clip(np.round(cy + radii * np.sin(rad1)).astype(int), 0, h - 1)
            xs2 = np.clip(np.round(cx + radii * np.cos(rad2)).astype(int), 0, w - 1)
            ys2 = np.clip(np.round(cy + radii * np.sin(rad2)).astype(int), 0, h - 1)
            score = float(np.sum(mag[ys1, xs1]) + np.sum(mag[ys2, xs2]))
            if score > best_score:
                best_score = score
                best_angle = float(fa)

        return float(round(best_angle, 1))

    @classmethod
    def estimate_thread_spacing(
        cls, image_gray: np.ndarray[Any, Any], band_width: int = 5
    ) -> tuple[bool, float | None, float | None]:
        """Measure fundamental warp (dx) and weft (dy) thread spacing from frequency peaks.

        Uses orthogonal spectral projections and scipy.signal.find_peaks with
        rigorous prominence gating. If spectral peaks fail confidence thresholds,
        returns (False, None, None) rather than guessing synthetic values.

        Args:
            image_gray: Deskewed single-channel grayscale image array.
            band_width: Half-width of integration band along orthogonal axis.

        Returns:
            tuple[bool, float | None, float | None]:
                - spacing_detected: True if both dx and dy meet confidence gates.
                - dx_px: Warp thread spacing in pixels, or None.
                - dy_px: Weft thread spacing in pixels, or None.
        """
        h, w = image_gray.shape[:2]
        shifted_fft, _ = cls.compute_spectrum(image_gray)
        mag = np.abs(shifted_fft)
        cy, cx = h // 2, w // 2

        # Warp thread spacing (horizontal frequency u > 0 along center weft band)
        y_min = max(0, cy - band_width)
        y_max = min(h, cy + band_width + 1)
        prof_x = np.mean(mag[y_min:y_max, cx + 1 :], axis=0)

        dx = cls._extract_spacing_from_profile(
            prof_x, total_dimension=w, min_spacing=cls.MIN_THREAD_SPACING_PX
        )

        # Weft thread spacing (vertical frequency v > 0 along center warp band)
        x_min = max(0, cx - band_width)
        x_max = min(w, cx + band_width + 1)
        prof_y = np.mean(mag[cy + 1 :, x_min:x_max], axis=1)

        dy = cls._extract_spacing_from_profile(
            prof_y, total_dimension=h, min_spacing=cls.MIN_THREAD_SPACING_PX
        )

        if dx is not None and dy is not None:
            return True, round(dx, 1), round(dy, 1)

        return False, None, None

    @classmethod
    def _extract_spacing_from_profile(
        cls, profile: np.ndarray[Any, Any], total_dimension: int, min_spacing: float
    ) -> float | None:
        """Extract dominant spatial periodicity from a 1D spectral profile."""
        if len(profile) == 0:
            return None

        peaks, props = signal.find_peaks(profile, prominence=0)
        if len(peaks) == 0:
            return None

        prominences = props["prominences"]
        best_idx = int(np.argmax(prominences))
        max_prom = float(prominences[best_idx])
        mean_val = float(np.mean(profile))

        prominence_ratio = max_prom / (mean_val + 1e-6)
        if prominence_ratio < cls.MIN_PROMINENCE_RATIO:
            # Low confidence or flat noise
            return None

        k_freq = peaks[best_idx] + 1  # 1-based harmonic bin offset
        cand_spacing = float(total_dimension) / float(k_freq)

        # Sanity bound: thread spacing must be at least min_spacing and at most dim/4
        max_spacing = float(total_dimension) / 4.0
        if min_spacing <= cand_spacing <= max_spacing:
            return cand_spacing

        return None

    @classmethod
    def profile_image(cls, image_bgr: np.ndarray[Any, Any]) -> CVAnalysisResult:
        """Run complete optical rectification and frequency profiling pipeline.

        1. Convert to grayscale.
        2. Detect dominant yarn orientation skew angle.
        3. Rotate/deskew image.
        4. Estimate orthogonal warp and weft thread spacing.

        Args:
            image_bgr: Preprocessed BGR image array.

        Returns:
            CVAnalysisResult: Structured detection results.
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        skew_angle = cls.detect_dominant_angle(gray)

        if abs(skew_angle) > 0.5:
            from backend.app.cv.preprocessor import ImagePreprocessor

            deskewed_bgr = ImagePreprocessor.rotate_image(image_bgr, -skew_angle)
            deskewed_gray = cv2.cvtColor(deskewed_bgr, cv2.COLOR_BGR2GRAY)
        else:
            deskewed_gray = gray

        detected, dx, dy = cls.estimate_thread_spacing(deskewed_gray)
        status: Literal["detected", "uncertain"] = "detected" if detected else "uncertain"

        return CVAnalysisResult(
            spacing_detected=detected,
            dx_px=dx,
            dy_px=dy,
            rotation_degrees=skew_angle,
            status=status,
        )
