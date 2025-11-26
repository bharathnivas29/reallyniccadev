# Code Consistency Standards

This document outlines the coding standards and best practices established during the Code Consistency Overhaul.

## 1. Logging

### Backend (`services/backend`)
- **Library**: `winston`
- **Usage**: Import `logger` from `src/shared/utils/logger`.
- **Levels**: `debug`, `info`, `warn`, `error`.
- **Context**: Use `logger.child('ContextName')` to create a context-aware logger.
- **Request Tracking**: All requests have a unique `requestId` (via `X-Request-ID` header) which is automatically included in logs.
- **Format**:
  - Development: Colored, human-readable.
  - Production: JSON structured logs.

**Example:**
```typescript
import { logger } from '../../shared/utils/logger';
const log = logger.child('MyService');

log.info('Operation started', { userId: '123' });
```

### Frontend (`services/frontend`)
- **Development**: API requests/responses are logged to console.
- **Production**: Logs are suppressed (except errors).
- **Implementation**: `api-client.ts` uses interceptors with `import.meta.env.DEV` check.

### ML Service (`services/ml-service`)
- **Library**: Standard Python `logging` module.
- **Usage**: `logger = logging.getLogger(__name__)`.
- **Format**: Standard timestamped logs.

## 2. Linting & Formatting

### TypeScript (Root, Backend, Frontend)
- **Linter**: ESLint
- **Formatter**: Prettier
- **Rules**:
  - Indent: 2 spaces
  - Quotes: Single
  - Semi: True
  - Trailing Comma: ES5
  - Print Width: 100

### Python (ML Service)
- **Linter**: Flake8
- **Formatter**: Black, Isort
- **Type Checker**: MyPy
- **Rules**:
  - Line Length: 100
  - Imports: Sorted by Isort

## 3. Type Safety

- **Shared Types**: `@really-nicca/types` contains core domain types (`Graph`, `Entity`, `Relationship`).
- **No Duplication**: Do not redefine these types locally. Import them.
- **ML Types**: `ExtractedEntity` and `ExtractedRelationship` are exported from `python-client.service.ts` for backend use.

## 4. Import/Export Patterns

- **Named Exports**: Prefer named exports over default exports.
  - **Good**: `export const app = ...;` -> `import { app } from ...`
  - **Bad**: `export default app;` -> `import app from ...`
- **Reason**: Better refactoring support and consistency.

## 5. Verification

- **Backend**: `npm run build`, `npm run lint`, `npm run test`
- **Frontend**: `npm run build`, `npm run lint`
- **ML Service**: `flake8`, `mypy`, `pytest`
