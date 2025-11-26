# Phase 1 – Organize (Graph Engine) – Feature Spec

> This file defines **Tier 1 features** for Phase 1.  
> It is focused on the **graph extraction + visualization + manual editing** flow.

---

## 1. Goal

Given one or more input documents (PDF, DOCX, TXT, raw text),  
the system should:

- Extract important entities and concepts.
- Build an accurate knowledge graph (nodes and edges).
- Display the graph in a simple, understandable UI.
- Let users manually fix and extend the graph.
- Save and load graphs later.
- Export graphs for other tools or AI.

---

## 2. Users & Core Use Case

### Users (initial)

- Students & researchers reading papers/articles/books.
- Builders/creators reading strategy docs, essays, reports.
- People with lots of text who want to see connections.

### Core Scenario

1. User uploads a paper or notes.
2. System shows a **clean, minimal graph** of key concepts and their relationships.
3. User clicks nodes to inspect them and their evidence.
4. User merges duplicate nodes, deletes noise, adds missing edges.
5. User exports the graph for later use (JSON/CSV/image/etc.).

---

## 3. Core Workflow – End-to-End

1. **Upload**
   - Input: PDF / DOCX / TXT / raw text.
   - Backend parses into plain text.
   - Text is chunked (e.g., ~800–1000 tokens per chunk, overlapping).

2. **ML Extraction**
   - Backend → ML service `/organize/extract`.
   - ML service:
     - Extracts entities with schema:
       - `PERSON`, `ORGANIZATION`, `CONCEPT`, `DATE`, `PAPER`
     - Generates embeddings for entities.
     - Deduplicates similar entities.
     - Classifies relationships using Hybrid Approach (Pattern Matching + LLM).
   - ML returns:
     - `entities[]`
     - `relationships[]` (with specific types like `founded`, `works_at`).

3. **Graph Building (Backend)**
   - Build nodes from ML entities.
   - Build edges from:
     - Co-occurrence (sentence/window-level)
     - Semantic similarity (cosine >= threshold)
     - ML explicit relationships
   - Compute:
     - Edge weight
     - Edge confidence
     - Node metrics (degree/betweenness for sizing)
   - Save graph to DB (Neo4j or JSON).

4. **Visualization (Frontend)**
   - Frontend fetches graph JSON.
   - Render with Cytoscape:
     - Node size = importance.
     - Node color = community.
     - Edges filtered by confidence.

5. **Manual Editing (Frontend + Backend)**
   - User operations:
     - Merge nodes.
     - Split node.
     - Add edge.
     - Remove edge.
     - Edit labels/types (entity type, relationship type).
   - Backend applies edits and persists them.
   - Corrections are logged for future learning.

6. **Export**
   - User can export:
     - Graph JSON
     - CSV of nodes/edges
     - (Optional later) PNG/SVG of graph

---

## 4. Detailed Features (Tier 1)

### 4.1 Upload & Parsing

**Description:**  
User can upload documents and see them queued and processed.

**Requirements:**

- Supported formats for MVP:
  - `.pdf`, `.docx`, `.txt`
- Backend extracts text:
  - PDF → use a safe PDF parser.
  - DOCX → use a simple docx parser.
  - TXT → directly use contents.
- Errors should be:
  - Clear (e.g. “Cannot parse this PDF”).
  - Not crash the server.

**Acceptance Criteria:**

- [ ] Uploading a valid file returns a job ID or immediate result.
- [ ] Invalid files return a safe error.
- [ ] Extracted text can be logged/inspected in dev mode.

---

### 4.2 Entity Extraction (ML Service)

**Description:**  
Identify key entities and concepts from text chunks.

> **Implementation:** See `TASKS.md` → **Stage 3.1** (spaCy baseline + Gemini refinement)

**Requirements:**

- Use hybrid approach:
  - spaCy (or similar) for baseline.
  - Gemini LLM for schema-based extraction.
- Entity schema:
  - `PERSON`, `ORGANIZATION`, `CONCEPT`, `DATE`, `PAPER`
- Each entity has:
  - `name`
  - `type`
  - `confidence`
  - `source_snippets[]` (evidence)

**Description:**  
Normalize entities and relationships into a graph that can be persisted and rendered.

**Requirements:**

- Use shared `Graph`, `Entity`, `Relationship` types from `packages/types`.
- Backend `graph-builder.service.ts` converts ML JSON → Graph.
- Store in Neo4j if available; fallback to JSON file/collection in dev.

**Acceptance Criteria:**

- [ ] For a given input, graph JSON is stable and repeatable.
- [ ] Loading the same graph ID returns the same structure.
- [ ] Saving and reloading a graph works in tests.

---

### 4.6 Graph Visualization (Frontend)

**Description:**  
Show a simple, readable graph UI.

**Requirements:**

- Cytoscape-based view with:
  - Pan & zoom.
  - Node click → details panel.
  - Simple layout (force-based or preset).
- Nodes:
  - Size = importance (degree/betweenness).
  - Color = community (Louvain in backend or client).
- Edges:
  - Optional thickness by weight.
  - Confidence slider to filter low-confidence edges.

**Acceptance Criteria:**

- [ ] Graph renders for golden JSON with no errors.
- [ ] User can click nodes and see basic info (label, type, connections).
- [ ] Confidence slider hides/shows edges as expected.

---

### 4.7 Manual Editing

**Description:**  
Allow users to fix and extend the graph.

> **Implementation:** See `TASKS.md` → **Stage 4.1** (Backend) + **Stage 4.2** (Frontend)

**Operations:**

- Merge two entities.
- Split an entity.
- Add an edge.
- Remove an edge.
- Edit label/type of an entity.
- Optionally edit relation type of explicit edges.

**Backend Handling:**

- `edit.service.ts` applies changes to graph in DB/JSON.
- `CorrectionLog.model.ts` records:
  - userId (if available),
  - timestamp,
  - original state,
  - new state,
  - reason (optional).

**Acceptance Criteria:**

- [ ] User merges nodes in UI and graph updates on refresh. (Stage 4.2)
- [ ] Removing edges persists. (Stage 4.1)
- [ ] Corrections log is updated in golden tests. (Stage 4.1)

---

### 4.8 Export

**Description:**  
Let users take the graph out of the system.

> **Implementation:** See `TASKS.md` → **Stage 4.3** (Export Service + UI)

**MVP Formats:**

- JSON: full graph structure.
- CSV: nodes.csv and edges.csv.

**Acceptance Criteria:**

- [ ] Exported JSON matches in-memory graph. (Stage 4.3)
- [ ] CSVs can be imported into common tools (e.g., Gephi) without major issues. (Stage 4.3)

---

## 5. Metrics & Evaluation

We care about:

- Entity precision/recall (based on `golden_entities.json`).
- Edge precision (manual or semi-manual gold set).
- User-perceived clarity:
  - “Are the top 10 nodes meaningful?”
  - “Are top 10 edges meaningful?”

For MVP, we want:

- Entity precision ≥ ~0.80 on golden set.  
- Edge precision ≥ ~0.65 on high-confidence edges.  

---

## 6. Out of Scope for Phase 1

- Automatic gap detection UI.
- Idea generation or question suggestion UI.
- AI “memory” / RAG exports beyond basic JSON/CSV.
- Multi-user projects with complex permissions.

Those live in `GAPS_FEATURES.md` and `MEMORY_FEATURES.md`.

---
