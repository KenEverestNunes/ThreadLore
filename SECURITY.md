# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

ThreadLore takes security seriously. If you discover a security vulnerability, please report it privately:

1. **Email:** Send details to `security@threadlore.org` or open a private vulnerability report via GitHub Security Advisories.
2. **Details:** Include reproduction steps, environment details, and proof of concept if available.
3. **Response Time:** You will receive an acknowledgment within 48 hours and regular updates as the issue is investigated and patched.
4. **Public Disclosure:** Please do not disclose vulnerabilities publicly until a fix has been released.

## Security Controls

- **Stateless Cloud Run Execution:** No sensitive user swatches are permanently stored without explicit consent.
- **Payload Limits:** Maximum image upload capped at 2MB (`MAX_UPLOAD_SIZE_BYTES = 2097152`).
- **MIME Whitelisting:** Strictly limits input to `image/jpeg`, `image/png`, and `image/webp`.
- **CORS Hardening:** Configurable origin whitelisting via environment variables.
