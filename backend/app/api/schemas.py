"""Pydantic request and response schemas for ThreadLore REST API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from backend.app.core.types import (
    BinaryMatrix,
    LoomDraft,
    ProvenanceMetadata,
    WeaveFamily,
)


class SwatchAnalysisResponse(BaseModel):
    """Response DTO for textile swatch optical and frequency analysis."""

    status: Literal["success", "unavailable", "uncertain"] = Field(
        description="Overall swatch analysis status."
    )
    is_woven_textile: bool = Field(
        default=True,
        description="True if the image depicts a woven textile fabric; false if non-textile object is detected.",
    )
    weave_family: WeaveFamily = Field(
        description="Suggested weave structure family classification."
    )
    twill_direction: Literal["S", "Z"] | None = Field(
        default=None,
        description="Diagonal twill wale direction (S or Z) if twill structure.",
    )
    repeat_size: int = Field(
        ge=2,
        le=4,
        description="Dimension N of repeat tile (2, 3, or 4).",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Uncalibrated heuristic confidence indicator [0.0, 1.0].",
    )
    default_matrix: BinaryMatrix | None = Field(
        default=None,
        description="NxN master tile binary pattern matrix (1=warp over, 0=weft over).",
    )
    technical_description: str = Field(
        description="Technical description of interlacing mechanics and float intervals.",
    )
    float_risk_notes: str | None = Field(
        default=None,
        description="Advisory notes on float runs or fabric durability.",
    )
    dx_px: float | None = Field(
        default=None,
        description="Warp thread spacing in pixels (null if uncertain).",
    )
    dy_px: float | None = Field(
        default=None,
        description="Weft thread spacing in pixels (null if uncertain).",
    )
    spacing_detected: bool = Field(
        description="True if frequency peaks satisfied confidence criteria.",
    )
    rotation_degrees: float = Field(
        description="Detected fabric skew angle in degrees.",
    )
    dominant_warp_hex: str | None = Field(
        default=None,
        description="Dominant warp yarn color hex code extracted via K-Means clustering.",
    )
    dominant_weft_hex: str | None = Field(
        default=None,
        description="Dominant weft yarn color hex code extracted via K-Means clustering.",
    )


class CompileDraftRequest(BaseModel):
    """Request DTO to factor master tile into loom draft and export WIF."""

    matrix: BinaryMatrix = Field(
        description="2x2, 3x3, or 4x4 binary repeat matrix."
    )
    warp_color_hex: str = Field(
        default="#1E293B",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Warp yarn hex color code (e.g. #1E293B).",
    )
    weft_color_hex: str = Field(
        default="#E2E8F0",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Weft yarn hex color code (e.g. #E2E8F0).",
    )
    repeat_warp: int = Field(
        default=10,
        ge=1,
        le=200,
        description="Number of horizontal repeat multiples for full project draft.",
    )
    repeat_weft: int = Field(
        default=10,
        ge=1,
        le=200,
        description="Number of vertical repeat multiples for full project draft.",
    )
    units: Literal["Inches", "Centimeters", "Decipoints"] = Field(
        default="Centimeters",
        description="Valid physical measurement units for WIF 1.1.",
    )
    provenance: ProvenanceMetadata | None = Field(
        default=None,
        description="Optional user-supplied cultural and historical provenance metadata.",
    )


class CompileDraftResponse(BaseModel):
    """Response DTO containing compiled loom draft, validation, and WIF 1.1."""

    draft: LoomDraft | None = Field(
        default=None,
        description="Deterministic 4-shaft rising-shed loom instructions.",
    )
    is_valid: bool = Field(
        description="True if pattern is structurally sound without uniform or over-limit floats.",
    )
    validation_errors: list[str] = Field(
        default_factory=list,
        description="Diagnostic messages detailing why pattern failed validation.",
    )
    validation_warnings: list[str] = Field(
        default_factory=list,
        description="Advisory warnings on long floats.",
    )
    wif_text: str = Field(
        default="",
        description="Standards-compliant WIF 1.1 file content (CRLF line endings).",
    )


class DownloadWifRequest(BaseModel):
    """Request DTO for downloading WIF file with custom filename."""

    wif_text: str = Field(
        description="Raw WIF 1.1 text content to stream as file."
    )
    filename: str = Field(
        default="threadlore_draft.wif",
        description="Attachment filename for browser download.",
    )
