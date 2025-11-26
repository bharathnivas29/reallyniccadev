# Really Nicca - Project Specification

> **Living Document:** Single source of truth for what Really Nicca is and what we're building  
> **Rule:** If code, docs, or decisions conflict with this file, **this file wins**

---

## What is Really Nicca?

Really Nicca is a **knowledge graph extraction and augmentation engine** that helps people understand complex information by:

1. **Organizing** - Extracting key concepts from text and building clean knowledge graphs
2. **Identifying Gaps** - Detecting missing connections and unexplored areas (future)
3. **Generating Insights** - Proposing questions, hypotheses, and new directions (future)
4. **Powering AI** - Exporting structured knowledge as long-term memory for LLMs (future)

**Target Users:**
- Researchers analyzing papers and literature
- Students studying complex topics
- Builders and founders synthesizing information
- Anyone reading dense material who wants structure

**Value Proposition:**
- ✅ Cognitive clarity through visualization
- ✅ Knowledge compression (many docs → one graph)
- ✅ Curiosity scaffolding (see what's connected, what's missing)
- ✅ Personalized knowledge operating system

---

## Current Phase - Phase 1: Accurate Graph Extraction

**Status:** 🚧 In Active Development

**Goal:** Build the **most accurate knowledge graph extraction engine** possible before adding features.

**Scope:**
- ✅ Accept text input via API
- ✅ Extract entities (people, orgs, concepts, dates, papers)
- ✅ Deduplicate similar entities intelligently
- ✅ Detect meaningful relationships (not noise)
- ✅ Return clean, human-understandable graph JSON
- ✅ Store graphs for testing/iteration

**Out of Scope (Phase 1):**
- ❌ File uploads (PDF, DOCX, TXT)
- ❌ Graph visualization UI
- ❌ Manual editing (merge, add, delete nodes/edges)
- ❌ Export formats (CSV, PNG, GraphML)
- ❌ Multi-document graph merging
- ❌ Neo4j or vector database integration
- ❌ User authentication or accounts
- ❌ Gap detection algorithms
- ❌ AI context memory export

**Rationale:**  
We failed previously because we built features before getting accuracy right. This time: **accuracy first, features later**.

---

## Phase 1 Definition of Done

Phase 1 is complete when ALL of these are true:

✅ **Functional:**
- Text → graph pipeline works end-to-end
- Entities extracted with high precision (≥80%)
- Deduplication merges correct aliases
- Relationships are meaningful, not random
- Graph JSON follows schema exactly
- Graphs saved and retrievable

✅ **Quality:**
- Entity precision ≥ 80%
- Entity recall ≥ 70%
- Relationship accuracy ≥ 75%
- No crashes on valid input
- Graceful error handling

✅ **Tested:**
- All unit tests pass
- All integration tests pass
- Manual testing on diverse samples
- Edge cases documented
- Performance benchmarks recorded

✅ **Documented:**
- All APIs documented with examples
- All algorithms explained
- Testing protocol written
- Code has clear comments

**If ANY criterion is not met, Phase 1 is incomplete.**

---

## High-Level Architecture

### Two-Service System

```
┌───────────────┐
│  Text Input   │
└───────┬───────┘
        │
        v
┌─────────────────────────────┐
│  Backend (Node.js)          │
│  • Text chunking            │
│  • ML orchestration         │
│  • Graph building           │
│  • JSON storage             │
└───────┬─────────────────────┘
        │
        v
┌─────────────────────────────┐
│  ML Service (Python)        │
│  • Entity extraction        │
│  • Embeddings               │
│  • Deduplication            │
│  • Relationships            │
└───────┬─────────────────────┘
        │
        v
┌───────────────┐
│  Graph JSON   │
└───────────────┘
```

### Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js for HTTP APIs
- JSON file storage (data/graphs/)
- Axios for ML service calls

**ML Service:**
- Python 3.9+ with FastAPI
- spaCy for NER baseline (en_core_web_sm)
- Gemini API for LLM enhancement
- Gemini API for embeddings (text-embedding-004)
- Pydantic for schemas

**Shared:**
- TypeScript types in `packages/types`
- JSON contract between services

---

## Core Data Models

### Entity (Graph Node)

```typescript
{
  id: "uuid",
  label: "Einstein",                    // Canonical name
  type: "PERSON",                       // PERSON | ORGANIZATION | CONCEPT | DATE | PAPER
  aliases: ["Albert Einstein", "A.E."], // Merged alternatives
  confidence: 0.92,                     // 0.0 - 1.0
  sources: [{
    docId: "doc-123",
    snippet: "Einstein developed relativity...",
    chunkIndex: 0
  }],
  metadata: {
    importance: 0.85                    // Degree centrality
  }
}
```

### Relationship (Graph Edge)

```typescript
{
  id: "uuid",
  sourceId: "entity-uuid-1",
  targetId: "entity-uuid-2",
  type: "cooccurrence",                 // cooccurrence | semantic | explicit
  relationType: "developed",            // Optional LLM-classified type
  weight: 0.7,                          // Strength (0.0 - 1.0)
  confidence: 0.8,                      // Certainty (0.0 - 1.0)
  examples: [
    "Einstein developed the theory of relativity"
  ]
}
```

### Graph

```typescript
{
  nodes: Entity[],
  edges: Relationship[],
  meta: {
    graphId: "uuid",
    createdAt: "2025-11-22T12:00:00Z",
    updatedAt: "2025-11-22T12:00:00Z",
    sourceText: "First 200 chars of input..."
  }
}
```

---

## Algorithms (High-Level)

### 1. Entity Extraction (Hybrid)

**Step 1: spaCy Baseline**
- Run spaCy NER on each text chunk
- Map labels: PERSON, ORG, GPE → our schema
- Calculate confidence: `base_confidence[label] + length_boost`
- Track source snippets

**Step 2: Gemini Enhancement**
- Send text to Gemini with extraction prompt
- Request entities following our schema
- Merge with spaCy results
- Boost confidence if both found same entity

**Output:** Entities with name, type, confidence, sources

### 2. Deduplication (Multi-Signal)

**Merge Decision:**
```
Merge if (same type) AND (
  string_similarity ≥ 0.85 OR
  cosine_similarity(embeddings) ≥ 0.90 OR
  abbreviation_detected
)
```

**String Similarity:**
- Normalize (lowercase, remove punctuation)
- SequenceMatcher ratio (Levenshtein-like)

**Semantic Similarity:**
- Generate embeddings via Gemini
- Calculate cosine similarity

**Abbreviation Detection:**
- If `short in long` AND `len(short) ≤ 5`

**Merging:**
- Keep canonical name (first occurrence)
- Add variants to aliases
- Merge all sources
- Average confidence scores

**Output:** Deduplicated entities with aliases

### 3. Relationship Classification (Co-occurrence)

**Step 1: Track Occurrences**
- For each entity, note which chunks it appears in
- Example: `Einstein → [chunk_0, chunk_2, chunk_5]`

**Step 2: Calculate Co-occurrence**
```
weight = shared_chunks / min(count_A, count_B)
```

**Step 3: Filter**
- Only keep relationships with `weight ≥ 0.3`
- Extract example snippets from shared chunks

**Step 4: Optional LLM Typing**
- For high-weight edges (`≥ 0.6`), send to Gemini
- Classify relationship type (authored, uses, part_of, etc.)

**Output:** Relationships with weight, confidence, examples

### 4. Graph Building (Backend)

**Step 1: Map ML Output**
- Convert ML entities → Graph nodes (add UUIDs)
- Convert ML relationships → Graph edges (add UUIDs)

**Step 2: Calculate Metrics**
- Degree centrality: `connections / max_connections`
- Normalize to 0-1 for importance score

**Step 3: Add Metadata**
- graphId, timestamps, source text preview

**Output:** Complete Graph object

---

## API Endpoints (Phase 1)

### Backend (Port 3000)

**POST /api/organize/extract**
- Input: `{ text: "..." }`
- Output: `{ graphId, graph: {...} }`
- Status: 200 OK, 400 Bad Request, 500 Error

**GET /api/organize/graphs**
- Output: List of graph metadata
- Status: 200 OK

**GET /api/organize/graphs/:graphId**
- Output: Full graph JSON
- Status: 200 OK, 404 Not Found

### ML Service (Port 8000)

**GET /health**
- Output: `{ status: "ok" }`
- Status: 200 OK

**POST /organize/extract**
- Input: `{ textChunks: [...], docId: "..." }`
- Output: `{ entities: [...], relationships: [...] }`
- Status: 200 OK, 400 Bad Request, 500 Error

---

## Quality Principles

These override speed, convenience, and feature requests:

### 1. Accuracy > Coverage
- Missing a weak entity is acceptable
- **Extracting a wrong entity is NOT acceptable**

### 2. Conservative Deduplication
- False negatives (not merging "AI" and "ML") are okay
- **False positives (merging "Apple Inc" and "apple fruit") are NOT okay**

### 3. Meaningful Relationships Only
- Low-confidence edges hidden by default
- Co-occurrence alone is not enough (need weight threshold)
- **Noise in the graph makes it useless**

### 4. Human-Understandable Graphs
- Graph should make sense to domain expert
- Node labels should be clear
- Relationships should be interpretable

### 5. Test-Driven Development
- Every function has a test
- Every stage validated before moving forward
- **No "we'll test later" - test now**

---

## Development Philosophy

### Working > Perfect
- Ship functional code first
- Optimize only when needed
- Measure before optimizing

### Simple > Complex
- Prefer simple algorithms over complex ones
- Add complexity only when necessary
- **YAGNI** (You Aren't Gonna Need It)

### Accuracy > Speed
- A slow correct answer beats a fast wrong one
- 10 seconds is fine if the graph is accurate
- 1 second is useless if the graph is garbage

### Linear > Parallel
- Complete one stage fully before next
- Test each stage independently
- No half-built features

---

## Testing Strategy

### Unit Tests
- Every utility function
- String similarity, cosine similarity
- Entity merging logic
- Co-occurrence calculation
- Mock external APIs (Gemini)

### Integration Tests
- Full ML pipeline (text → entities → relationships)
- Backend pipeline (text → ML → graph)
- End-to-end (API → graph JSON)

### Manual Tests
- 5+ sample texts (varied domains)
- Visual inspection of graphs
- Compare against expected outputs
- Document edge cases

### Benchmarking
- Create golden dataset (text + expected graph)
- Calculate precision/recall
- Track accuracy over time
- Target: ≥80% overall

---

## Storage Strategy

### Phase 1: JSON Files

**Why JSON:**
- Simple, no setup required
- Human-readable for debugging
- Fast for small scale (<100 graphs)
- Easy to version control test data

**Location:** `data/graphs/{graphId}.json`

**Format:** Pretty-printed JSON with standard Graph schema

### Future (Phase 2+): Neo4j

**When:** After accuracy is proven and we need:
- Graph-native queries (shortest path, centrality)
- Better performance at scale (1000+ graphs)
- Advanced analytics (community detection)

---

## Error Handling

### Input Validation
- Empty text → 400 Bad Request
- Text > 50,000 chars → 400 Bad Request
- Invalid JSON → 400 Bad Request

### External Service Failures
- ML service down → Retry 3× with backoff → 503 Service Unavailable
- Gemini API timeout → Fall back to spaCy-only
- Gemini rate limit → Exponential backoff

### Data Errors
- Invalid schema → 500 Internal Server Error
- Graph not found → 404 Not Found
- Storage error → 500 Internal Server Error

**All errors include:**
- Clear error message
- HTTP status code
- Request ID for debugging

---

## Performance Targets

### Latency
- 100-word text: < 5 seconds
- 1,000-word text: < 15 seconds
- 5,000-word text: < 30 seconds

### Accuracy
- Entity precision ≥ 80%
- Entity recall ≥ 70%
- Relationship accuracy ≥ 75%

### Reliability
- No crashes on valid input
- Graceful degradation on API failures
- No memory leaks

---

## Security (Minimal for Phase 1)

### Phase 1 (Development)
- Input length validation (prevent DoS)
- Environment variables for API keys
- CORS enabled for local testing
- **No authentication** (local use only)

### Phase 2+ (Production)
- JWT authentication
- Rate limiting per user
- Input sanitization
- HTTPS only
- API key rotation

---

## Future Phases (Not Now)

### Phase 2: Productization
- File upload pipeline (PDF, DOCX, TXT)
- Graph visualization UI (React + Cytoscape.js)
- Manual editing (merge nodes, add/delete edges)
- Export formats (JSON, CSV, PNG, GraphML)
- Multi-document graph merging
- Neo4j integration
- User authentication & profiles

### Phase 3: Gap Detection
- Disconnected component analysis
- Missing relationship detection
- Question generation based on gaps
- Insight recommendations

### Phase 4: Memory & Context
- Export graphs as LLM context
- RAG-style knowledge retrieval
- Graph-to-prompt conversion
- Agent memory integration

**Rule:** No future-phase features are allowed in code until promoted in this document.

---

## Success Metrics

### Phase 1 Success = All True:
- ✅ Produces accurate, interpretable graphs
- ✅ Works reliably across domains and text types
- ✅ Developers and AI collaborators understand system easily
- ✅ Users feel clarity, not confusion
- ✅ Architecture supports future phases without rewrite

### Failure = Any True:
- ❌ Graphs are noisy or incorrect
- ❌ System crashes on edge cases
- ❌ Code is unmaintainable
- ❌ Tests don't pass
- ❌ Accuracy < 80%

---

## Decision Log

### Why Gemini over OpenAI?
- Already have API access
- Good balance of quality and cost
- Strong embedding model

### Why spaCy + LLM hybrid?
- spaCy fast and reliable for baseline
- LLM catches domain-specific concepts spaCy misses
- Fallback to spaCy-only on LLM failure

### Why JSON storage over Neo4j?
- Simpler for Phase 1
- Easier to debug
- Fast enough for scale we need
- Can migrate later

### Why no UI yet?
- Focus on accuracy first
- API + JSON inspection is enough for validation
- UI is a distraction from core quality

### Why conservative deduplication?
- False positives break user trust
- Better to have duplicate "AI" and "Artificial Intelligence" than merge "Apple Inc" and "apple fruit"
- Can always merge manually in Phase 2

---

## Constraints & Assumptions

### Constraints
- Text input only (English, UTF-8)
- Single document per request
- Max 50,000 characters
- Gemini API rate limits apply
- Local development environment

### Assumptions
- Users provide well-formed text
- Text is in English
- Gemini API is available
- Localhost ports 3000 and 8000 free

---

## Project Governance

### Source of Truth Priority
1. **PROJECT_SPEC.md** (this file) - What we're building
2. **ARCHITECTURE.md** - How we're building it
3. **TASKS.md** - What's done and what's next
4. **IMPLEMENTATION_PLAN.md** - Detailed execution strategy

### Change Management
- All scope changes must update this file first
- Code follows spec, not the other way around
- AI agents must respect this hierarchy

### Review Process
- No code merged without passing tests
- No stage completed without manual validation
- No Phase 1 declared done without meeting all criteria

---

## Communication Guidelines

### For Developers
- Read this file first before coding
- Update docs when making decisions
- Test before declaring done
- Ask when uncertain

### For AI Agents
- Follow specs exactly
- Don't improvise features
- Test every change
- Document non-obvious decisions

### For Users (Future)
- Expect high accuracy, not perfect
- Report confusing graphs
- Suggest improvements after Phase 1

---

**This document is the contract for Phase 1. Everything else flows from here.**

---

**Last Updated:** 2025-11-22  
**Current Phase:** Phase 1 - Accurate Graph Extraction  
**Status:** Specification Locked, Implementation Ready  
**Next Review:** After Phase 1 completion