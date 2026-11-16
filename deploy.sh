#!/usr/bin/env bash
# =============================================================================
# ThreadLore — Automated Google Cloud Run Deployment Script
# =============================================================================
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-threadlore-prod}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-threadlore}"
GEMINI_LOCATION="${GEMINI_LOCATION:-global}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-3.8-flash}"
GCS_BUCKET="${GCS_BUCKET:-threadlore-swatches-prod}"

echo "============================================================"
echo " Deploying ThreadLore to Google Cloud Run"
echo " Project:       ${PROJECT_ID}"
echo " Region:        ${REGION}"
echo " Gemini Model:  ${GEMINI_MODEL} (Location: ${GEMINI_LOCATION})"
echo " GCS Bucket:    ${GCS_BUCKET}"
echo "============================================================"

# Set active GCP project
gcloud config set project "${PROJECT_ID}"

# Enable necessary Google Cloud APIs
echo "--> Enabling Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com

# Deploy service from source directory using Cloud Build
echo "--> Submitting build and deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --source . \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1 \
    --concurrency 80 \
    --set-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${GEMINI_LOCATION},GEMINI_MODEL=${GEMINI_MODEL},GCS_BUCKET_NAME=${GCS_BUCKET}"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')

echo "============================================================"
echo " ThreadLore successfully deployed!"
echo " Service URL: ${SERVICE_URL}"
echo " Health check: ${SERVICE_URL}/healthz"
echo "============================================================"
