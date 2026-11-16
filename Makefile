.PHONY: setup lint-backend format-backend typecheck-backend test-backend lint-frontend build-frontend check run-backend run-frontend

PYTHON ?= python
NPM ?= npm

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt
	cd frontend && $(NPM) install

lint-backend:
	ruff check backend/ scripts/
	ruff format --check backend/ scripts/

format-backend:
	ruff format backend/ scripts/

typecheck-backend:
	mypy backend/app/ scripts/

test-backend:
	pytest backend/tests/ -v
	$(PYTHON) scripts/verify_wif_handweaving.py

lint-frontend:
	cd frontend && $(NPM) run lint

build-frontend:
	cd frontend && $(NPM) run build

check: lint-backend typecheck-backend test-backend lint-frontend build-frontend

run-backend:
	uvicorn backend.app.api.server:app --reload --port 8000

run-frontend:
	cd frontend && $(NPM) run dev
