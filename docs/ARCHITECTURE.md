# Really Nicca - System Architecture (Phase 1: Accurate Graph Extraction)

> **Purpose:** Technical blueprint for building Phase 1 - a best-in-class knowledge graph extraction engine  
> **Scope:** Text → Entities → Relationships → Graph (JSON)  
> **Philosophy:** Accuracy > Speed, Simple > Complex, Working > Perfect

---

## System Overview

Really Nicca Phase 1 is a **two-service system** designed to convert unstructured text into accurate, meaningful knowledge graphs using hybrid ML techniques.

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT                            │
│                    (curl, Postman, future UI)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST /api/organize/extract
                             │ { text: "..." }
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE (Node.js)                     │
│                         Port 3000                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Text Processing                                     │    │
│  │     - Validate input                                    │    │
│  │     - Clean & normalize text                            │    │
│  │     - Chunk into processable segments                   │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────v───────────────────────────────────────┐    │
│  │  2. ML Orchestration                                    │    │
│  │     - Call ML service with chunks                       │    │
│  │     - Handle retries & errors                           │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────v───────────────────────────────────────┐    │
│  │  3. Graph Building                                      │    │
│  │     - Map ML output → Graph schema                      │    │
│  │     - Generate UUIDs                                    │    │
│  │     - Calculate node metrics (importance)               │    │
│  │     - Add metadata                                      │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────v───────────────────────────────────────┐    │
│  │  4. Storage                                             │    │
│  │     - Save graph to JSON file (data/graphs/)            │    │
│  │     - Generate graphId                                  │    │
│  └────────────────┬───────────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ Graph JSON response
                    │
                    v
             
┌─────────────────────────────────────────────────────────────────┐
│                    ML SERVICE (Python/FastAPI)                   │
│                         Port 8000                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Pipeline: Text Chunks → Entities + Relationships       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Stage 1: Entity Extraction (Hybrid)                    │    │
│  │                                                          │    │
│  │  ┌──────────────┐        ┌──────────────┐             │    │
│  │  │  spaCy NER   │        │  Gemini LLM  │             │    │
│  │  │  (baseline)  │───┬───►│ (refinement) │             │    │
│  │  └──────────────┘   │    └──────────────┘             │    │
│  │                     │                                   │    │
│  │                     └────► Merged Entities              │    │
│  │                            (name, type, confidence)     │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────v───────────────────────────────────────┐    │
│  │  Stage 2: Embedding Generation                          │    │
│  │                                                          │    │
│  │  Entity Names → Gemini Embeddings API                   │    │
│  │              → 768-dim vectors                          │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────v───────────────────────────────────────┐    │
│  │  Stage 3: Deduplication                                 │    │
│  │                                                          │    │
│  │  Multi-signal matching:                                 │    │
│  │  • String similarity (Levenshtein ≥ 0.85)              │    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### Backend Service (Node.js + TypeScript)

**Responsibility:** API Gateway, orchestration, graph building, storage

**Technology Stack:**
- Runtime: Node.js 18+
- Framework: Express.js
- Language: TypeScript 5+
- HTTP Client: Axios
- Storage: Native `fs` module (JSON files)
- Testing: Jest

**Directory Structure:**
```
services/backend/
├── src/
│   ├── server.ts                    # Entry point & Express app
│   ├── config/
│   │   └── env.ts                   # Environment variables
│   ├── core/
│   │   ├── ml/
│   │   │   └── python-client.service.ts   # ML service HTTP client
│   │   └── storage/
│   │       └── graph-storage.service.ts   # JSON file operations
│   └── features/
│       └── organize/
│           ├── routes.ts            # Route definitions
│           ├── controllers/
│           │   ├── extract.controller.ts   # POST /extract handler
│           │   └── graph.controller.ts     # GET /graphs handlers
│           └── services/
│               ├── text-processor.service.ts   # Chunking & cleaning
│               └── graph-builder.service.ts    # ML → Graph mapping
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

**Key Services:**

#### `text-processor.service.ts`
```typescript
class TextProcessorService {
  // Split text into chunks (max 1000 chars, preserve sentences)
  chunkText(text: string, maxSize: number): string[]
  
  // Normalize whitespace, remove control characters
  cleanText(text: string): string
}
```

#### `python-client.service.ts`
```typescript
class PythonClientService {
  // Call ML service /organize/extract endpoint
  async callExtractEndpoint(
    textChunks: string[], 
    docId: string
  ): Promise<MLExtractionResponse>
  
  // Retry logic with exponential backoff
  // Timeout: 30 seconds
}
```

#### `graph-builder.service.ts`
```typescript
class GraphBuilderService {
  // Convert ML entities → Graph nodes
  // Convert ML relationships → Graph edges
  // Calculate node importance (degree centrality)
  buildGraph(
    mlEntities: MLEntity[],
    mlRelationships: MLRelationship[],
    meta: GraphMetadata
  ): Graph
}
```

#### `graph-storage.service.ts`
```typescript
class GraphStorageService {
  // Save graph to data/graphs/{graphId}.json
  async saveGraph(graph: Graph): Promise<string> // returns graphId
  
  // Load graph from file
  async loadGraph(graphId: string): Promise<Graph>
  
  // List all saved graphs (metadata only)
  async listGraphs(): Promise<GraphSummary[]>
}
```

---

### ML Service (Python + FastAPI)

**Responsibility:** Entity extraction, deduplication, relationship detection

**Technology Stack:**
- Runtime: Python 3.9+
- Framework: FastAPI
- NER: spaCy (en_core_web_sm)
- LLM: Gemini API
- Embeddings: Gemini text-embedding-004
- Validation: Pydantic
- Testing: pytest

**Directory Structure:**
```
services/ml-service/
├── app/
│   ├── main.py                      # FastAPI app & startup
│   ├── shared/
│   │   └── utils/
│   │       ├── spacy_loader.py      # spaCy model singleton
│   │       ├── gemini_client.py     # Gemini API wrapper
│   │       └── similarity.py        # String & cosine similarity
│   └── features/
│       └── organize/
│           ├── routes.py            # POST /organize/extract
│           ├── schemas/
│           │   └── extract.py       # Pydantic request/response models
│           └── services/
│               ├── entity_extractor.py         # spaCy + Gemini hybrid
│               ├── embedding_service.py        # Gemini embeddings
│               ├── deduplication_engine.py     # Multi-signal matching
│               └── relationship_classifier.py  # Co-occurrence detection
├── tests/
│   ├── unit/
│   └── integration/
├── requirements.txt
└── pytest.ini
```

**Key Services:**

#### `entity_extractor.py`
```python
def extract_entities_spacy(
    text_chunks: List[str], 
    doc_id: str
) -> List[ExtractedEntity]:
    """
    spaCy baseline extraction
    - Process chunks with NER
    - Map labels (PERSON, ORG, GPE, etc.)
    - Calculate confidence scores
    - Track source snippets
    """

def extract_entities_with_gemini(
    text_chunks: List[str],
    doc_id: str,
    use_gemini: bool = True
) -> List[ExtractedEntity]:
    """
    Hybrid extraction
    - Step 1: spaCy baseline
    - Step 2: Gemini enhancement
    - Step 3: Merge & boost confidence
    - Fallback: spaCy-only on API failure
    """
```

#### `embedding_service.py`
```python
class EmbeddingService:
    """
    Generate embeddings using Gemini API
    - Model: text-embedding-004
    - Dimensions: 768
    - Batch size: 10 texts per request
    - Retry: 3 attempts with backoff
    - Fallback: Zero vectors on failure
    """
    
    def generate_embeddings(
        self, 
        texts: List[str]
    ) -> List[List[float]]:
        ...
```

#### `deduplication_engine.py`
```python
def should_merge(
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
    embedding1: Optional[List[float]],
    embedding2: Optional[List[float]],
    string_threshold: float = 0.85,
    embedding_threshold: float = 0.90
) -> bool:
    """
    Multi-signal merge decision:
    1. Must be same entity type
    2. String similarity ≥ 0.85 OR
    3. Embedding similarity ≥ 0.90 OR
    4. Abbreviation detected (substring + short)
    """

def deduplicate_entities(
    entities: List[ExtractedEntity],
    embeddings: Optional[List[List[float]]]
) -> List[ExtractedEntity]:
    """
    Deduplicate entity list
    - Group by type
    - Find merge candidates
    - Keep canonical + add aliases
    - Merge sources
    - Average confidence
    """
```

#### `relationship_classifier.py`
```python
def build_cooccurrence_relationships(
    text_chunks: List[str],
    entities: List[ExtractedEntity],
    doc_id: str,
    min_weight: float = 0.3
) -> List[ExtractedRelationship]:
    """
    Co-occurrence based relationships
    - Track entity occurrences per chunk
    - Find entity pairs in same chunks
    - Calculate weight: shared / min(count_A, count_B)
    - Filter by min_weight threshold
    - Extract example snippets
    """

def enhance_relationships_with_llm(
    relationships: List[ExtractedRelationship],
    use_llm: bool = False,
    min_weight_for_typing: float = 0.6
) -> List[ExtractedRelationship]:
    """
    Optional LLM relationship typing
    - Only for high-weight edges
    - Use Gemini to classify type
    - Add relationType field (authored, uses, etc.)
    """
```

---

## Data Models

### Shared Types (TypeScript)

Defined in `packages/types/src/`

```typescript
// Entity (Graph Node)
interface Entity {
  id: string;                    // UUID
  label: string;                 // Canonical name
  type: EntityType;              // PERSON | ORGANIZATION | CONCEPT | DATE | PAPER
  aliases: string[];             // Alternative names
  confidence: number;            // 0.0 - 1.0
  sources: EntitySource[];       // Origin snippets
  metadata?: {
    importance?: number;         // Degree centrality (0-1)
  };
}

// Relationship (Graph Edge)
interface Relationship {
  id: string;                    // UUID
  sourceId: string;              // Entity UUID
  targetId: string;              // Entity UUID
  type: RelationshipType;        // cooccurrence | semantic | explicit
  relationType?: string;         // Optional: "authored", "uses", etc.
  weight: number;                // Strength (0.0 - 1.0)
  confidence: number;            // Certainty (0.0 - 1.0)
  examples?: string[];           // Context snippets
}

// Graph
interface Graph {
  nodes: Entity[];
  edges: Relationship[];
  meta: {
    graphId: string;
    createdAt: Date;
    updatedAt: Date;
    sourceText?: string;         // First 200 chars
  };
}
```

### ML Service Types (Python/Pydantic)

```python
class ExtractedEntity(BaseModel):
    name: str
    type: str  # PERSON, ORGANIZATION, CONCEPT, DATE, PAPER
    confidence: float
    sources: List[EntitySourceSnippet]
    aliases: List[str] = []

class ExtractedRelationship(BaseModel):
    sourceEntity: str
    targetEntity: str
    type: str  # cooccurrence, semantic, explicit
    relationType: Optional[str]
    weight: float
    confidence: float
    examples: List[str] = []

class ExtractRequest(BaseModel):
    textChunks: List[str]
    docId: str = "unknown"

class ExtractResponse(BaseModel):
    entities: List[ExtractedEntity]
    relationships: List[ExtractedRelationship]
```

---

## API Contract

### Backend → Client

**Endpoint:** `POST /api/organize/extract`

**Request:**
```json
{
  "text": "String (max 50000 chars)"
}
```

**Response:**
```json
{
  "graphId": "uuid",
  "graph": {
    "nodes": [...],
    "edges": [...],
    "meta": {...}
  }
}
```

### Backend → ML Service

**Endpoint:** `POST /organize/extract` (ML service)

**Request:**
```json
{
  "textChunks": ["string"],
  "docId": "string"
}
```

**Response:**
```json
{
  "entities": [...],
  "relationships": [...]
}
```

---

## Storage Strategy

### Phase 1: JSON Files

**Location:** `data/graphs/{graphId}.json`

**Format:**
```json
{
  "nodes": [...],
  "edges": [...],
  "meta": {
    "graphId": "...",
    "createdAt": "2025-11-22T12:00:00Z",
    "updatedAt": "2025-11-22T12:00:00Z",
    "sourceText": "First 200 characters..."
  }
}
```

**Rationale:**
- Simple, no database setup required
- Human-readable for debugging
- Easy to version control test data
- Fast for Phase 1 scale (< 100 graphs)

**Future (Phase 2+):** Migrate to Neo4j for graph-native queries

---

## Algorithm Details

### Entity Extraction Confidence

**spaCy entities:**
```
confidence = base_confidence[label] + length_boost
base_confidence = {
  PERSON: 0.85,
  ORG: 0.80,
  GPE: 0.75,
  DATE: 0.90,
  default: 0.65
}
length_boost = min(word_count * 0.05, 0.15)
cap at 0.95
```

**Gemini entities:**
- Cap at 0.92 (not 100% reliable)
- Boost +0.05 if also found by spaCy (max 0.98)

### Deduplication Thresholds

**String similarity:**
- Algorithm: SequenceMatcher (Levenshtein-like)
- Threshold: 0.85
- Normalization: lowercase + remove punctuation

**Semantic similarity:**
- Algorithm: Cosine similarity on embeddings
- Threshold: 0.90
- Embeddings: Gemini text-embedding-004 (768-dim)

**Abbreviation rule:**
- If `normalize(short) in normalize(long)` AND `len(short) <= 5`
- Example: "AI" in "Artificial Intelligence"

### Co-occurrence Weight

```
weight = shared_chunks / min(chunks_A, chunks_B)

Example:
Entity A appears in chunks [0, 1, 2]
Entity B appears in chunks [1, 2, 3, 4]
Shared chunks: [1, 2] → count = 2
min(3, 4) = 3
weight = 2/3 = 0.667
```

---

## Error Handling

### Backend Service

**Input Validation:**
- Empty text → 400 Bad Request
- Text > 50000 chars → 400 Bad Request
- Invalid JSON → 400 Bad Request

**ML Service Errors:**
- Connection failure → Retry 3× with backoff
- Timeout (30s) → 503 Service Unavailable
- Invalid response → 500 Internal Server Error

**Storage Errors:**
- Disk full → 500 Internal Server Error
- Permission denied → 500 Internal Server Error

### ML Service

**Model Loading:**
- spaCy model missing → Return HTTP 500
- Gemini API key missing → Fall back to spaCy-only

**API Failures:**
- Gemini timeout → Fall back to cached/zero vectors
- Rate limit (429) → Exponential backoff
- Max retries exceeded → Return degraded results

---

## Testing Strategy

### Unit Tests

**Backend:**
- Text chunking logic
- Graph builder mapping
- Storage read/write

**ML Service:**
- String similarity
- Cosine similarity
- Entity merging logic
- Co-occurrence calculation

### Integration Tests

**E2E Pipeline:**
- Text → Backend → ML → Graph
- Verify entity extraction
- Verify deduplication
- Verify relationships

### Manual Testing

**Sample Texts:**
1. Simple (1 entity, 1 relationship)
2. Medium (5 entities, 3 relationships)
3. Complex (20+ entities, technical domain)
4. Edge cases (Unicode, abbreviations, duplicates)

**Evaluation:**
- Visual inspection of graphs
- Compare against expected output
- Document accuracy metrics

---

## Performance Targets

**Latency:**
- 100-word text: < 5 seconds
- 1000-word text: < 15 seconds
- 5000-word text: < 30 seconds

**Throughput:**
- 10 concurrent requests supported
- No memory leaks on repeated requests

**Accuracy:**
- Entity precision: ≥ 80%
- Entity recall: ≥ 70%
- Relationship accuracy: ≥ 75%

---

## Security Considerations

**Phase 1 (Minimal):**
- Input length validation (prevent DoS)
- No authentication (local testing only)
- Environment variables for API keys
- CORS enabled for development

**Phase 2+ (Production):**
- API authentication (JWT)
- Rate limiting per user
- Input sanitization
- HTTPS only

---

## Deployment

**Phase 1 (Local Development):**
```bash
# Terminal 1: ML Service
cd services/ml-service
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Backend Service
cd services/backend
npm run dev
```

**Health Checks:**
- ML Service: `GET /health` → 200 OK
- Backend: `GET /api/health` → 200 OK

**Environment Variables:**
```
# Backend
ML_SERVICE_URL=http://localhost:8000
PORT=3000

# ML Service
GEMINI_API_KEY=your_key_here
```

---

## Future Architecture (Phase 2+)

**Not implemented now, but designed for:**

1. **Graph Database:** Neo4j for graph queries
2. **Vector Database:** Pinecone/Weaviate for semantic search
3. **File Processing:** PDF/DOCX parsers
4. **Visualization:** React + Cytoscape.js frontend
5. **Editing:** Graph mutation APIs
6. **Export:** CSV, PNG, GraphML formats
7. **Multi-doc:** Graph merging logic
8. **Authentication:** User accounts & permissions
9. **Gap Detection:** Disconnected component analysis
10. **Memory Export:** LLM context formatting

---

## Design Principles

1. **Accuracy over Speed** - A slow correct answer beats a fast wrong one
2. **Conservative Deduplication** - False positives are worse than false negatives
  DATE: 0.90,
  default: 0.65
}
length_boost = min(word_count * 0.05, 0.15)
cap at 0.95
```

**Gemini entities:**
- Cap at 0.92 (not 100% reliable)
- Boost +0.05 if also found by spaCy (max 0.98)

### Deduplication Thresholds

**String similarity:**
- Algorithm: SequenceMatcher (Levenshtein-like)
- Threshold: 0.85
- Normalization: lowercase + remove punctuation

**Semantic similarity:**
- Algorithm: Cosine similarity on embeddings
- Threshold: 0.90
- Embeddings: Gemini text-embedding-004 (768-dim)

**Abbreviation rule:**
- If `normalize(short) in normalize(long)` AND `len(short) <= 5`
- Example: "AI" in "Artificial Intelligence"

### Co-occurrence Weight

```
weight = shared_chunks / min(chunks_A, chunks_B)

Example:
Entity A appears in chunks [0, 1, 2]
Entity B appears in chunks [1, 2, 3, 4]
Shared chunks: [1, 2] → count = 2
min(3, 4) = 3
weight = 2/3 = 0.667
```

---

## Error Handling

### Backend Service

**Input Validation:**
- Empty text → 400 Bad Request
- Text > 50000 chars → 400 Bad Request
- Invalid JSON → 400 Bad Request

**ML Service Errors:**
- Connection failure → Retry 3× with backoff
- Timeout (30s) → 503 Service Unavailable
- Invalid response → 500 Internal Server Error

**Storage Errors:**
- Disk full → 500 Internal Server Error
- Permission denied → 500 Internal Server Error

### ML Service

**Model Loading:**
- spaCy model missing → Return HTTP 500
- Gemini API key missing → Fall back to spaCy-only

**API Failures:**
- Gemini timeout → Fall back to cached/zero vectors
- Rate limit (429) → Exponential backoff
- Max retries exceeded → Return degraded results

---

## Testing Strategy

### Unit Tests

**Backend:**
- Text chunking logic
- Graph builder mapping
- Storage read/write

**ML Service:**
- String similarity
- Cosine similarity
- Entity merging logic
- Co-occurrence calculation

### Integration Tests

**E2E Pipeline:**
- Text → Backend → ML → Graph
- Verify entity extraction
- Verify deduplication
- Verify relationships

### Manual Testing

**Sample Texts:**
1. Simple (1 entity, 1 relationship)
2. Medium (5 entities, 3 relationships)
3. Complex (20+ entities, technical domain)
4. Edge cases (Unicode, abbreviations, duplicates)

**Evaluation:**
- Visual inspection of graphs
- Compare against expected output
- Document accuracy metrics

---

## Performance Targets

**Latency:**
- 100-word text: < 5 seconds
- 1000-word text: < 15 seconds
- 5000-word text: < 30 seconds

**Throughput:**
- 10 concurrent requests supported
- No memory leaks on repeated requests

**Accuracy:**
- Entity precision: ≥ 80%
- Entity recall: ≥ 70%
- Relationship accuracy: ≥ 75%

---

## Security Considerations

**Phase 1 (Minimal):**
- Input length validation (prevent DoS)
- No authentication (local testing only)
- Environment variables for API keys
- CORS enabled for development

**Phase 2+ (Production):**
- API authentication (JWT)
- Rate limiting per user
- Input sanitization
- HTTPS only

---

## Deployment

**Phase 1 (Local Development):**
```bash
# Terminal 1: ML Service
cd services/ml-service
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Backend Service
cd services/backend
npm run dev
```

**Health Checks:**
- ML Service: `GET /health` → 200 OK
- Backend: `GET /api/health` → 200 OK

**Environment Variables:**
```
# Backend
ML_SERVICE_URL=http://localhost:8000
PORT=3000

# ML Service
GEMINI_API_KEY=your_key_here
```

---

## Future Architecture (Phase 2+)

**Not implemented now, but designed for:**

1. **Graph Database:** Neo4j for graph queries
2. **Vector Database:** Pinecone/Weaviate for semantic search
3. **File Processing:** PDF/DOCX parsers
4. **Visualization:** React + Cytoscape.js frontend
5. **Editing:** Graph mutation APIs
6. **Export:** CSV, PNG, GraphML formats
7. **Multi-doc:** Graph merging logic
8. **Authentication:** User accounts & permissions
9. **Gap Detection:** Disconnected component analysis
10. **Memory Export:** LLM context formatting

---

## Design Principles

1. **Accuracy over Speed** - A slow correct answer beats a fast wrong one
2. **Conservative Deduplication** - False positives are worse than false negatives
3. **Testability** - Every component has clear inputs/outputs
4. **Observability** - Log critical decisions for debugging
5. **Graceful Degradation** - Fall back to simpler methods on failure
6. **Type Safety** - Shared types prevent schema mismatches

---

## 📏 Coding Standards & Guidelines

### 1. Import Strategy

**TypeScript (Backend):**
- **Format:** ESM (`import` / `export`)
- **Style:** Explicit named exports preferred.
- **Ordering:**
  1. External dependencies (`express`, `uuid`)
  2. Workspace packages (`@really-nicca/types`)
  3. Internal absolute/relative paths
- **Path Aliases:** Use relative paths for now to avoid build complexity in Phase 1.

```typescript
// ✅ Good
import { Request, Response } from 'express';
import { Entity } from '@really-nicca/types';
import { GraphBuilder } from '../services/graph-builder';

// ❌ Bad
import express = require('express'); // No CommonJS
import { Entity } from '../../../../packages/types'; // Use workspace name
```

**Python (ML Service):**
- **Style:** Absolute imports from `app` root preferred for clarity.
- **Ordering:** Standard library → Third party → Local app imports.

```python
# ✅ Good
import os
from typing import List
from fastapi import APIRouter
from app.features.organize.schemas.extract import ExtractRequest

# ❌ Bad
from ...schemas.extract import ExtractRequest # Avoid deep relative imports
```

### 2. Error Handling Philosophy

**Backend (Node.js):**
- **Async/Await:** Always use `try/catch` in controllers.
- **Custom Errors:** Throw typed errors, catch in middleware.
- **Response:** Uniform error response format.

```typescript
// Controller
try {
  await service.doWork();
} catch (error) {
  next(new AppError(400, 'Invalid Input'));
}
```

**ML Service (Python):**
- **FastAPI:** Use `HTTPException` for expected API errors.
- **Internal:** Raise custom exceptions, let global handler catch them.
- **Fail Fast:** Validate inputs immediately with Pydantic.

```python
if not text:
    raise HTTPException(status_code=400, detail="Text cannot be empty")
```

### 3. Type Safety

**TypeScript:**
- **Strict Mode:** Enabled (`"strict": true`).
- **No Any:** Avoid `any` at all costs. Use `unknown` if necessary and narrow type.
**Backend:**
- Text chunking logic
- Graph builder mapping
- Storage read/write

**ML Service:**
- String similarity
- Cosine similarity
- Entity merging logic
- Co-occurrence calculation

### Integration Tests

**E2E Pipeline:**
- Text → Backend → ML → Graph
- Verify entity extraction
- Verify deduplication
- Verify relationships

### Manual Testing

**Sample Texts:**
1. Simple (1 entity, 1 relationship)
2. Medium (5 entities, 3 relationships)
3. Complex (20+ entities, technical domain)
4. Edge cases (Unicode, abbreviations, duplicates)

**Evaluation:**
- Visual inspection of graphs
- Compare against expected output
- Document accuracy metrics

---

## Performance Targets

**Latency:**
- 100-word text: < 5 seconds
- 1000-word text: < 15 seconds
- 5000-word text: < 30 seconds

**Throughput:**
- 10 concurrent requests supported
- No memory leaks on repeated requests

**Accuracy:**
- Entity precision: ≥ 80%
- Entity recall: ≥ 70%
- Relationship accuracy: ≥ 75%

---

## Security Considerations

**Phase 1 (Minimal):**
- Input length validation (prevent DoS)
- No authentication (local testing only)
- Environment variables for API keys
- CORS enabled for development

**Phase 2+ (Production):**
- API authentication (JWT)
- Rate limiting per user
- Input sanitization
- HTTPS only

---

## Deployment

**Phase 1 (Local Development):**
```bash
# Terminal 1: ML Service
cd services/ml-service
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Backend Service
cd services/backend
npm run dev
```

**Health Checks:**
- ML Service: `GET /health` → 200 OK
- Backend: `GET /api/health` → 200 OK

**Environment Variables:**
```
# Backend
ML_SERVICE_URL=http://localhost:8000
PORT=3000

# ML Service
GEMINI_API_KEY=your_key_here
```

---

## Future Architecture (Phase 2+)

**Not implemented now, but designed for:**

1. **Graph Database:** Neo4j for graph queries
2. **Vector Database:** Pinecone/Weaviate for semantic search
3. **File Processing:** PDF/DOCX parsers
4. **Visualization:** React + Cytoscape.js frontend
5. **Editing:** Graph mutation APIs
6. **Export:** CSV, PNG, GraphML formats
7. **Multi-doc:** Graph merging logic
8. **Authentication:** User accounts & permissions
9. **Gap Detection:** Disconnected component analysis
10. **Memory Export:** LLM context formatting

---

## Design Principles

1. **Accuracy over Speed** - A slow correct answer beats a fast wrong one
2. **Conservative Deduplication** - False positives are worse than false negatives
3. **Testability** - Every component has clear inputs/outputs
4. **Observability** - Log critical decisions for debugging
5. **Graceful Degradation** - Fall back to simpler methods on failure
6. **Type Safety** - Shared types prevent schema mismatches

---

## 📏 Coding Standards & Guidelines

### 1. Import Strategy

**TypeScript (Backend):**
- **Format:** ESM (`import` / `export`)
- **Style:** Explicit named exports preferred.
- **Ordering:**
  1. External dependencies (`express`, `uuid`)
  2. Workspace packages (`@really-nicca/types`)
  3. Internal absolute/relative paths
- **Path Aliases:** Use relative paths for now to avoid build complexity in Phase 1.

```typescript
// ✅ Good
import { Request, Response } from 'express';
import { Entity } from '@really-nicca/types';
import { GraphBuilder } from '../services/graph-builder';

// ❌ Bad
import express = require('express'); // No CommonJS
import { Entity } from '../../../../packages/types'; // Use workspace name
```

**Python (ML Service):**
- **Style:** Absolute imports from `app` root preferred for clarity.
- **Ordering:** Standard library → Third party → Local app imports.

```python
# ✅ Good
import os
from typing import List
from fastapi import APIRouter
from app.features.organize.schemas.extract import ExtractRequest

# ❌ Bad
from ...schemas.extract import ExtractRequest # Avoid deep relative imports
```

### 2. Error Handling Philosophy

**Backend (Node.js):**
- **Async/Await:** Always use `try/catch` in controllers.
- **Custom Errors:** Throw typed errors, catch in middleware.
- **Response:** Uniform error response format.

```typescript
// Controller
try {
  await service.doWork();
} catch (error) {
  next(new AppError(400, 'Invalid Input'));
}
```

**ML Service (Python):**
- **FastAPI:** Use `HTTPException` for expected API errors.
- **Internal:** Raise custom exceptions, let global handler catch them.
- **Fail Fast:** Validate inputs immediately with Pydantic.

```python
if not text:
    raise HTTPException(status_code=400, detail="Text cannot be empty")
```

### 3. Type Safety

**TypeScript:**
- **Strict Mode:** Enabled (`"strict": true`).
- **No Any:** Avoid `any` at all costs. Use `unknown` if necessary and narrow type.
- **Shared Types:** Always import from `@really-nicca/types` for data models.

**Python:**
- **Type Hints:** Required for all function arguments and return values.
- **Pydantic:** Use for all data transfer objects (DTOs).
- **Mypy:** Code must pass static analysis.

```python
# ✅ Good
def process_text(text: str) -> List[str]: ...

# ❌ Bad
def process_text(text): ...
```

---

## Phase 2: Frontend Service (React + Vite + Cytoscape)

**Responsibility:** User interface, graph visualization, file upload, manual editing

**Technology Stack:**
- Runtime: Node.js 18+ (dev server)
- Framework: React 18
- Build Tool: Vite 5
- Language: TypeScript 5+
- Graph Visualization: Cytoscape.js + react-cytoscapejs
- HTTP Client: Axios
- Testing: Vitest

**Directory Structure:**
```
services/frontend/
├── src/
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   ├── features/
│   │   ├── organize/
│   │   │   ├── components/        # Graph visualization, editing UI
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── pages/             # Main pages (GraphView, etc.)
│   │   │   └── services/          # API client for backend
│   │   ├── gaps/                  # Future: Gap detection UI
│   │   └── memory/                # Future: Memory export UI
│   ├── shared/
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Shared hooks
│   │   └── services/              # Shared services (auth, etc.)
│   └── styles/                    # Global styles
├── public/                        # Static assets
├── tests/
│   └── unit/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Key Components:**

#### `GraphVisualization` Component
```typescript
interface GraphVisualizationProps {
  graph: Graph;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  filters: GraphFilters;
}

// Uses Cytoscape.js for rendering
// Supports zoom, pan, drag, search
// Configurable layouts (force-directed, hierarchical, circular)
```

#### `FileUpload` Component
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[]; // ['.pdf', '.docx', '.txt']
  maxSizeBytes: number;
}

// Drag-and-drop zone
// File validation
// Progress indicator
```

#### API Client Service
```typescript
class OrganizeApiClient {
  async extractGraph(text: string): Promise<GraphResponse>
  async uploadFile(file: File): Promise<GraphResponse>
  async getGraph(id: string): Promise<Graph>
  async listGraphs(): Promise<GraphMetadata[]>
  async updateGraph(id: string, updates: GraphUpdates): Promise<Graph>
  async exportGraph(id: string, format: 'json' | 'csv' | 'png'): Promise<Blob>
}
```

**Data Flow (Phase 2):**
```
User uploads file
    ↓
FileUpload component
    ↓
POST /api/organize/upload (Backend)
    ↓
File parsing (PDF/DOCX → text)
    ↓
Existing extraction pipeline (Phase 1)
    ↓
Graph JSON returned
    ↓
GraphVisualization component (Cytoscape.js)
    ↓
User edits graph
    ↓
PATCH /api/organize/graphs/:id
    ↓
Updated graph saved
    ↓
Re-render visualization
```

**Cytoscape.js Configuration:**
```typescript
const cytoscapeConfig = {
  style: [
    {
      selector: 'node',
      style: {
        'background-color': (node) => getColorByType(node.data('type')),
        'width': (node) => node.data('importance') * 50,
        'height': (node) => node.data('importance') * 50,
        'label': 'data(label)'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': (edge) => edge.data('weight') * 5,
        'line-color': '#999',
        'target-arrow-shape': 'triangle'
      }
    }
  ],
  layout: {
    name: 'cose', // force-directed
    animate: true,
    nodeDimensionsIncludeLabels: true
  }
};
```

**Performance Targets:**
- Initial render (100 nodes): < 3 seconds
- Re-render after filter: < 500ms
- Node click response: < 100ms
- File upload (10MB PDF): < 30 seconds (including extraction)

---

**Last Updated:** 2025-11-24  
**Phase:** 1 Complete ✅ | Phase 2 In Progress 🚧  
**Status:** Phase 1 Architecture Implemented | Phase 2 Architecture Approved