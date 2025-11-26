# Backend Import Path Reference Guide

## Project Structure
```
services/backend/
├── src/
│   ├── features/
│   │   └── organize/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── mappers/
│   │       └── routes.ts
│   └── core/
│       └── ml/
└── tests/
    ├── unit/
    │   └── services/
    └── integration/
        └── organize/
```

## Import Path Rules (MUST FOLLOW)

### From Test Files → Src Files

**From: `tests/unit/services/*.test.ts`**
- To src: `../../../src/`
- Example: `import { GraphBuilderService } from '../../../src/features/organize/services/graph-builder.service';`

**From: `tests/integration/organize/*.test.ts`**
- To src: `../../../src/`
- Example: `import { uploadDocument } from '../../../src/features/organize/controllers/upload.controller';`

**From: `tests/mappers/*.test.ts`**
- To src: `../../src/`
- Example: `import { mapMLEntityToEntity } from '../../src/features/organize/mappers/ml-to-graph.mapper';`

### From Src Files → Src Files

**From: `src/features/organize/controllers/*.ts`**
- To services: `../services/`
- To mappers: `../mappers/`
- To core: `../../../core/`
- Example: `import { uploadService } from '../services/upload.service';`

**From: `src/features/organize/services/*.ts`**
- To other services: `./`
- To mappers: `../mappers/`
- To core: `../../../core/`

### Using @really-nicca/types (Always Correct)
- Always use: `import { Entity, Graph } from '@really-nicca/types';`
- Never use: `@really-nicca/types/entity` or subpaths

## Verification Checklist (BEFORE Writing Import)

1. ✅ Find the current file location
2. ✅ Find the target file location
3. ✅ Count directory levels UP to common ancestor
4. ✅ Count directory levels DOWN to target
5. ✅ Write `../` for each level up, then path down
6. ✅ Verify with `npx tsc --noEmit`

## Common Mistakes to AVOID

❌ **WRONG:** Assuming paths without counting
❌ **WRONG:** Using only 2 levels (`../../`) for test files
❌ **WRONG:** Using `/entity` subpaths for @really-nicca/types

✅ **RIGHT:** Count levels every single time
✅ **RIGHT:** Test files always need 3 levels (`../../../src/`)
✅ **RIGHT:** Use main package import for types

## Quick Reference Table

| From Location | To src/ | To features/ | To core/ |
|--------------|---------|--------------|----------|
| `tests/unit/services/` | `../../../src/` | `../../../src/features/` | `../../../src/core/` |
| `tests/integration/organize/` | `../../../src/` | `../../../src/features/` | `../../../src/core/` |
| `src/features/organize/controllers/` | N/A | `../` | `../../../core/` |
| `src/features/organize/services/` | N/A | `../` | `../../../core/` |
