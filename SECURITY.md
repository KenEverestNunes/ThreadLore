# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability or security defect, please report it through GitHub:

1. **GitHub Advisory:** Submit a private security advisory through the repository's **Security** tab.
2. **Issue Tracker:** Alternatively, open an issue labeled `security` on this repository.
3. **Details:** Include reproduction steps, environment details, and proof of concept.

Reports are reviewed directly by the repository maintainer.

## Security Controls & Hardening

ThreadLore implements multi-layer defense in depth:

- **Stateless Cloud Run Compute:** Swatch images are processed in memory and are not persisted to persistent disks without explicit storage opt-in.
- **Payload & Size Constraints:** Uploads are strictly capped at 2MB (`MAX_UPLOAD_SIZE_BYTES = 2097152`) to prevent denial-of-service memory exhaustion.
- **Strict MIME Whitelisting:** Accepts only `image/jpeg`, `image/png`, and `image/webp`. Unrecognized file types are rejected immediately.
- **Model Output Validation:** Gemini responses pass through strict Pydantic schema validation. Non-textile classifications fail closed (`status: "unavailable"`, `confidence: 0.0`), preventing untrusted LLM outputs from reaching the compiler.
- **External API Gate:** `ALLOW_EXTERNAL_IMAGE_PROCESSING` flag gates external API transmissions; when disabled, the backend processes swatches purely via local OpenCV.
- **CORS Hardening:** API endpoints whitelist specific frontend origins via environment configuration (`CORS_ORIGINS`).
