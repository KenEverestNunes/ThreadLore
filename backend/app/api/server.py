"""FastAPI application factory, middleware, routing, and lifecycle handlers."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes_compile import router as compile_router
from backend.app.api.routes_swatch import router as swatch_router
from backend.app.config import get_settings
from backend.app.core.types import LoomConstraintError


def create_app() -> FastAPI:
    """Instantiate and configure the ThreadLore FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ThreadLore API",
        description=(
            "AI-assisted, human-verified textile reconstruction engine converting "
            "macro fabric photographs into mathematically verified loom-compatible WIF 1.1 drafts."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Cross-Origin Resource Sharing (CORS) Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include REST API Routers
    app.include_router(swatch_router, prefix="/api")
    app.include_router(compile_router, prefix="/api")

    # Global Exception Handlers
    @app.exception_handler(LoomConstraintError)
    async def loom_constraint_exception_handler(
        request: Request, exc: LoomConstraintError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": f"Loom constraint violation: {str(exc)}"},
        )

    @app.exception_handler(ValueError)
    async def value_error_exception_handler(
        request: Request, exc: ValueError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    # Health Check Endpoint
    @app.get("/healthz", tags=["System"])
    async def health_check() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "threadlore-api",
            "version": "1.0.0",
            "model": settings.GEMINI_MODEL,
        }

    # Static file mounting for Single Page Application (SPA)
    # Checks production container path (/app/static) or local build (frontend/dist)
    static_dirs = [
        Path("/app/static"),
        Path(os.path.join(os.path.dirname(__file__), "../../../frontend/dist")),
    ]
    spa_dir: Path | None = None
    for candidate in static_dirs:
        if candidate.exists() and (candidate / "index.html").exists():
            spa_dir = candidate
            break

    if spa_dir is not None:
        assets_dir = spa_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

        @app.get("/", tags=["UI"])
        async def serve_spa_root() -> FileResponse:
            assert spa_dir is not None
            return FileResponse(str(spa_dir / "index.html"))

        @app.get("/{full_path:path}", tags=["UI"])
        async def serve_spa_fallback(full_path: str) -> Any:
            assert spa_dir is not None
            # If path points to an actual file (e.g. favicon, vite.svg)
            target = spa_dir / full_path
            if target.exists() and target.is_file():
                return FileResponse(str(target))
            return FileResponse(str(spa_dir / "index.html"))

    else:
        @app.get("/", tags=["System"])
        async def root() -> dict[str, str]:
            return {
                "service": "ThreadLore API",
                "status": "running",
                "documentation": "/docs",
            }

    return app


app = create_app()
