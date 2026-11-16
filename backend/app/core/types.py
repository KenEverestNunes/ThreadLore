"""Domain types, enums, exceptions, and models for ThreadLore weaving core."""

from enum import Enum

from pydantic import BaseModel, Field


class WeaveFamily(str, Enum):
    """Canonical supported weave structures (11 standard + custom)."""

    PLAIN_1_1 = "plain_1_1"
    TWILL_1_2_S = "twill_1_2_s"
    TWILL_1_2_Z = "twill_1_2_z"
    TWILL_2_1_S = "twill_2_1_s"
    TWILL_2_1_Z = "twill_2_1_z"
    TWILL_1_3_S = "twill_1_3_s"
    TWILL_1_3_Z = "twill_1_3_z"
    TWILL_2_2_S = "twill_2_2_s"
    TWILL_2_2_Z = "twill_2_2_z"
    TWILL_3_1_S = "twill_3_1_s"
    TWILL_3_1_Z = "twill_3_1_z"
    CUSTOM = "custom"


BinaryMatrix = list[list[int]]


CANONICAL_WEAVE_PRESETS: dict[WeaveFamily, BinaryMatrix] = {
    WeaveFamily.PLAIN_1_1: [[1, 0], [0, 1]],
    WeaveFamily.TWILL_1_2_S: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    WeaveFamily.TWILL_1_2_Z: [[1, 0, 0], [0, 0, 1], [0, 1, 0]],
    WeaveFamily.TWILL_2_1_S: [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
    WeaveFamily.TWILL_2_1_Z: [[1, 1, 0], [1, 0, 1], [0, 1, 1]],
    WeaveFamily.TWILL_1_3_S: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
    WeaveFamily.TWILL_1_3_Z: [[1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0]],
    WeaveFamily.TWILL_2_2_S: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]],
    WeaveFamily.TWILL_2_2_Z: [[1, 1, 0, 0], [1, 0, 0, 1], [0, 0, 1, 1], [0, 1, 1, 0]],
    WeaveFamily.TWILL_3_1_S: [[1, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1]],
    WeaveFamily.TWILL_3_1_Z: [[1, 1, 1, 0], [1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1]],
}


class ProvenanceMetadata(BaseModel):
    """User-supplied cultural and historical provenance metadata."""

    title: str = Field(default="Untitled Textile", description="Textile or pattern title")
    origin: str | None = Field(default=None, description="Geographic or cultural origin")
    maker: str | None = Field(default=None, description="Artisan, weaver, or community")
    date_period: str | None = Field(default=None, description="Estimated creation date or era")
    notes: str | None = Field(default=None, description="Conservation or historical notes")


class LoomDraft(BaseModel):
    """Deterministic 4-shaft rising-shed loom instructions."""

    shafts: int = Field(ge=1, le=4, description="Number of shafts required (≤ 4)")
    treadles: int = Field(ge=1, le=4, description="Number of treadles required (≤ 4)")
    warp_threads: int = Field(ge=2, description="Total warp ends in draft")
    weft_picks: int = Field(ge=2, description="Total weft picks in draft")
    threading: list[int] = Field(description="1-based shaft assignment for each warp end")
    treadling: list[int] = Field(description="1-based treadle assignment for each weft pick")
    tieup: list[list[int]] = Field(description="Shafts × Treadles binary matrix (1=shaft raised)")
    drawdown: list[list[int]] = Field(description="Simulated weft_picks × warp_threads binary grid")


class ValidationResult(BaseModel):
    """Result of structural interlacing and loom constraint validation."""

    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    max_warp_float: int = 0
    max_weft_float: int = 0
    shafts_used: int = 0
    treadles_used: int = 0


# Domain Exceptions
class WeaveError(Exception):
    """Base exception for all weave compilation and validation failures."""

    pass


class LoomShaftOverflowError(WeaveError):
    """Raised when pattern requires more than 4 shafts."""

    pass


class LoomTreadleOverflowError(WeaveError):
    """Raised when pattern requires more than 4 treadles."""

    pass


class InvalidDrawdownError(WeaveError):
    """Raised when input matrix is non-binary, empty, or has invalid dimensions."""

    pass


class CyclicFloatViolationError(WeaveError):
    """Raised when cyclic thread floats exceed allowable threshold."""

    pass


class UniformThreadViolationError(WeaveError):
    """Raised when a warp end or weft pick never interlaces (completely uniform row/col)."""

    pass
