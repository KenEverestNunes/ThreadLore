"""Synthetic textile image generation for deterministic CV testing.

Produces mathematical textile images with known ground-truth thread counts,
spatial periodicities, rotation skew angles, and Gaussian noise.
"""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np


def generate_synthetic_weave(
    width: int = 400,
    height: int = 400,
    weave_type: str = "plain_1_1",
    spacing_x: float = 20.0,
    spacing_y: float = 20.0,
    angle_deg: float = 0.0,
    noise_std: float = 5.0,
    seed: int = 42,
) -> np.ndarray[Any, Any]:
    """Generate a synthetic 2D woven fabric image.

    Args:
        width: Image width in pixels.
        height: Image height in pixels.
        weave_type: "plain_1_1", "twill_2_2", or "flat".
        spacing_x: Ground truth thread spacing along X (warp spacing) in pixels.
        spacing_y: Ground truth thread spacing along Y (weft spacing) in pixels.
        angle_deg: Rotation angle in degrees (clockwise).
        noise_std: Standard deviation of additive Gaussian noise.
        seed: Random seed for repeatability.

    Returns:
        np.ndarray: BGR uint8 image of shape (height, width, 3).
    """
    rng = np.random.default_rng(seed)

    if weave_type == "flat":
        # Low contrast / flat image for uncertainty testing
        base = np.full((height, width), 128, dtype=np.float32)
        noise = rng.normal(0, noise_std, (height, width)).astype(np.float32)
        img = np.clip(base + noise, 0, 255).astype(np.uint8)
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    y_coords, x_coords = np.mgrid[0:height, 0:width].astype(np.float32)

    # Fundamental spatial frequencies
    fx = 1.0 / spacing_x
    fy = 1.0 / spacing_y

    # Yarn profile: sinusoidal yarn crowns
    warp_profile = 0.5 * (1.0 + np.cos(2.0 * np.pi * fx * x_coords))
    weft_profile = 0.5 * (1.0 + np.cos(2.0 * np.pi * fy * y_coords))

    if weave_type == "plain_1_1":
        # Plain weave: warp is over when (floor(fx*x) + floor(fy*y)) % 2 == 0
        tile_x = np.floor(fx * x_coords).astype(int)
        tile_y = np.floor(fy * y_coords).astype(int)
        warp_over = ((tile_x + tile_y) % 2 == 0).astype(np.float32)
    elif weave_type == "twill_2_2":
        tile_x = np.floor(fx * x_coords).astype(int)
        tile_y = np.floor(fy * y_coords).astype(int)
        # 2/2 twill: repeat of 4
        warp_over = (((tile_x - tile_y) % 4) < 2).astype(np.float32)
    else:
        # Default sinusoidal interlacing
        warp_over = 0.5 * (1.0 + np.sin(2.0 * np.pi * fx * x_coords) * np.sin(2.0 * np.pi * fy * y_coords))

    # Composite intensity: highlight yarn crown based on which thread is on top
    base_intensity = 128.0
    contrast = 80.0
    intensity = base_intensity + contrast * (
        warp_over * (warp_profile - 0.5) + (1.0 - warp_over) * (weft_profile - 0.5)
    )

    # Add Gaussian noise
    if noise_std > 0:
        noise = rng.normal(0, noise_std, (height, width)).astype(np.float32)
        intensity += noise

    img_gray = np.clip(intensity, 0, 255).astype(np.uint8)

    # Apply rotation if needed
    if abs(angle_deg) > 1e-3:
        center = (width / 2.0, height / 2.0)
        rot_matrix = cv2.getRotationMatrix2D(center, -angle_deg, 1.0)
        img_gray = cv2.warpAffine(
            img_gray, rot_matrix, (width, height), borderMode=cv2.BORDER_REFLECT
        )

    return cv2.cvtColor(img_gray, cv2.COLOR_GRAY2BGR)  # type: ignore[no-any-return]
