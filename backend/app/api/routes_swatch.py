"""API routes for textile swatch photo ingestion, optical rectification, and AI curation."""

from __future__ import annotations

from typing import Literal

import cv2
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.app.ai.gemini_curator import GeminiCurator
from backend.app.api.schemas import SwatchAnalysisResponse
from backend.app.config import Settings, get_settings
from backend.app.cv.fft_profiler import FFTProfiler
from backend.app.cv.preprocessor import ImagePreprocessor

router = APIRouter(tags=["Swatch Analysis"])

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


@router.post("/swatch", response_model=SwatchAnalysisResponse)
async def analyze_swatch(
    file: UploadFile = File(..., description="Uploaded macro swatch image (JPEG, PNG, WebP)"),  # noqa: B008
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> SwatchAnalysisResponse:
    """Ingest a macro swatch photo, deskew orientation, profile thread spacing, and suggest weave.

    Args:
        file: Multipart file upload payload.
        settings: Injected application settings.

    Returns:
        SwatchAnalysisResponse: Structured optical metrics and Gemini weave proposal.

    Raises:
        HTTPException: 400 for invalid formats, 413 for oversized payloads.
    """
    # Validate MIME type
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image MIME type: '{content_type}'. Must be JPEG, PNG, or WebP.",
        )

    # Ingest and validate byte size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Upload payload size ({len(contents)} bytes) exceeds maximum limit "
            f"of {settings.MAX_UPLOAD_SIZE_BYTES} bytes (2MB).",
        )

    # Decode and validate image resolution
    try:
        raw_bgr = ImagePreprocessor.decode_and_validate(contents)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve)) from ve

    # Preprocessing: CLAHE contrast enhancement and bilateral fuzz filtering
    enhanced_bgr = ImagePreprocessor.enhance_contrast(raw_bgr)
    fuzz_free_bgr = ImagePreprocessor.suppress_fuzz(enhanced_bgr)

    # Frequency profiling: detect skew angle and thread spacing (dx, dy)
    cv_res = FFTProfiler.profile_image(fuzz_free_bgr)

    # Rectify orientation for AI curation if skew is detected
    if abs(cv_res.rotation_degrees) > 0.5:
        rectified_bgr = ImagePreprocessor.rotate_image(fuzz_free_bgr, -cv_res.rotation_degrees)
    else:
        rectified_bgr = fuzz_free_bgr

    # Encode rectified swatch to JPEG for Gemini multimodal prompt
    ok, enc_buf = cv2.imencode(".jpg", rectified_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    gemini_payload = enc_buf.tobytes() if ok else contents

    # Call Gemini technical curator
    curator = GeminiCurator(settings=settings)
    ai_res = curator.analyze_swatch(gemini_payload, mime_type="image/jpeg")

    # Determine composite status
    composite_status: Literal["success", "unavailable", "uncertain"]
    if ai_res.status == "unavailable":
        composite_status = "unavailable"
    elif cv_res.status == "uncertain":
        composite_status = "uncertain"
    else:
        composite_status = "success"

    return SwatchAnalysisResponse(
        status=composite_status,
        weave_family=ai_res.weave_family,
        twill_direction=ai_res.twill_direction,
        repeat_size=ai_res.repeat_size,
        confidence=ai_res.confidence,
        default_matrix=ai_res.default_matrix,
        technical_description=ai_res.technical_description,
        float_risk_notes=ai_res.float_risk_notes,
        dx_px=cv_res.dx_px,
        dy_px=cv_res.dy_px,
        spacing_detected=cv_res.spacing_detected,
        rotation_degrees=cv_res.rotation_degrees,
    )
