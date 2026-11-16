"""Google Cloud Storage service for swatch archiving and WIF asset delivery."""

from __future__ import annotations

import logging
from typing import Any

from google.cloud import storage

from backend.app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class StorageService:
    """Manages cloud artifact uploads to Google Cloud Storage."""

    def __init__(self, client: Any = None, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client = client

    @property
    def client(self) -> storage.Client | None:
        """Lazy-initialize GCS client if not injected."""
        if self._client is None:
            try:
                self._client = storage.Client(project=self.settings.PROJECT_ID)
            except Exception as exc:
                logger.debug("Google Cloud Storage client uninitialized (offline/local mode): %s", exc)
                self._client = None
        return self._client

    def upload_swatch(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> str | None:
        """Upload raw or rectified textile swatch to GCS bucket.

        Args:
            image_bytes: Swatch image bytes.
            filename: Destination blob name (e.g. swatches/uuid.jpg).
            content_type: MIME type of image.

        Returns:
            str | None: GCS object URI (gs://...) or None if storage is offline.
        """
        cli = self.client
        if cli is None:
            return None

        try:
            bucket = cli.bucket(self.settings.GCS_BUCKET_NAME)
            blob = bucket.blob(f"swatches/{filename}")
            blob.upload_from_string(image_bytes, content_type=content_type)
            return f"gs://{self.settings.GCS_BUCKET_NAME}/swatches/{filename}"
        except Exception as exc:
            logger.warning("GCS swatch upload failed (fallback to stateless memory): %s", exc)
            return None

    def upload_wif(self, wif_text: str, filename: str) -> str | None:
        """Upload compiled WIF 1.1 file to GCS bucket.

        Args:
            wif_text: Standards-compliant WIF text content.
            filename: Target file name (e.g. drafts/sample.wif).

        Returns:
            str | None: GCS object URI or None.
        """
        cli = self.client
        if cli is None:
            return None

        try:
            bucket = cli.bucket(self.settings.GCS_BUCKET_NAME)
            blob = bucket.blob(f"drafts/{filename}")
            blob.upload_from_string(wif_text.encode("utf-8"), content_type="text/plain; charset=utf-8")
            return f"gs://{self.settings.GCS_BUCKET_NAME}/drafts/{filename}"
        except Exception as exc:
            logger.warning("GCS WIF upload failed: %s", exc)
            return None
