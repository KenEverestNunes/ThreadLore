"""API routes for loom draft compilation, repeat expansion, and WIF export."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response

from backend.app.api.schemas import (
    CompileDraftRequest,
    CompileDraftResponse,
    DownloadWifRequest,
)
from backend.app.core.compiler import factor_drawdown
from backend.app.core.validator import validate_draft
from backend.app.core.wif import serialize_wif

router = APIRouter(tags=["Compilation"])


@router.post("/compile", response_model=CompileDraftResponse)
def compile_draft(request: CompileDraftRequest) -> CompileDraftResponse:
    """Factor a binary master tile into a 4-shaft loom draft and serialize WIF 1.1.

    Args:
        request: CompileDraftRequest with repeat tile, colors, repeats, and provenance.

    Returns:
        CompileDraftResponse: Compiled loom draft, validation flags, and WIF text.

    Raises:
        HTTPException: If matrix format is invalid or exceeds 4x4 repeat limits.
    """
    matrix = request.matrix
    if not matrix or not isinstance(matrix, list):
        raise HTTPException(status_code=422, detail="Matrix must be a non-empty 2D list.")

    h = len(matrix)
    if h < 2 or h > 4:
        raise HTTPException(
            status_code=422,
            detail=f"Matrix height ({h}) must be 2, 3, or 4 for single-layer 4-shaft looms.",
        )

    for row_idx, row in enumerate(matrix):
        if not isinstance(row, list) or len(row) != h:
            raise HTTPException(
                status_code=422,
                detail=f"Matrix must be square. Row {row_idx} length != height ({h}).",
            )
        for col_idx, val in enumerate(row):
            if val not in (0, 1):
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid matrix value at ({row_idx}, {col_idx}): {val}. Must be 0 or 1.",
                )

    # Validate structural soundness (uniform interlacing and cyclic floats)
    validation = validate_draft(matrix)
    if not validation.is_valid:
        return CompileDraftResponse(
            draft=None,
            is_valid=False,
            validation_errors=validation.errors,
            validation_warnings=validation.warnings,
            wif_text="",
        )

    try:
        # Expand repeats into practical loom project draft
        draft = factor_drawdown(
            matrix,
            repeat_warp=request.repeat_warp,
            repeat_weft=request.repeat_weft,
        )

        # Serialize WIF 1.1 file
        wif_text = serialize_wif(
            draft=draft,
            warp_hex=request.warp_color_hex,
            weft_hex=request.weft_color_hex,
            provenance=request.provenance,
            units=request.units,
        )

        return CompileDraftResponse(
            draft=draft,
            is_valid=True,
            validation_errors=[],
            validation_warnings=validation.warnings,
            wif_text=wif_text,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Loom compilation failed: {exc}",
        ) from exc


@router.post("/download-wif")
def download_wif(request: DownloadWifRequest) -> Response:
    """Stream serialized WIF file as a downloadable text attachment.

    Args:
        request: DownloadWifRequest containing raw WIF string and target filename.

    Returns:
        Response: Streamed text file with attachment Content-Disposition header.
    """
    if not request.wif_text:
        raise HTTPException(status_code=400, detail="Empty WIF content cannot be downloaded.")

    filename = request.filename if request.filename.endswith(".wif") else f"{request.filename}.wif"

    return Response(
        content=request.wif_text,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
