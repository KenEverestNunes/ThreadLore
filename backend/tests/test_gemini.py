"""Unit tests for Gemini 3.8 Flash technical curation client."""

from __future__ import annotations

import json
from unittest.mock import MagicMock

from backend.app.ai.gemini_curator import (
    SYSTEM_PROMPT,
    GeminiCurator,
    GeminiWeaveSuggestion,
)
from backend.app.config import Settings
from backend.app.core.types import WeaveFamily


def test_gemini_suggestion_model_validation() -> None:
    """Verify GeminiWeaveSuggestion validates structured JSON payloads correctly."""
    data = {
        "status": "success",
        "weave_family": "twill_2_2_z",
        "twill_direction": "Z",
        "repeat_size": 4,
        "confidence": 0.88,
        "default_matrix": [
            [1, 1, 0, 0],
            [1, 0, 0, 1],
            [0, 0, 1, 1],
            [0, 1, 1, 0],
        ],
        "technical_description": "2/2 right-hand Z-twill with two-thread warp floats.",
        "float_risk_notes": "Symmetrical structure; standard float length of 2 threads.",
    }
    suggestion = GeminiWeaveSuggestion.model_validate(data)
    assert suggestion.status == "success"
    assert suggestion.weave_family == WeaveFamily.TWILL_2_2_Z
    assert suggestion.twill_direction == "Z"
    assert suggestion.repeat_size == 4
    assert suggestion.confidence == 0.88
    assert suggestion.default_matrix is not None


def test_gemini_system_prompt_prohibits_cultural_hallucination() -> None:
    """Verify system instructions explicitly prohibit cultural/ethnic provenance speculation."""
    prompt_lower = SYSTEM_PROMPT.lower()
    assert "cultural origin" in prompt_lower
    assert "ethnic ancestry" in prompt_lower
    assert "prohibition" in prompt_lower or "prohibit" in prompt_lower or "do not speculate" in prompt_lower


def test_gemini_curator_mock_successful_analysis() -> None:
    """Verify successful end-to-end analysis using mocked GenAI client."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "status": "success",
        "weave_family": "plain_1_1",
        "twill_direction": None,
        "repeat_size": 2,
        "confidence": 0.95,
        "default_matrix": [[1, 0], [0, 1]],
        "technical_description": "1/1 plain weave with alternating interlacing.",
        "float_risk_notes": "Maximum interlacing frequency; zero float snagging risk.",
    })
    mock_client.models.generate_content.return_value = mock_response

    settings = Settings(PROJECT_ID="test-project", LOCATION="global", GEMINI_MODEL="gemini-3.8-flash")
    curator = GeminiCurator(client=mock_client, settings=settings)

    result = curator.analyze_swatch(b"fake_image_bytes")

    assert result.status == "success"
    assert result.weave_family == WeaveFamily.PLAIN_1_1
    assert result.confidence == 0.95
    assert result.repeat_size == 2
    mock_client.models.generate_content.assert_called_once()


def test_gemini_curator_low_confidence_gate() -> None:
    """Verify confidence below 0.60 is rejected and converted to status: 'unavailable'."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "status": "success",
        "weave_family": "twill_1_2_s",
        "twill_direction": "S",
        "repeat_size": 3,
        "confidence": 0.52,  # Low confidence
        "default_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        "technical_description": "Possible 1/2 twill but yarn crossings are fuzzy.",
        "float_risk_notes": None,
    })
    mock_client.models.generate_content.return_value = mock_response

    curator = GeminiCurator(client=mock_client)
    result = curator.analyze_swatch(b"fuzzy_swatch")

    assert result.status == "unavailable"
    assert "below threshold" in result.technical_description.lower() or "certainty" in result.technical_description.lower()


def test_gemini_curator_api_error_fallback() -> None:
    """Verify exceptions during API call gracefully fallback to 'unavailable'."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("Vertex AI network timeout")

    curator = GeminiCurator(client=mock_client)
    result = curator.analyze_swatch(b"image_bytes")

    assert result.status == "unavailable"
    assert result.weave_family == WeaveFamily.CUSTOM
    assert result.confidence == 0.0


def test_gemini_curator_no_client_fallback() -> None:
    """Verify uninitialized client returns safe unavailable suggestion."""
    curator = GeminiCurator()
    curator._client = None

    result = curator.fallback_suggestion("AI service offline")
    assert result.status == "unavailable"
    assert result.default_matrix is None


def test_gemini_curator_non_textile_guard_rejection() -> None:
    """Verify non-textile image (e.g. apple, pet, landscape) triggers safe unavailable status."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "status": "unavailable",
        "is_woven_textile": False,
        "weave_family": "custom",
        "twill_direction": None,
        "repeat_size": 2,
        "confidence": 0.0,
        "default_matrix": None,
        "technical_description": "Not a Woven Textile: The uploaded photograph does not appear to be a woven fabric.",
        "float_risk_notes": None,
    })
    mock_client.models.generate_content.return_value = mock_response

    curator = GeminiCurator(client=mock_client)
    result = curator.analyze_swatch(b"apple_photo_bytes")

    assert result.status == "unavailable"
    assert result.is_woven_textile is False
    assert "not a woven textile" in result.technical_description.lower()


def test_gemini_system_prompt_includes_textile_validation_guard() -> None:
    """Verify system prompt explicitly instructs textile fabric validation."""
    prompt_lower = SYSTEM_PROMPT.lower()
    assert "textile fabric validation" in prompt_lower
    assert "non-textile" in prompt_lower
    assert "is_woven_textile" in prompt_lower


def test_gemini_curator_policy_gate_blocks_external_call() -> None:
    """Verify ALLOW_EXTERNAL_IMAGE_PROCESSING=False prevents external API egress."""
    mock_client = MagicMock()
    settings = Settings(ALLOW_EXTERNAL_IMAGE_PROCESSING=False)
    curator = GeminiCurator(client=mock_client, settings=settings)

    result = curator.analyze_swatch(b"swatch_bytes")

    assert result.status == "unavailable"
    assert "not permitted by policy" in result.technical_description.lower()
    mock_client.models.generate_content.assert_not_called()


def test_gemini_suggestion_model_validator_normalizes_inconsistent_fields() -> None:
    """Verify model validator forces status=unavailable and confidence=0.0 when is_woven_textile is False."""
    suggestion = GeminiWeaveSuggestion.model_validate({
        "status": "success",
        "is_woven_textile": False,
        "confidence": 0.95,
        "technical_description": "Apple photo",
    })
    assert suggestion.status == "unavailable"
    assert suggestion.confidence == 0.0
    assert suggestion.is_woven_textile is False
    assert "not a woven textile" in suggestion.technical_description.lower()


