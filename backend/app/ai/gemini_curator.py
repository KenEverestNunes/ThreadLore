"""Gemini 3.8 Flash technical curation client for textile weave identification.

Integrates Vertex AI via the google-genai SDK to analyze photographic swatches,
suggesting weave families (plain weave or straight twills) and technical float
characteristics while strictly avoiding speculation on cultural provenance.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from backend.app.config import Settings, get_settings
from backend.app.core.types import (
    CANONICAL_WEAVE_PRESETS,
    BinaryMatrix,
    WeaveFamily,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert technical textile analyst for ThreadLore.
Your objective is to identify the micro-structural weave pattern of a photographed textile swatch
to aid loom reconstruction.

Follow these strict invariants:
1. TECHNICAL MECHANICS ONLY: Analyze yarn interlacing intervals, float lengths, and diagonal wale orientation.
2. SUPPORTED WEAVES: Classify into one of:
   - plain_1_1 (2x2 repeat)
   - straight twills: twill_1_2_s, twill_1_2_z, twill_2_1_s, twill_2_1_z (3x3 repeat)
   - straight twills: twill_1_3_s, twill_1_3_z, twill_2_2_s, twill_2_2_z, twill_3_1_s, twill_3_1_z (4x4 repeat)
   - custom (if non-standard or irregular)
3. CULTURAL PROVENANCE PROHIBITION: DO NOT speculate or make claims regarding the fabric's cultural origin,
   geographical history, ethnic ancestry, artisan, or era. ThreadLore relies exclusively on user-supplied
   provenance metadata. Keep the technical description focused on yarn interlacing and physical weave physics.
4. CONFIDENCE: Treat confidence as an uncalibrated heuristic indicator [0.0, 1.0]. If the swatch is blurry,
   fuzzed, damaged, or ambiguous, assign confidence < 0.60 so the weaver is prompted to verify manually.
"""


class GeminiWeaveSuggestion(BaseModel):
    """Structured weave classification proposal from Gemini 3.8 Flash."""

    status: Literal["success", "unavailable"] = Field(
        default="success",
        description="Identification status. 'unavailable' if uncertain or failed.",
    )
    weave_family: WeaveFamily = Field(
        default=WeaveFamily.CUSTOM,
        description="Suggested weave family classification.",
    )
    twill_direction: Literal["S", "Z"] | None = Field(
        default=None,
        description="Diagonal twill wale direction (S = up-left, Z = up-right) if twill.",
    )
    repeat_size: int = Field(
        ge=2,
        le=4,
        default=2,
        description="Dimension N of the repeat tile (2, 3, or 4).",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        default=0.0,
        description="Uncalibrated heuristic confidence score (not a statistical guarantee).",
    )
    default_matrix: BinaryMatrix | None = Field(
        default=None,
        description="NxN binary drawdown tile for suggested weave (1=warp over, 0=weft over).",
    )
    technical_description: str = Field(
        default="",
        description="Objective description of yarn interlacing mechanics and float intervals.",
    )
    float_risk_notes: str | None = Field(
        default=None,
        description="Advisory notes on float lengths or snagging risks for practical weaving.",
    )


class GeminiCurator:
    """Multimodal textile curation client powered by gemini-3.8-flash on Vertex AI."""

    CONFIDENCE_THRESHOLD: float = 0.60

    def __init__(
        self,
        client: genai.Client | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._client = client

    @property
    def client(self) -> genai.Client | None:
        """Lazy-initialize Vertex AI or AI Studio client if not injected."""
        if self._client is None:
            try:
                if self.settings.GEMINI_API_KEY:
                    self._client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
                else:
                    self._client = genai.Client(
                        vertexai=True,
                        project=self.settings.PROJECT_ID,
                        location=self.settings.LOCATION,
                    )
            except Exception as e:
                logger.warning("Could not initialize GenAI client: %s", e)
                self._client = None
        return self._client

    def fallback_suggestion(self, reason: str = "") -> GeminiWeaveSuggestion:
        """Return a safe 'unavailable' suggestion prompting manual weaver verification."""
        desc = "Weave structure could not be identified with certainty. "
        if reason:
            desc += f"({reason}) "
        desc += "Please select a weave preset or configure the master tile manually."

        return GeminiWeaveSuggestion(
            status="unavailable",
            weave_family=WeaveFamily.CUSTOM,
            twill_direction=None,
            repeat_size=2,
            confidence=0.0,
            default_matrix=None,
            technical_description=desc,
            float_risk_notes=None,
        )

    def analyze_swatch(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> GeminiWeaveSuggestion:
        """Analyze a rectified textile swatch image and return structured weave proposal.

        If the AI call fails, times out, or returns confidence < 0.60, returns
        a status: 'unavailable' fallback rather than hallucinating a false identification.

        Args:
            image_bytes: Rectified JPEG or PNG swatch bytes.
            mime_type: Image MIME type ("image/jpeg" or "image/png").

        Returns:
            GeminiWeaveSuggestion: Validated structured proposal.
        """
        cli = self.client
        if cli is None:
            return self.fallback_suggestion("AI service not initialized")

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        prompt_text = (
            "Analyze this textile macro swatch image. Identify the weave structure, "
            "repeat size (2, 3, or 4), twill direction (S or Z, or null for plain weave), "
            "and technical interlacing characteristics according to instructions."
        )

        try:
            response = cli.models.generate_content(
                model=self.settings.GEMINI_MODEL,
                contents=[image_part, prompt_text],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=GeminiWeaveSuggestion,
                    temperature=0.1,
                ),
            )

            raw_text = response.text or ""
            data: dict[str, Any] = json.loads(raw_text)
            suggestion = GeminiWeaveSuggestion.model_validate(data)

            # Enforce uncalibrated confidence threshold gate
            if suggestion.confidence < self.CONFIDENCE_THRESHOLD:
                logger.info(
                    "Gemini confidence (%.2f) below threshold (%.2f); marking unavailable",
                    suggestion.confidence,
                    self.CONFIDENCE_THRESHOLD,
                )
                return self.fallback_suggestion(
                    f"Heuristic confidence {suggestion.confidence:.2f} below threshold"
                )

            # Auto-populate canonical matrix if missing from response
            if suggestion.default_matrix is None and suggestion.weave_family in CANONICAL_WEAVE_PRESETS:
                suggestion.default_matrix = CANONICAL_WEAVE_PRESETS[suggestion.weave_family]

            return suggestion

        except Exception as exc:
            logger.error("Gemini swatch analysis failed: %s", exc)
            return self.fallback_suggestion("Analysis request failed")
