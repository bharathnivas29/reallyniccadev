# Phase 1 Implementation Plan - Accurate Graph Extraction

> **Goal:** Build a best-in-class knowledge graph extraction engine from scratch  
> **Timeline:** Linear, test-driven, accuracy-first approach  
> **Philosophy:** Working > Perfect, Accurate > Fast, Simple > Complex

---

## Executive Summary

We're starting completely fresh to focus purely on **graph accuracy**. No UI polish, no fancy features, just rock-solid entity extraction and relationship detection using proven algorithms.

**What we're building:**
- Text → Graph pipeline (JSON in, JSON out)
- spaCy + Gemini hybrid entity extraction
- Embedding-based deduplication
- Co-occurrence relationship detection
- Optional LLM relationship typing
- Simple JSON file storage for testing

**What we're NOT building (yet):**
- File uploads, visualization UI, manual editing, export, multi-docs, gaps, memory

---

## Architecture Overview

```
┌─────────────┐
│   TEXT      │
│   INPUT     │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│  Backend (Node.js)          │
│  - Text chunking            │
│  - ML orchestration         │
│  - Graph building           │
│  - JSON storage             │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  ML Service (Python)        │
│  ┌─────────────────────┐   │
│  │ 1. Entity Extract   │   │
│  │    (spaCy + Gemini) │   │
│  └─────────┬───────────┘   │
│            │                │
│  ┌─────────v───────────┐   │
│  │ 2. Embeddings       │   │
│  │    (Gemini API)     │   │
│  └─────────┬───────────┘   │
│            │                │
│  ┌─────────v───────────┐   │
│  │ 3. Deduplication    │   │
│  │    (String + Sema)  │   │
│  └─────────┬───────────┘   │
│            │                │
│  ┌─────────v───────────┐   │
│  │ 4. Relationships    │   │
│  │    (Co-occurrence)  │   │
│  └─────────┬───────────┘   │
│            │                │
│  ┌─────────v───────────┐   │
│  │ 5. LLM Typing (opt) │   │
│  └─────────────────────┘   │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  GRAPH JSON                 │
│  {nodes: [], edges: []}     │
└─────────────────────────────┘
```

---

## Technology Stack

### Backend (Node.js)
- **Framework:** Express.js
- **Language:** TypeScript
- **HTTP Client:** Axios
- **Storage:** JSON files (fs module)
- **Testing:** Jest

### ML Service (Python)
- **Framework:** FastAPI
- **NER:** spaCy (en_core_web_sm)
- **LLM:** Gemini API
- **Embeddings:** Gemini text-embedding-004
- **Similarity:** SequenceMatcher, cosine similarity
- **Testing:** pytest

### Shared
- **Types:** TypeScript definitions in `packages/types`
- **Data Format:** JSON (Graph, Entity, Relationship schemas)

---

## Key Algorithms

### 1. Entity Extraction (Hybrid)

**Step 1: spaCy Baseline**
- Process each text chunk with spaCy NER
- Map labels: PERSON→PERSON, ORG→ORGANIZATION, etc.
- Calculate confidence based on entity length + label reliability
- Track source snippets

**Step 2: Gemini Enhancement**
- Send text + spaCy entities to Gemini
- Prompt: "Extract additional entities following this schema..."
- Merge results: entities found by both get confidence boost
- Cap Gemini-only confidence at 0.92

**Output:** List of entities with name, type, confidence, sources, aliases

---

### 2. Deduplication (Multi-Signal)

**Signals:**
1. **String similarity** (Levenshtein via SequenceMatcher)
   - Threshold: 0.85
   - Example: "AI" vs "A.I." → 0.66, but normalized → 1.0

2. **Semantic similarity** (Cosine on embeddings)
   - Threshold: 0.90
   - Example: "AI" vs "Artificial Intelligence" → 0.95

3. **Abbreviation detection**
   - If one name contains the other AND short (≤5 chars)
   - Example: "AI" in "Artificial Intelligence"

**Merging:**
- Group entities by type (can't merge PERSON with CONCEPT)
- Find merge candidates using signals above
- Keep canonical name (first occurrence)
- Add variants to aliases array
- Merge all sources
- Average confidence scores

**Output:** Deduplicated entities with populated aliases

---

### 3. Relationship Classification (Co-occurrence)

**Step 1: Track Occurrences**
- For each entity, track which chunks it appears in
- Example: Einstein → [chunk 0, chunk 2, chunk 5]

**Step 2: Find Co-occurrences**
- For each entity pair, find shared chunks
- Calculate weight = shared / min(count_A, count_B)
- Example: A in [0,1], B in [1,2] → shared [1] → weight = 1/2 = 0.5

**Step 3: Filter by Threshold**
- Only keep relationships with weight ≥ 0.3
- Extract example snippets from shared chunks

**Step 4: Optional LLM Typing**
- For high-weight edges (≥ 0.6), send to Gemini
- Prompt: "What is the relationship between X and Y in this context?"
- Add relationType field (authored, uses, part_of, etc.)

**Output:** List of relationships with source, target, weight, confidence, examples

---

### 4. Graph Building (Backend)

**Step 1: Map to Graph Schema**
- ML entities → Graph nodes with UUIDs
- ML relationships → Graph edges with UUIDs
- Add metadata (createdAt, sourceTextInfo)

**Step 2: Calculate Metrics**
- Node importance = degree centrality (# of connections / max connections)
- Normalize to 0-1 range

**Step 3: Validate**
- All edge sourceIds/targetIds reference real nodes
- No duplicate node IDs
- All required fields present

**Output:** Complete Graph object ready for storage/return

---

## Development Workflow

### Linear Progression
1. **Build vertically, not horizontally**
   - Complete one feature end-to-end before next
   - Don't build half of everything

2. **Test at every step**
   - Unit test after writing each function
   - Integration test after completing each stage
   - Manual test with real data

3. **Iterate on accuracy**
   - If test fails, fix immediately
   - If accuracy is low, tune before moving on
   - Document what works and what doesn't

### Testing Strategy

**Unit Tests (Micro-level)**
- Every utility function
- Every core algorithm
- Mock external dependencies (Gemini API)

**Integration Tests (Macro-level)**
- Full ML pipeline (text → entities → relationships)
- Backend pipeline (text → ML → graph)
- End-to-end (API request → graph response)

**Manual Testing (Human-level)**
- 5+ sample texts from different domains
- Visual inspection of output graphs
- Compare against expected results
- Document edge cases and failures

**Accuracy Benchmarking**
- Create golden dataset (text + expected graphs)
- Calculate precision/recall for entities
- Calculate accuracy for relationships
- Target: ≥80% overall accuracy

---

## File Structure

```
ReallyNicca/
├── packages/
│   └── types/               # Shared TypeScript types
│       ├── src/
│       │   ├── entity.ts
│       │   ├── relationship.ts
│       │   ├── graph.ts
│       │   └── index.ts
│       └── package.json
│
├── services/
│   ├── backend/             # Node.js API Gateway
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── core/
│   │   │   │   ├── ml/
│   │   │   │   │   └── python-client.service.ts
│   │   │   │   └── storage/
│   │   │   │       └── graph-storage.service.ts
│   │   │   └── features/
│   │   │       └── organize/
│   │   │           ├── routes.ts
│   │   │           ├── controllers/
│   │   │           │   ├── extract.controller.ts
│   │   │           │   └── graph.controller.ts
│   │   │           └── services/
│   │   │               ├── text-processor.service.ts
│   │   │               └── graph-builder.service.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── ml-service/          # Python ML Brain
│       ├── app/
│       │   ├── main.py
│       │   ├── shared/
│       │   │   └── utils/
│       │   │       ├── spacy_loader.py
│       │   │       ├── gemini_client.py
│       │   │       └── similarity.py
│       │   └── features/
│       │       └── organize/
│       │           ├── routes.py
│       │           ├── schemas/
│       │           │   └── extract.py
│       │           └── services/
│       │               ├── entity_extractor.py
│       │               ├── embedding_service.py
│       │               ├── deduplication_engine.py
│       │               └── relationship_classifier.py
│       ├── tests/
│       └── requirements.txt
│
├── data/
│   ├── graphs/              # Stored graph JSONs
│   └── test-samples/        # Golden dataset
│
└── docs/
    ├── TASKS.md
    ├── ROUTES.md
    ├── ALGORITHMS.md
    └── IMPLEMENTATION_PLAN.md (this file)
```

---

## Critical Success Factors

### 1. Accuracy > Speed
- It's okay if extraction takes 10 seconds
- It's NOT okay if entities are wrong

### 2. Conservative Deduplication
- Better to have duplicates than wrong merges
- "AI" and "Apple Inc" should NEVER merge

### 3. Meaningful Relationships
- Low-confidence edges hidden by default
- Co-occurrence alone is not enough
- Weight threshold tuning is critical

### 4. Comprehensive Testing
- Every function tested
- Every stage validated
- Real-world examples used

### 5. Clear Documentation
- Every algorithm explained
- Every decision documented
- Every API endpoint described

---

## Risk Mitigation

### Risk: Gemini API Rate Limits
**Mitigation:**
- Implement retry with exponential backoff
- Add timeout handling
- Fallback to spaCy-only mode
- Cache results when possible

### Risk: Poor Deduplication
**Mitigation:**
- Start with conservative thresholds (0.85, 0.90)
- Test with known aliases dataset
- Add manual review step for edge cases
- Log merge decisions for debugging

### Risk: Noisy Relationships
**Mitigation:**
- Use minimum weight threshold (0.3)
- Filter by confidence
- Require multiple co-occurrences
- Optional: human-in-the-loop validation

### Risk: Slow Extraction
**Mitigation:**
- Batch processing for embeddings
- Limit text chunk size
- Profile and optimize bottlenecks
- Add timeout for long-running requests

---

## Acceptance Criteria

Before declaring Phase 1 complete:

✅ **Functional Requirements**
- [ ] Text input accepted via API
- [ ] Entities extracted with spaCy + Gemini
- [ ] Deduplication works (aliases populated)
- [ ] Relationships detected (co-occurrence)
- [ ] Graph JSON returned with valid schema
- [ ] Graphs saved to JSON files
- [ ] Graphs can be retrieved by ID

✅ **Quality Requirements**
- [ ] Entity precision ≥ 80%
- [ ] Entity recall ≥ 70%
- [ ] Relationship accuracy ≥ 75%
- [ ] No crashes on valid input
- [ ] Graceful error handling

✅ **Testing Requirements**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing on 5+ samples
- [ ] Edge cases documented
- [ ] Performance benchmarks recorded

✅ **Documentation Requirements**
- [ ] All endpoints in ROUTES.md
- [ ] All algorithms explained
- [ ] Testing protocol documented
- [ ] Code has comments/docstrings

---

## Next Steps (After Phase 1)

**Phase 2: Productization**
- File upload support (PDF, DOCX)
- Graph visualization UI
- Manual editing (merge, add, delete)
- Export formats (CSV, PNG)
- Multi-document graphs
- Neo4j integration

**Phase 3: Advanced Features**
- Gap detection
- Insight generation
- Memory/context export for LLMs
- Collaborative workspaces

---

## Questions & Clarifications

> Use this section to track any open questions or decisions needed

- [ ] What text encoding to support? (UTF-8 only?)
- [ ] Maximum text length? (50k chars?)
- [ ] Embedding dimension? (768 for Gemini)
- [ ] Storage format? (Pretty JSON or compact?)
- [ ] Error response format? (Standard or custom?)

---

**Last Updated:** 2025-11-22  
**Status:** Ready to Begin Implementation  
**Next Action:** Start Stage 0 - Foundation Setup
