# Really Nicca - Development Framework

**Last Updated**: 2025-11-24  
**Purpose**: Guide for development practices, workflows, and standards

---

## Development Philosophy

### Core Principles

1. **Accuracy > Speed** - A slow correct answer beats a fast wrong one
2. **Simple > Complex** - Prefer simple solutions, add complexity only when necessary
3. **Working > Perfect** - Ship functional code first, optimize later
4. **Test-Driven** - Every function has a test, every stage validated before moving forward
5. **Linear > Parallel** - Complete one stage fully before next

---

## Project Phases

### Phase 1: Accurate Graph Extraction ✅ COMPLETE
- **Goal**: Build the most accurate knowledge graph extraction engine
- **Status**: Complete (100% code quality, all tests passing)
- **Duration**: 4-6 weeks
- **Key Achievements**:
  - Hybrid entity extraction (spaCy + Gemini)
  - Multi-signal deduplication
  - Co-occurrence + LLM relationship classification
  - Backend API with retry logic
  - Comprehensive testing (71/71 ML + 7/7 integration)

### Phase 2: User Interface & Productization 🚧 IN PROGRESS
- **Goal**: Build web UI with visualization, file upload, editing, export
- **Status**: Stage 8 (Frontend Foundation) in progress
- **Timeline**: 5-8 weeks
- **Key Features**:
  - React + Vite + Cytoscape.js frontend
  - File upload (PDF, DOCX, TXT)
  - Interactive graph visualization
  - Manual editing (merge nodes, edit relationships)
  - Export (JSON, CSV, PNG)
  - Multi-document graph merging

### Phase 3: Advanced Features (FUTURE)
- Gap detection
- Neo4j integration
- Authentication & user management
- Collaborative editing
- AI memory export

---

## Development Workflow

### 1. Planning
- Read PROJECT_SPEC.md (source of truth)
- Review TASKS.md for current stage
- Create implementation_plan.md for complex features
- Get approval before coding

### 2. Implementation
- Follow ARCHITECTURE.md patterns
- Use existing folder structure
- Write tests alongside code
- Document non-obvious decisions

### 3. Testing
- Unit tests for all functions
- Integration tests for pipelines
- Manual testing for UI features
- Performance benchmarks

### 4. Documentation
- Update ROUTES.md for new endpoints
- Update ALGORITHMS.md for new logic
- Add code comments for complex sections
- Update TASKS.md progress

---

## Coding Standards

> [!NOTE]
> For detailed coding standards, including logging, linting, and type safety, please refer to [CODE_CONSISTENCY.md](./CODE_CONSISTENCY.md).

### TypeScript (Backend + Frontend)

**Imports**:
```typescript
// ✅ Good
import { Request, Response } from 'express';
import { Entity } from '@really-nicca/types';
import { GraphBuilder } from '../services/graph-builder';

// ❌ Bad
import express = require('express'); // No CommonJS
const { Entity } = require('@really-nicca/types'); // Use ESM
import app from '../server'; // Avoid default exports
```

**Type Safety**:
```typescript
// ✅ Good
function processText(text: string): string[] {
  return text.split(' ');
}

// ❌ Bad
function processText(text: any): any { // No 'any'
  return text.split(' ');
}
```

**Error Handling**:
```typescript
// ✅ Good
try {
  await service.doWork();
} catch (error) {
  logger.error('Failed to do work', { error }); // Use structured logging
  throw new AppError(400, 'Invalid input');
}

// ❌ Bad
try {
  await service.doWork();
} catch (e) {
  console.log(e); // Use proper logging
}
```

### Python (ML Service)

**Imports**:
```python
# ✅ Good
import os
from typing import List
from fastapi import APIRouter
from app.features.organize.schemas.extract import ExtractRequest

# ❌ Bad
from ...schemas.extract import ExtractRequest # Avoid deep relative imports
```

**Type Hints**:
```python
# ✅ Good
def process_text(text: str) -> List[str]:
    return text.split()

# ❌ Bad
def process_text(text):
    return text.split()
```

**Error Handling**:
```python
# ✅ Good
if not text:
    raise HTTPException(status_code=400, detail="Text cannot be empty")

# ❌ Bad
if not text:
    return None # Use exceptions for errors
```

### React (Frontend)

**Components**:
```typescript
// ✅ Good
interface GraphVisualizationProps {
  graph: Graph;
  onNodeClick: (nodeId: string) => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ graph, onNodeClick }) => {
  // Component logic
};

// ❌ Bad
export const GraphVisualization = (props: any) => { // No 'any'
  // Component logic
};
export default GraphVisualization; // Avoid default exports
```

**Hooks**:
```typescript
// ✅ Good
const [graph, setGraph] = useState<Graph | null>(null);
const [loading, setLoading] = useState<boolean>(false);

useEffect(() => {
  loadGraph();
}, [graphId]);

// ❌ Bad
const [graph, setGraph] = useState(); // Specify type
```

---

## Testing Strategy

### Unit Tests
- **Backend**: Text chunking, graph builder, storage
- **ML Service**: String similarity, cosine similarity, entity merging
- **Frontend**: Component rendering, hooks, utilities

### Integration Tests
- **E2E Pipeline**: Text → Backend → ML → Graph
- **API Tests**: All endpoints with various inputs
- **UI Tests**: User flows (upload → visualize → edit → export)

### Manual Testing
- **Sample Texts**: Simple, medium, complex, edge cases
- **Performance**: Measure latency, memory usage
- **Visual Inspection**: Verify graph quality

---

## Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/stage-X` - Feature branches for each stage

### Commits
```bash
# ✅ Good
git commit -m "feat(ml): Add LLM relationship typing"
git commit -m "fix(backend): Handle timeout errors explicitly"
git commit -m "docs: Update ROUTES.md with new endpoints"

# ❌ Bad
git commit -m "updates"
git commit -m "fix bug"
```

### Pull Requests
- One PR per stage
- Include tests
- Update documentation
- Pass all checks before merge

---

## Environment Setup

### Backend
```bash
cd services/backend
npm install
cp .env.example .env
# Edit .env with ML_SERVICE_URL
npm run dev
```

### ML Service
```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# Edit .env with GEMINI_API_KEY
python start.py
```

### Frontend
```bash
cd services/frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL
npm run dev
```

---

## Performance Targets

### Phase 1 (Backend + ML)
- 100-word text: < 5 seconds
- 1000-word text: < 15 seconds
- 5000-word text: < 30 seconds
- Entity precision: ≥ 80%
- Entity recall: ≥ 70%

### Phase 2 (Frontend)
- Initial render (100 nodes): < 3 seconds
- Re-render after filter: < 500ms
- Node click response: < 100ms
- File upload (10MB PDF): < 30 seconds

---

## Documentation Hierarchy

1. **PROJECT_SPEC.md** - What we're building (source of truth)
2. **ARCHITECTURE.md** - How we're building it
3. **TASKS.md** - What's done and what's next
4. **Development_Framework.md** - How to develop (this file)
5. **ROUTES.md** - API documentation
6. **ALGORITHMS.md** - Algorithm explanations
7. **TESTING_PROTOCOL.md** - Testing procedures
8. **CODE_CONSISTENCY.md** - Coding standards (logging, linting, etc.)

---

## Quality Checklist

Before marking a stage complete:

- [ ] All code has tests
- [ ] All tests pass
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] No console errors/warnings
- [ ] Code reviewed
- [ ] TASKS.md updated

---

## Common Commands

### Development
```bash
# Start all services
npm run dev:all

# Run tests
npm test                    # Backend
pytest                      # ML Service
npm test                    # Frontend

# Build
npm run build              # Backend
npm run build              # Frontend

# Lint & Format
npm run lint               # Backend/Frontend
npm run format             # Backend/Frontend
flake8 app                 # ML Service
black app                  # ML Service
isort app                  # ML Service
mypy app                   # ML Service
```

### Debugging
```bash
# Backend logs
tail -f services/backend/backend-debug.log

# ML Service logs
tail -f services/ml-service/ml-service.log

# Frontend dev tools
# Open browser console (F12)
```

---

## Troubleshooting

### ML Service Timeout
- Increase timeout in backend (default: 30s)
- Reduce text chunk size
- Check Gemini API rate limits

### Frontend Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`
- Verify Vite config

### Test Failures
- Check test data in `data/test/`
- Verify environment variables
- Run tests individually to isolate issues

---

**Remember**: When in doubt, refer to PROJECT_SPEC.md - it's the single source of truth.
