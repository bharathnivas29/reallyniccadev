# Really Nicca – Phase 1 & 2: Knowledge Graph Extraction Engine

> **Mission:** Build the most accurate knowledge graph extraction engine with an intuitive web interface  
> **Phase 1:** Text → Entities → Relationships → Graph JSON ✅ **COMPLETE**  
> **Phase 2:** Web UI + File Upload + Visualization + Editing + Export 🚧 **IN PROGRESS**

---

## 🎯 Success Criteria

### Phase 1 ✅ COMPLETE
- [x] Text → entities extracted with high accuracy (≥80%)
- [x] Entities deduplicated intelligently (AI ≈ Artificial Intelligence)
- [x] Relationships are meaningful, not noisy
- [x] Graph structure is human-understandable
- [x] All tests pass (71/71 ML + 7/7 integration)
- [x] Code quality: 100% (docstrings, types, error handling, logging)
- [x] Documentation complete (API, algorithms, testing protocol)

### Phase 2 🎯 TARGETS
- [ ] Users can visualize graphs in browser
- [ ] Upload PDF/DOCX → see graph
- [ ] Edit graphs manually (merge nodes, edit relationships)
- [ ] Export in multiple formats (JSON, CSV, PNG)
- [ ] Merge graphs from multiple documents
- [ ] Domain-specific entities (Tech + Research)

---

## 📋 Technology Stack

### Backend (Phase 1 ✅)
- Node.js 18+ + TypeScript
- Express.js
- Axios (ML client)
- JSON file storage

### ML Service (Phase 1 ✅)
- Python 3.9+ + FastAPI
- spaCy (en_core_web_sm)
- Gemini API (entity extraction + embeddings)
- text-embedding-004 (768-dim vectors)

### Frontend (Phase 2 🚧)
- **React 18** + TypeScript
- **Vite** (build tool)
- **Cytoscape.js** (graph visualization)
- Axios (HTTP client)
- **NO D3.js** (using Cytoscape instead)
- **NO Next.js** (using Vite + React)

---

## ✅ PHASE 1: ACCURATE GRAPH EXTRACTION (COMPLETE)

---

## Stage 0: Foundation Setup ✅

### 0.1 Workspace & Monorepo
- [x] Clean/backup existing code
- [x] Initialize fresh workspace structure
- [x] Root `package.json` with workspaces
- [x] Install npm
- [x] Create `.gitignore`, `.editorconfig`

**Test:** `npm install` succeeds

---

### 0.2 Shared Types Package
- [x] Create `packages/types/package.json`
- [x] Create `packages/types/tsconfig.json`
- [x] Define `Entity` type (id, label, type, aliases, confidence, sources, embedding)
- [x] Define `Relationship` type (id, sourceId, targetId, type, weight, confidence, examples)
- [x] Define `Graph` type (nodes, edges, metadata)
- [x] Export all types from `index.ts`

**Test:** Types can be imported in both backend and ML service

---

## Stage 1: ML Service - Baseline NER ✅

### 1.1 Project Setup
- [x] Initialize `services/ml-service` (Python + FastAPI)
- [x] Create `requirements.txt` (fastapi, uvicorn, spacy, pydantic)
- [x] Install spaCy model (`python -m spacy download en_core_web_sm`)
- [x] Create `app/main.py` with FastAPI app
- [x] Add health check endpoint

**Test:** `python start.py` starts server, health check returns 200

---

### 1.2 Entity Extraction (spaCy Baseline)
- [x] Create `app/features/organize/services/entity_extractor.py`
- [x] Implement `extract_entities_spacy(text_chunks, doc_id)`
- [x] Map spaCy labels → our schema (PERSON, ORG, GPE, etc.)
- [x] Calculate confidence scores
- [x] Extract source snippets (context around entity)
- [x] Return list of `ExtractedEntity` objects

**Test:** Unit test with sample text → verify entities extracted

---

### 1.3 Extract Endpoint
- [x] Create `app/features/organize/routes.py`
- [x] Create `app/features/organize/schemas/extract.py` (Pydantic models)
- [x] Implement `POST /organize/extract`
- [x] Request: `{ textChunks: string[], docId: string }`
- [x] Response: `{ entities: ExtractedEntity[] }`

**Test:** `curl -X POST http://localhost:8000/organize/extract` returns entities

---

## Stage 2: ML Service - Gemini Enhancement ✅

### 2.1 Gemini Client
- [x] Create `app/shared/utils/gemini_client.py`
- [x] Initialize Gemini API client
- [x] Implement `extract_entities(text, schema)` with structured prompts
- [x] Add retry logic (3 attempts, exponential backoff)
- [x] Handle API errors gracefully

**Test:** Unit test with mock Gemini response

---

### 2.2 Hybrid Entity Extraction
- [x] Update `entity_extractor.py`
- [x] Implement `extract_entities_with_gemini(text_chunks, doc_id, use_gemini=True)`
- [x] Get spaCy baseline entities
- [x] Enhance with Gemini (send each chunk)
- [x] Merge results (boost confidence if both found same entity)
- [x] Return combined entity list

**Test:** Integration test comparing spaCy-only vs hybrid approach

---

## Stage 3: ML Service - Deduplication ✅

### 3.1 Embedding Generation
- [x] Create `app/features/organize/services/embedding_service.py`
- [x] Implement `generate_embeddings(texts)` using Gemini
- [x] Batch requests (10 texts per call)
- [x] Return 768-dim vectors
- [x] Handle failures gracefully (return None, not zeros)

**Test:** Unit test → verify embedding dimensions and values

---

### 3.2 Deduplication Engine
- [x] Create `app/features/organize/services/deduplication_engine.py`
- [x] Implement `deduplicate_entities(entities, embeddings)`
- [x] String similarity check (SequenceMatcher ≥ 0.85)
- [x] Semantic similarity check (cosine ≥ 0.90)
- [x] Abbreviation detection (short name in long name)
- [x] Merge entities (keep canonical, add aliases, combine sources)

**Test:** Unit test with known duplicates → verify merging

---

### 3.3 Integration into Pipeline
- [x] Update `/organize/extract` endpoint
- [x] Generate embeddings for extracted entities
- [x] Run deduplication
- [x] Return deduplicated entities

**Test:** End-to-end test with text containing "AI" and "Artificial Intelligence"

---

## Stage 4: ML Service - Relationship Classification ✅

### 4.1 Co-occurrence Detector
- [x] Create `app/features/organize/services/relationship_classifier.py`
- [x] Implement `build_cooccurrence_relationships(text_chunks, entities, min_weight=0.3)`
- [x] Track entity occurrences per chunk
- [x] Calculate co-occurrence weights
- [x] Filter by minimum weight threshold
- [x] Extract example snippets

**Test:** Unit test → verify relationship weights

---

### 4.2 LLM Relationship Typing
- [x] Add `classify_relationships_with_llm(relationships, gemini_client)`
- [x] Filter high-weight relationships (≥ 0.5)
- [x] Send to Gemini for type classification
- [x] Update relationship types (works_at, founded, authored, etc.)
- [x] Boost confidence for LLM-classified relationships

**Test:** Integration test → verify relationship types

---

### 4.3 Integration into Pipeline
- [x] Update `/organize/extract` endpoint
- [x] Build co-occurrence relationships
- [x] Optionally classify with LLM
- [x] Return both entities and relationships

**Test:** End-to-end test → verify entities + relationships returned

---

## Stage 5: Backend Service - API Gateway ✅

### 5.1 Project Setup
- [x] Initialize `services/backend` (Node.js + TypeScript)
- [x] Install dependencies (express, cors, dotenv, axios)
- [x] Setup `tsconfig.json` and `nodemon.json`
- [x] Create `src/server.ts` with Express app
- [x] Add health check endpoint

**Test:** `npm run dev` starts server, health check returns 200

---

### 5.2 ML Client Service
- [x] Create `src/core/ml/python-client.service.ts`
- [x] Implement `callExtractEndpoint(textChunks, docId)`
- [x] HTTP client to ML service (Axios)
- [x] Retry logic (3 attempts, exponential backoff)
- [x] Timeout handling (30s)
- [x] Error handling with detailed logging

**Test:** Unit test with mocked ML service response

---

### 5.3 Text Processing Service
- [x] Create `src/features/organize/services/text-processor.service.ts`
- [x] Implement `chunkText(text, maxChunkSize=4000)`
- [x] Split by paragraphs/sentences
- [x] Preserve sentence boundaries
- [x] Implement `cleanText(text)` - normalize whitespace
- [x] Implement `validateText(text)` - min/max length checks

**Test:** Unit test → verify chunk sizes and boundaries

---

### 5.4 Graph Builder Service
- [x] Create `src/features/organize/services/graph-builder.service.ts`
- [x] Implement `buildGraph(mlEntities, mlRelationships, meta)`
- [x] Map ML entities → Graph nodes (add UUIDs)
- [x] Map ML relationships → Graph edges (add UUIDs)
- [x] Calculate node importance (degree centrality)
- [x] Add metadata (createdAt, sourceText, stats)

**Test:** Unit test → verify Graph structure

---

### 5.5 Graph Storage Service
- [x] Create `src/core/storage/graph-storage.service.ts`
- [x] Implement `saveGraph(graph)` → write to `data/graphs/{id}.json`
- [x] Implement `loadGraph(graphId)` → read and parse JSON
- [x] Implement `listGraphs()` → return metadata list
- [x] Create directory if doesn't exist

**Test:** Save → load → verify identity

---

### 5.6 Text-to-Graph Endpoint
- [x] Create `src/features/organize/routes.ts`
- [x] Create `src/features/organize/controllers/extract.controller.ts`
- [x] Implement `POST /api/organize/extract`
- [x] Validate input (text length, format)
- [x] Chunk text
- [x] Call ML service
- [x] Build graph
- [x] Save graph
- [x] Return graph JSON

**Test:** `curl -X POST` with sample text → returns graph

---

### 5.7 Get Graph Endpoint
- [x] Create `src/features/organize/controllers/graph.controller.ts`
- [x] Implement `GET /api/organize/graphs/:graphId`
- [x] Load from storage
- [x] Return graph JSON
- [x] Handle 404 if not found

**Test:** `curl http://localhost:3000/api/organize/graphs/{id}` returns graph

---

### 5.8 List Graphs Endpoint
- [x] Implement `GET /api/organize/graphs`
- [x] Return list of all graphs (id, createdAt, nodeCount, edgeCount)

**Test:** `curl http://localhost:3000/api/organize/graphs` returns array

---

## Stage 6: End-to-End Integration & Testing ✅

### 6.1 Integration Test Suite
- [x] Create `tests/integration/e2e-graph-extraction.test.ts`
- [x] Test: Simple text → graph
- [x] Test: Technical text with entities
- [x] Test: Text with relationships
- [x] Test: Deduplication works
- [x] Test: Error handling (invalid input, short text, empty text)

**Test:** All 7 integration tests pass

---

### 6.2 Accuracy Evaluation
- [x] Create `docs/golden-samples.json`
- [x] Create `scripts/accuracy-eval.ts`
- [x] Run evaluation and generate report
- [x] Document accuracy metrics

**Test:** Accuracy ≥ 80% on test samples

---

### 6.3 Manual Testing Protocol
- [x] Create `docs/TESTING_PROTOCOL.md`
- [x] Test Case 1: Single entity text
- [x] Test Case 2: Multiple entities, same type
- [x] Test Case 3: Aliases (AI, A.I., Artificial Intelligence)
- [x] Test with 5000-word text
- [x] Measure extraction time
- [x] Measure memory usage
- [x] Document performance benchmarks

**Test:** All requests complete in < 30 seconds

---

## Stage 7: Documentation & Code Quality ✅

### 7.1 API Documentation
- [x] Create `docs/ROUTES.md` with all endpoints
- [x] Add request/response examples
- [x] Document error codes
- [x] Add curl examples
- [x] Add integration examples (JavaScript, Python)

---

### 7.2 Algorithm Documentation
- [x] Create `docs/ALGORITHMS.md`
- [x] Document entity extraction (spaCy + Gemini)
- [x] Document deduplication logic
- [x] Document relationship classification
- [x] Include diagrams/flowcharts
- [x] Add complexity analysis

---

### 7.3 Code Review Checklist
- [x] All functions have docstrings (100%)
- [x] TypeScript has no `any` types (100%)
- [x] Error handling covers edge cases (100%)
- [x] Logging added for critical paths (100%)
- [x] No hardcoded credentials
- [x] Environment variables documented
- [x] Tests have good coverage

---

## 🎉 Phase 1 Complete!

**Status**: All Phase 1 objectives met ✅  
**Code Quality**: 100%  
**Test Coverage**: 100% passing (71/71 ML + 7/7 integration)  
**Documentation**: Complete  
**Performance**: 2.8-3.9s for small texts, < 30s for large texts  
**Accuracy**: Entity F1 ~80%, Relationship detection working

---

## 🚀 PHASE 2: USER INTERFACE & PRODUCTIZATION (IN PROGRESS)

**Goal**: Build web UI with graph visualization, file upload, manual editing, and export  
**Technology**: React 18 + Vite + Cytoscape.js + TypeScript  
**Target Users**: Students, Researchers, Tech Builders  
**Timeline**: 5-8 weeks

---

## Stage 8: Frontend Foundation (React + Vite) 🚧

### 8.1 Project Setup
- [x] Verify existing `services/frontend` structure
- [x] Update dependencies if needed (React 18, Vite 5, Cytoscape)
- [x] Configure environment variables (.env.example)
- [x] Setup proxy to backend (Vite config)
- [x] Verify TypeScript configuration

**Existing Structure:**
```
services/frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── features/
│   │   └── organize/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── services/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── styles/
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Test:** `npm run dev` starts frontend on port 5173

---

### 8.2 Core UI Components
- [x] Review existing shared components
- [x] Create/update `Layout` component (header, main content)
- [x] Create/update `TextInput` component (textarea with character count)
- [x] Create/update `FileUpload` component (drag-and-drop)
- [x] Create/update `LoadingSpinner` component
- [x] Create/update `ErrorMessage` component
- [x] Create/update `Toast` notifications

**Test:** Components render without errors

---

### 8.3 API Integration
- [x] Review existing `src/shared/services/api-client.ts`
- [x] Implement `extractGraph(text)` function
- [x] Implement `getGraph(id)` function
- [x] Implement `listGraphs()` function
- [x] Add error handling & retry logic
- [x] Add request/response logging

**Test:** API calls work from frontend to backend

---

## Stage 9: Graph Visualization (Cytoscape.js) 🚧

### 9.1 Cytoscape Setup
- [x] Verify Cytoscape.js and react-cytoscapejs installed
- [x] Create/update `GraphVisualization` component
- [x] Implement basic graph rendering
- [x] Configure node styles (size by importance, color by type)
- [x] Configure edge styles (thickness by weight)
- [x] Add node labels (toggleable)

**Test:** Can render a simple graph with 10 nodes

---

### 9.2 Interactive Features
- [x] Implement zoom & pan controls
- [x] Implement node dragging
- [x] Node click → show details panel
- [x] Edge click → show relationship info
- [x] Hover effects (highlight connected nodes)
- [x] Search bar to find/highlight nodes
- [x] Layout algorithms (force-directed, hierarchical, circular)

**Test:** All interactions work smoothly

---

### 9.3 Visualization Controls
- [x] Entity type filter (check boxes: PERSON, ORG, CONCEPT, etc.)
- [x] Relationship weight slider (filter weak edges)
- [x] Layout algorithm selector dropdown (Completed in 9.2)
- [x] Toggle node labels on/off
- [x] Zoom to fit button (Completed in 9.2)
- [x] Export as PNG/SVG button

**Test:** Can visualize graphs with 100+ nodes smoothly (< 3s render)

---

## Stage 10: File Upload & Processing 🚧

### 10.1 File Upload UI
- [x] Create drag-and-drop zone component
- [x] Support PDF, DOCX, TXT formats
- [x] File size validation (max 10MB)
- [x] Upload progress indicator
- [x] File preview (show first 500 chars)
- [x] Error handling for invalid files

**Test:** Can select and preview files

---

### 10.2 Backend File Processing
- [x] Install `pdf-parse` for PDF extraction
- [x] Install `mammoth` for DOCX extraction
- [x] Create `POST /api/organize/upload` endpoint
- [x] Implement file parsing service
- [x] Extract text → call existing extraction pipeline
- [x] Return graph + original filename
- [x] Add file metadata to graph
- [x] Relation edge only shows "related_to", fix it.

**Test:** Upload PDF → extract text → verify correctness

---

### 10.3 File Management
- [ ] Store uploaded files temporarily (24hr cleanup)
- [ ] Associate files with graphs (add filename to metadata)
- [ ] Display file metadata (name, size, upload date)
- [ ] Implement cleanup job (delete old files)

**Test:** Upload PDF/DOCX → see graph visualization

---

## Stage 11: Manual Graph Editing 🚧

### 11.1 Node Editing UI
- [ ] Click node → open edit modal
- [ ] Edit node label (text input)
- [ ] Change node type (dropdown: PERSON, ORG, CONCEPT, etc.)
- [ ] View/edit aliases (list with add/remove)
- [ ] Delete node (with confirmation dialog)
- [ ] Merge two nodes:
  - [ ] Select node 1
  - [ ] Click "Merge with..." button
  - [ ] Select node 2
  - [ ] Confirm merge

**Test:** Can edit node properties and see changes

---

### 11.2 Relationship Editing UI
- [ ] Click edge → open edit modal
- [ ] Edit relationship type (text input)
- [ ] Adjust weight (slider 0-1)
- [ ] Delete relationship (with confirmation)
- [ ] Add new relationship:
  - [ ] Click "Add Edge" button
  - [ ] Select source node
  - [ ] Select target node
  - [ ] Set type & weight
  - [ ] Confirm

**Test:** Can add/edit/delete relationships

---

### 11.3 Backend Support
- [ ] Create `PATCH /api/organize/graphs/:id` endpoint
- [ ] Implement `updateNode(graphId, nodeId, updates)`
- [ ] Implement `mergeNodes(graphId, nodeId1, nodeId2)`
- [ ] Implement `deleteNode(graphId, nodeId)`
- [ ] Implement `updateEdge(graphId, edgeId, updates)`
- [ ] Implement `deleteEdge(graphId, edgeId)`
- [ ] Implement `addEdge(graphId, sourceId, targetId, type, weight)`
- [ ] Validate graph structure after edits
- [ ] Save edited graphs

**Test:** Edit graph → save → reload → edits persist

---

## Stage 12: Export & Sharing 🚧

### 12.1 Export Formats
- [ ] JSON Export (full graph data, pretty-printed)
- [ ] CSV Export:
  - [ ] `nodes.csv` (id, label, type, importance)
  - [ ] `edges.csv` (source, target, type, weight)
- [ ] PNG Export (capture current visualization)
- [ ] SVG Export (vector format for editing)

**Test:** Export in each format → verify data integrity

---

### 12.2 Export UI
- [ ] Export dropdown menu
- [ ] Download file with descriptive name (e.g., `graph-{id}-{date}.json`)
- [ ] Copy graph JSON to clipboard
- [ ] Show export success toast

**Test:** Export all formats → open files → verify correctness

---

## Stage 13: Multi-Document Graphs 🚧

### 13.1 Document Management
- [ ] Upload multiple files (batch upload)
- [ ] Document list sidebar
- [ ] Extract graph from each document
- [ ] "Merge Graphs" button

**Test:** Upload 3 files → see 3 separate graphs

---

### 13.2 Graph Merging Logic
- [ ] Deduplicate entities across documents (use existing dedup logic)
- [ ] Combine relationships (merge duplicates, sum weights)
- [ ] Track entity provenance:
  - [ ] Add `sources: [{ docId, docName }]` to entities
  - [ ] Show which documents mention each entity
- [ ] Calculate cross-document importance scores

**Test:** Merge 3 graphs → verify deduplication works

---

### 13.3 UI for Multi-Doc
- [ ] Document list with checkboxes
- [ ] Toggle document visibility in graph
- [ ] Filter by document source
- [ ] Show entity provenance in details panel
- [ ] Color-code nodes by source document (optional)

**Test:** Upload 3 PDFs → merge → filter by document

---

## Stage 14: Domain-Specific Features 🚧

### 14.1 Tech Domain Support
- [ ] Add entity types: FRAMEWORK, LANGUAGE, TOOL, ALGORITHM
- [ ] Add relationships: implements, depends_on, uses, extends, replaces
- [ ] Update ML service entity extraction prompts
- [ ] Update UI entity type filters
- [ ] Add domain-specific colors/icons

**Test:** Extract tech doc → see FRAMEWORK entities

---

### 14.2 Student/Research Domain Support
- [ ] Add entity types: PAPER, AUTHOR, INSTITUTION, THEORY
- [ ] Add relationships: authored, cites, builds_on, contradicts, validates
- [ ] Update ML service entity extraction prompts
- [ ] Update UI entity type filters
- [ ] Add domain-specific colors/icons

**Test:** Extract research paper → see PAPER entities

---

### 14.3 Domain Selector (Optional)
- [ ] Add domain selector in upload UI (Tech, Research, General)
- [ ] Pass domain hint to ML service
- [ ] Adjust extraction prompts based on domain
- [ ] Save domain preference

**Test:** Select domain → upload doc → verify domain-specific extraction

---

## Phase 2 Definition of Done

Phase 2 is complete when ALL of these are true:

**Phase 2.1 (Must-Have)**:
- [ ] Users can paste text and see graph visualization
- [ ] Users can upload PDF/DOCX files
- [ ] Graph is interactive (zoom, pan, click nodes)
- [ ] Performance: < 3s to render 100-node graph
- [ ] UI is responsive and intuitive

**Phase 2.2 (Should-Have)**:
- [ ] Users can manually edit graphs
- [ ] Users can export in JSON/CSV/PNG
- [ ] Users can merge graphs from multiple documents
- [ ] Edits persist after page refresh

**Phase 2.3 (Nice-to-Have)**:
- [ ] Tech domain entities extracted correctly
- [ ] Research domain entities extracted correctly
- [ ] Domain-specific relationships work

---

## Out of Scope (Phase 3+)

These will NOT be implemented in Phase 2:
- Authentication & user accounts
- Multi-user features & permissions
- Neo4j integration
- Gap detection algorithms
- AI memory/context export
- Collaborative editing
- Real-time updates

---

## Notes & Decisions

### Phase 1 Learnings
- Hybrid approach (spaCy + Gemini) works well
- Deduplication is critical for clean graphs
- Co-occurrence + LLM typing gives good relationships
- JSON storage is sufficient for now

### Phase 2 Decisions
- **Vite + React** (already set up, not Next.js)
- **Cytoscape.js** (already installed, not D3.js)
- **No authentication** (focus on core features)
- **Tech + Research domains** (target users)

### Frontend Structure (Existing)
- Uses Vite for fast dev server
- React 18 with TypeScript
- Cytoscape.js for graph visualization
- Feature-based folder structure
- Shared components and services

---

## Future Optimizations (Post-Phase 2)

### Performance
- [ ] Implement graph virtualization for 1000+ nodes
- [ ] Add WebSocket support for real-time updates
- [ ] Optimize relationship classification (reduce LLM calls)
- [ ] Add caching layer for repeated extractions

### ML Service
- [ ] Cache spaCy NER results
- [ ] Implement request queuing for high load
- [ ] Add response streaming for large extractions

### Backend
- [ ] Add request caching layer
- [ ] Implement compression for large responses
- [ ] Add database migration from JSON to Neo4j

**Priority**: Low (Phase 3+)  
**Reason**: Current implementation meets Phase 2 goals

---

**Last Updated**: 2025-11-24  
**Current Phase**: Phase 2 - User Interface & Productization  
**Status**: Stage 8 (Frontend Foundation) in progress
