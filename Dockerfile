# =========================================================================
# Stage 1: Build React + TypeScript Frontend
# =========================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =========================================================================
# Stage 2: Python FastAPI Backend + Static SPA Serving
# =========================================================================
FROM python:3.11-slim AS runner

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies for OpenCV headless and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application package
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into /app/static
COPY --from=frontend-builder /build/dist ./static

EXPOSE 8080

# Run uvicorn on port 8080 (Cloud Run default)
CMD ["sh", "-c", "uvicorn backend.app.api.server:app --host 0.0.0.0 --port ${PORT}"]
