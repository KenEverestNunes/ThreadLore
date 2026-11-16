# Contributing to ThreadLore

Thank you for contributing to ThreadLore! We welcome contributions that uphold mathematical rigor, cultural preservation ethics, and software reliability.

---

## 1. Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 20+ & npm
- Git

### Quickstart
```bash
# Clone the repository
git clone https://github.com/KenEverestNunes/ThreadLore.git
cd ThreadLore

# Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# Set up frontend
cd frontend
npm ci
cd ..

# Run backend development server
uvicorn backend.app.api.server:app --reload --port 8000

# In another terminal, run frontend development server
npm --prefix frontend run dev
```

---

## 2. Code Standards

- **Python:**
  - Formatting & Linting: `ruff check backend/ scripts/` and `ruff format --check backend/ scripts/`
  - Strict Static Typing: `mypy backend/app/ scripts/` (zero untyped definitions)
  - Unit & Integration Tests: `pytest backend/tests/ -v`
- **TypeScript / React:**
  - Strict Type-Checking: `npm --prefix frontend run lint` (`tsc --noEmit`)
  - Production Asset Compilation: `npm --prefix frontend run build`

---

## 3. Git Workflow & Conventional Commits

ThreadLore strictly enforces **Conventional Commits v1.0.0**:

- `feat(...)`: New feature or capability
- `fix(...)`: Bug fix
- `test(...)`: Adding or modifying tests
- `docs(...)`: Documentation changes
- `ci(...)` / `build(...)`: Infrastructure, dependencies, or pipeline updates
- `refactor(...)`: Code change without behavior modification

### Branching Convention
- `main`: Production-ready release branch
- `develop`: Primary integration branch
- `feat/<feature-name>`: Feature branches created off `develop`
- `fix/<bug-name>`: Bugfix branches created off `develop`
