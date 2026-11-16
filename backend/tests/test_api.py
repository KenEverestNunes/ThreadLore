"""Integration tests for ThreadLore FastAPI REST service."""

from __future__ import annotations

import cv2
import pytest
from fastapi.testclient import TestClient

from backend.app.ai.gemini_curator import GeminiCurator, GeminiWeaveSuggestion
from backend.app.api.server import app
from backend.app.core.types import WeaveFamily
from backend.tests.fixtures.synthetic_textiles import generate_synthetic_weave

client = TestClient(app)


def test_health_check() -> None:
    """Verify healthz and root status endpoints."""
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "threadlore-api"
    assert "gemini-3.8-flash" in data["model"]

    res_root = client.get("/")
    assert res_root.status_code == 200
    # In production/build mode, root serves the React SPA HTML; otherwise JSON
    if "text/html" in res_root.headers.get("content-type", ""):
        assert "<!doctype html>" in res_root.text.lower()
    else:
        assert res_root.json()["status"] == "running"


def test_compile_plain_weave() -> None:
    """Verify compilation of 1/1 plain weave into 4-shaft draft and WIF 1.1."""
    payload = {
        "matrix": [[1, 0], [0, 1]],
        "warp_color_hex": "#1E293B",
        "weft_color_hex": "#E2E8F0",
        "repeat_warp": 10,
        "repeat_weft": 10,
        "units": "Centimeters",
    }
    res = client.post("/api/compile", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_valid"] is True
    assert len(data["validation_errors"]) == 0
    assert data["draft"] is not None
    assert data["draft"]["shafts"] == 2
    assert data["draft"]["treadles"] == 2
    assert data["draft"]["warp_threads"] == 20
    assert data["draft"]["weft_picks"] == 20

    wif = data["wif_text"]
    assert "[WEAVING]" in wif
    assert "Shafts=2" in wif
    assert "Treadles=2" in wif
    assert "Rising shed=1" in wif
    assert "Units=Centimeters" in wif


def test_compile_twill_with_provenance_and_repeats() -> None:
    """Verify 2/2 twill compilation with user provenance metadata."""
    payload = {
        "matrix": [
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 1],
            [1, 0, 0, 1],
        ],
        "warp_color_hex": "#2B4C7E",
        "weft_color_hex": "#DCE1E9",
        "repeat_warp": 15,
        "repeat_weft": 15,
        "units": "Inches",
        "provenance": {
            "title": "Harris Tweed Sample",
            "origin": "Outer Hebrides, Scotland",
            "maker": "Traditional Weaver",
            "date_period": "c. 1920",
            "notes": "Handwoven wool sample preserved in museum archives.",
        },
    }
    res = client.post("/api/compile", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_valid"] is True
    assert data["draft"]["shafts"] == 4
    assert data["draft"]["treadles"] == 4
    assert data["draft"]["warp_threads"] == 60
    assert data["draft"]["weft_picks"] == 60

    wif = data["wif_text"]
    assert "[NOTES]" in wif
    assert "1=Title: Harris Tweed Sample" in wif
    assert "2=Origin: Outer Hebrides, Scotland" in wif
    assert "3=Artisan/Maker: Traditional Weaver" in wif
    assert "4=Date/Period: c. 1920" in wif
    assert "5=Conservation Notes: Handwoven wool sample preserved in museum archives." in wif
    assert "Units=Inches" in wif


def test_compile_uniform_matrix_rejection() -> None:
    """Verify uniform column/row matrices fail validation gracefully without crashing."""
    payload = {
        "matrix": [
            [1, 1],
            [0, 1],
        ],  # Column 1 is all 1s -> uniform float
    }
    res = client.post("/api/compile", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_valid"] is False
    assert len(data["validation_errors"]) > 0
    assert data["draft"] is None
    assert data["wif_text"] == ""


def test_compile_invalid_matrix_shapes() -> None:
    """Verify 422 Unprocessable Entity on non-square or out-of-range matrices."""
    # Non-square matrix
    res = client.post("/api/compile", json={"matrix": [[1, 0, 0], [0, 1, 0]]})
    assert res.status_code == 422

    # 5x5 matrix exceeding 4-shaft repeat ceiling
    matrix_5x5 = [[1] * 5 for _ in range(5)]
    res = client.post("/api/compile", json={"matrix": matrix_5x5})
    assert res.status_code == 422

    # Non-binary values
    res = client.post("/api/compile", json={"matrix": [[2, 0], [0, 1]]})
    assert res.status_code == 422


def test_download_wif_attachment() -> None:
    """Verify download endpoint returns proper attachment headers and content."""
    wif_content = "[WIF]\r\nVersion=1.1\r\n[WEAVING]\r\nShafts=4\r\n"
    payload = {
        "wif_text": wif_content,
        "filename": "custom_draft",
    }
    res = client.post("/api/download-wif", json=payload)
    assert res.status_code == 200
    assert res.text == wif_content
    assert res.headers["content-disposition"] == 'attachment; filename="custom_draft.wif"'

    # Empty payload rejection
    res_empty = client.post("/api/download-wif", json={"wif_text": ""})
    assert res_empty.status_code == 400


def test_swatch_upload_success(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify swatch upload processes CV and dispatches to Gemini curator."""
    # Mock GeminiCurator to return deterministic suggestion
    def mock_analyze(self: GeminiCurator, image_bytes: bytes, mime_type: str = "image/jpeg") -> GeminiWeaveSuggestion:
        return GeminiWeaveSuggestion(
            status="success",
            weave_family=WeaveFamily.PLAIN_1_1,
            twill_direction=None,
            repeat_size=2,
            confidence=0.92,
            default_matrix=[[1, 0], [0, 1]],
            technical_description="Even 1/1 plain weave with balanced density.",
            float_risk_notes=None,
        )

    monkeypatch.setattr(GeminiCurator, "analyze_swatch", mock_analyze)

    # Generate synthetic swatch image
    img = generate_synthetic_weave(width=300, height=300, spacing_x=20.0, spacing_y=20.0)
    _, enc = cv2.imencode(".jpg", img)

    res = client.post(
        "/api/swatch",
        files={"file": ("swatch.jpg", enc.tobytes(), "image/jpeg")},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert data["weave_family"] == "plain_1_1"
    assert data["confidence"] == 0.92
    assert data["spacing_detected"] is True
    assert data["dx_px"] is not None
    assert data["dy_px"] is not None


def test_swatch_upload_invalid_mime() -> None:
    """Verify rejection of non-image MIME types."""
    res = client.post(
        "/api/swatch",
        files={"file": ("test.txt", b"plain text content", "text/plain")},
    )
    assert res.status_code == 400
    assert "Unsupported image MIME type" in res.json()["detail"]


def test_swatch_upload_oversized() -> None:
    """Verify rejection of files exceeding 2MB upload limit."""
    oversized_data = b"X" * (3 * 1024 * 1024)  # 3MB
    res = client.post(
        "/api/swatch",
        files={"file": ("large.png", oversized_data, "image/png")},
    )
    assert res.status_code == 413
    assert "exceeds maximum limit" in res.json()["detail"]
