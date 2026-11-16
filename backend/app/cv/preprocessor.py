"""Image preprocessing and optical rectification for textile swatches.

Handles byte decoding, resolution validation, contrast enhancement via CLAHE,
fiber fuzz suppression via bilateral filtering, and affine rotation deskewing.
"""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np


class ImagePreprocessor:
    """Preprocesses raw textile swatch images for frequency profiling and AI analysis."""

    MIN_DIMENSION: int = 100
    MAX_DIMENSION: int = 800

    @classmethod
    def decode_and_validate(cls, image_bytes: bytes) -> np.ndarray[Any, Any]:
        """Decode raw image bytes, validate resolution, and cap maximum dimension.

        Args:
            image_bytes: Raw binary image payload (JPEG, PNG, WebP).

        Returns:
            np.ndarray: Decoded BGR image array with dimensions within [100, 800].

        Raises:
            ValueError: If image is corrupt, cannot be decoded, or is smaller than 100x100.
        """
        if not image_bytes:
            raise ValueError("Empty image bytes provided.")

        buf = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(buf, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Invalid or corrupted image format. Could not decode.")

        h, w = img.shape[:2]
        if h < cls.MIN_DIMENSION or w < cls.MIN_DIMENSION:
            raise ValueError(
                f"Image dimensions ({w}x{h}) below minimum required resolution "
                f"of {cls.MIN_DIMENSION}x{cls.MIN_DIMENSION} pixels."
            )

        # Cap maximum dimension preserving aspect ratio
        max_dim = max(h, w)
        if max_dim > cls.MAX_DIMENSION:
            scale = cls.MAX_DIMENSION / float(max_dim)
            new_w = max(1, int(round(w * scale)))
            new_h = max(1, int(round(h * scale)))
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return img

    @staticmethod
    def enhance_contrast(
        image: np.ndarray[Any, Any], clip_limit: float = 2.0
    ) -> np.ndarray[Any, Any]:
        """Enhance local contrast on luminance channel using CLAHE in LAB color space.

        Args:
            image: Input BGR image array.
            clip_limit: Threshold for contrast limiting.

        Returns:
            np.ndarray: Contrast-enhanced BGR image.
        """
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)

        merged = cv2.merge([l_enhanced, a_channel, b_channel])
        return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)

    @staticmethod
    def suppress_fuzz(
        image: np.ndarray[Any, Any],
        diameter: int = 7,
        sigma_color: float = 50.0,
        sigma_space: float = 50.0,
    ) -> np.ndarray[Any, Any]:
        """Suppress high-frequency fiber fuzz noise while preserving yarn edges.

        Uses bilateral filtering to smooth surface fibers without washing out
        steep warp/weft boundaries.

        Args:
            image: Input BGR image array.
            diameter: Pixel neighborhood diameter.
            sigma_color: Filter sigma in color space.
            sigma_space: Filter sigma in coordinate space.

        Returns:
            np.ndarray: Filtered BGR image.
        """
        return cv2.bilateralFilter(image, d=diameter, sigmaColor=sigma_color, sigmaSpace=sigma_space)

    @staticmethod
    def rotate_image(
        image: np.ndarray[Any, Any], angle_degrees: float
    ) -> np.ndarray[Any, Any]:
        """Apply affine rotation to deskew textile orientation.

        Uses border reflection padding to avoid introducing artificial black border
        discontinuities that create false FFT harmonic spikes.

        Args:
            image: Input image array (BGR or grayscale).
            angle_degrees: Angle in degrees. Positive rotates counter-clockwise.

        Returns:
            np.ndarray: Deskewed image array with identical shape.
        """
        if abs(angle_degrees) < 1e-4:
            return image.copy()

        h, w = image.shape[:2]
        center = (w / 2.0, h / 2.0)
        rot_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
        return cv2.warpAffine(image, rot_matrix, (w, h), borderMode=cv2.BORDER_REFLECT)
