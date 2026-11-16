.PHONY: setup lint-backend format-backend typecheck-backend test-backend lint-frontend build-frontend check run-backend run-frontend

PYTHON ?= python
NPM ?= npm

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt
	cd frontend && $(NPM) install

lint-backend:
	ruff check backend/
	ruff format --check backend/

format-backend:
	ruff format backend/

typecheck-backend:
	mypy backend/app/

test-backend:
	pytest backend/tests/ -v -m "not integration"

lint-frontend:
	cd frontend && $(NPM) run lint

build-frontend:
	cd frontend && $(NPM) run build

check: lint-backend typecheck-backend test-backend lint-frontend build-frontend

run-backend:
	uvicorn app.api.server:app --app-dir backend --reload --port 8000

run-frontend:
	cd frontend && $(NPM) run dev
