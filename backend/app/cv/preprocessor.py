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

    @staticmethod
    def extract_dominant_colors(
        image_bgr: np.ndarray[Any, Any], k: int = 2
    ) -> tuple[str, str]:
        """Extract dominant warp and weft yarn colors using OpenCV K-Means clustering.

        Downsamples the swatch to accelerate color clustering, reshapes pixels into
        an RGB feature space, runs K-Means clustering (k=2), and returns formatted
        hex color strings (#RRGGBB).

        Args:
            image_bgr: Preprocessed or raw BGR swatch image array.
            k: Number of clusters (defaults to 2 for warp and weft).

        Returns:
            tuple[str, str]: Tuple of (dominant_warp_hex, dominant_weft_hex).
        """
        h, w = image_bgr.shape[:2]
        sample_size = 128
        if max(h, w) > sample_size:
            scale = sample_size / float(max(h, w))
            small = cv2.resize(
                image_bgr,
                (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
                interpolation=cv2.INTER_AREA,
            )
        else:
            small = image_bgr

        # Convert BGR to RGB
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        pixels = rgb.reshape(-1, 3).astype(np.float32)

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.2)
        flags = cv2.KMEANS_PP_CENTERS
        _compactness, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, flags)

        # Count frequencies in each cluster
        counts = np.bincount(labels.flatten())
        # Sort cluster centers by frequency descending
        sorted_indices = np.argsort(-counts)

        colors: list[str] = []
        for idx in sorted_indices:
            r, g, b = [int(np.clip(c, 0, 255)) for c in centers[idx]]
            colors.append(f"#{r:02X}{g:02X}{b:02X}")

        # Check if the two cluster centers are virtually identical (monochromatic fabric)
        c1 = centers[sorted_indices[0]]
        c2 = centers[sorted_indices[1]]
        color_dist = float(np.linalg.norm(c1 - c2))
        if color_dist < 15.0:
            # Generate a contrasting tint so warp and weft remain distinguishable on loom draft
            r1, g1, b1 = [int(c) for c in c1]
            luminance = r1 * 0.299 + g1 * 0.587 + b1 * 0.114
            if luminance > 128:
                c2_hex = f"#{max(0, r1 - 40):02X}{max(0, g1 - 40):02X}{max(0, b1 - 40):02X}"
            else:
                c2_hex = f"#{min(255, r1 + 40):02X}{min(255, g1 + 40):02X}{min(255, b1 + 40):02X}"
            return colors[0], c2_hex

        return colors[0], colors[1]
