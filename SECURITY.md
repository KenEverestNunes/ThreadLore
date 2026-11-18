# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately:

1. **Email:** Send details to `security@threadlore.org` or submit a private security advisory through GitHub.
2. **Details:** Include reproduction steps, environment details, and proof of concept.
3. **Response SLA:** We acknowledge reports within 48 hours and provide regular status updates until a patch is released.
4. **Coordinated Disclosure:** Please do not disclose findings publicly until a patch is released.

## Security Controls & Hardening

ThreadLore implements multi-layer defense in depth:

- **Stateless Cloud Run Compute:** Swatch images are processed in memory and are not persisted to persistent disks without explicit storage opt-in.
- **Payload & Size Constraints:** Uploads are strictly capped at 2MB (`MAX_UPLOAD_SIZE_BYTES = 2097152`) to prevent denial-of-service memory exhaustion.
- **Strict MIME Whitelisting:** Accepts only `image/jpeg`, `image/png`, and `image/webp`. Unrecognized file types are rejected immediately.
- **Model Output Validation:** Gemini responses pass through strict Pydantic schema validation. Non-textile classifications fail closed (`status: "unavailable"`, `confidence: 0.0`), preventing untrusted LLM outputs from reaching the compiler.
- **External API Gate:** `ALLOW_EXTERNAL_IMAGE_PROCESSING` flag gates external API transmissions; when disabled, the backend processes swatches purely via local OpenCV.
- **CORS Hardening:** API endpoints whitelist specific frontend origins via environment configuration (`CORS_ORIGINS`).
