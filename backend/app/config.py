"""Application configuration and environment settings."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ThreadLore system settings loaded from environment or defaults."""

    PROJECT_ID: str = "threadlore-prod"
    LOCATION: str = "global"  # Gemini 3.8 Flash endpoint location (decoupled from Cloud Run region)
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GCS_BUCKET_NAME: str = "threadlore-swatches-prod"
    MAX_UPLOAD_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached singleton Settings instance."""
    return Settings()
