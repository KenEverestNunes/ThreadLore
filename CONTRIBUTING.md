# Contributing to ThreadLore

Thank you for contributing to ThreadLore! We welcome contributions that uphold mathematical rigor, cultural preservation ethics, and software reliability.

---

## 1. Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm
- Git

### Quickstart
```bash
git clone https://github.com/KenEverestNunes/ThreadLore.git
cd ThreadLore

# Backend virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# Frontend dependencies
npm --prefix frontend install

# Run development servers
uvicorn backend.app.api.server:app --reload --port 8000
npm --prefix frontend run dev
```

---

## 2. Quality Standards

Run the local quality gates before opening a pull request:

- **Python:**
  - Linting: `ruff check backend/ scripts/`
  - Formatting: `ruff format --check backend/ scripts/`
  - Strict Static Typing: `mypy backend/`
  - Unit & Integration Tests: `pytest backend/tests/ -v`
- **TypeScript / React:**
  - Type-Checking & Linting: `npm --prefix frontend run lint`
  - Unit Tests: `npm --prefix frontend test`
  - Production Build: `npm --prefix frontend run build`

---

## 3. Git Workflow & Conventional Commits

We follow Conventional Commits v1.0.0:

- `feat(...)`: New capability or feature
- `fix(...)`: Bug fix
- `test(...)`: Adding or updating test suites
- `docs(...)`: Documentation updates
- `refactor(...)`: Code changes without behavior alteration
- `ci(...)` / `build(...)`: CI/CD pipelines or dependency configuration

### Branch Conventions
- `main`: Protected production branch (PR and CI checks required)
- `feat/<feature-name>`: Feature branch
- `fix/<bug-name>`: Bugfix branch
