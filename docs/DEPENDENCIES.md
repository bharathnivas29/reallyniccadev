# Project Dependencies & Versions

> **Strict Versioning:** We pin versions to ensure reproducibility and stability.  
> **Rule:** Do not upgrade without testing.

---

## 📦 Backend Service (Node.js)

**Runtime:**
- Node.js: `v18.x` (LTS)
- Package Manager: `pnpm` (latest)

**Core Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | `^4.18.2` | Web framework |
| `cors` | `^2.8.5` | Cross-origin resource sharing |
| `axios` | `^1.6.2` | HTTP client for ML service calls |
| `uuid` | `^9.0.1` | ID generation |
| `dotenv` | `^16.3.1` | Environment variables |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.3.3` | Language support |
| `ts-node` | `^10.9.2` | Execution |
| `nodemon` | `^3.0.2` | Auto-restart |
| `@types/node` | `^20.10.4` | Type definitions |
| `@types/express` | `^4.17.21` | Type definitions |
| `jest` | `^29.7.0` | Testing framework |
| `ts-jest` | `^29.1.1` | TypeScript preprocessor for Jest |
| `@types/jest` | `^29.5.11` | Jest types |
| `eslint` | `^8.55.0` | Linting |

---

## 🐍 ML Service (Python)

**Runtime:**
- Python: `3.9+`

**Core Dependencies (`requirements.txt`):**
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | `==0.109.0` | Web framework |
| `uvicorn[standard]` | `==0.27.0` | ASGI server |
| `pydantic` | `==2.5.3` | Data validation (v2) |
| `spacy` | `==3.7.2` | NLP framework |
| `requests` | `==2.31.0` | HTTP client |
| `google-generativeai` | `==0.3.2` | Gemini API client |
| `python-dotenv` | `==1.0.0` | Environment variables |
| `numpy` | `==1.26.3` | Numerical operations |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | `==7.4.4` | Testing framework |
| `pytest-asyncio` | `==0.23.3` | Async test support |
| `httpx` | `==0.26.0` | Async HTTP client (for tests) |
| `black` | `==23.12.1` | Code formatting |
| `mypy` | `==1.8.0` | Static type checking |

**Models:**
- `en_core_web_sm` (`==3.7.0`)

---

## 📦 Shared Packages (`packages/`)

### `packages/types`
- `typescript`: `^5.3.3`
- No runtime dependencies (pure types)

---

## 🛠️ Global Tools

- **VS Code Extensions:**
  - ESLint
  - Prettier
  - Python (Microsoft)
  - Pylance
- **Git:** Latest stable

---

## 🔒 Version Control Rules

1. **Lockfiles:** Always commit `pnpm-lock.yaml` and `package-lock.json` (if used).
2. **Updates:** Update one package at a time and run full test suite.
3. **Engines:** Enforce Node/Python versions in `package.json` / `runtime.txt`.
