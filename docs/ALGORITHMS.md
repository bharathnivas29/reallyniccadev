# Algorithm Documentation

## Overview
This document describes the core algorithms used in the Really Nicca Knowledge Graph Extraction Engine, including entity extraction, deduplication, and relationship classification.

---

## Table of Contents
- [Entity Extraction](#entity-extraction)
- [Embedding Generation](#embedding-generation)
- [Deduplication](#deduplication)
- [Relationship Classification](#relationship-classification)
- [Complexity Analysis](#complexity-analysis)

---

## Entity Extraction

### Hybrid Approach: spaCy + Gemini

The system uses a two-stage hybrid approach combining rule-based NER with LLM enhancement.

```mermaid
flowchart TD
    A[Input Text Chunks] --> B[spaCy NER]
    B --> C[Baseline Entities]
    C --> D{Gemini Available?}
    D -->|Yes| E[Gemini Enhancement]
    D -->|No| F[Return spaCy Only]
    E --> G[Parse JSON Response]
    G --> H[Merge Results]
    C --> H
    H --> I[Deduplicated Entities]
    F --> I
```

### Stage 1: spaCy Baseline

**Algorithm**: `extract_entities_spacy(text_chunks, doc_id)`

**Steps**:
1. Load spaCy model (`en_core_web_sm`)
2. For each text chunk:
   - Run spaCy NER
   - Map labels (PERSON, ORG → ORGANIZATION, GPE/LOC → LOCATION, etc.)
   - Calculate confidence score:
     ```python
     confidence = min(0.95, BASE_CONFIDENCE + length_boost)
     length_boost = min(0.2, len(entity_name) * 0.01)
     ```
   - Extract source snippet (50 chars before/after)
3. Merge duplicate entities within chunks
4. Boost confidence for repeated entities (+0.05 per occurrence)

**Complexity**: O(n × m) where n = number of chunks, m = average chunk length

### Stage 2: Gemini Enhancement

**Algorithm**: `extract_entities_with_gemini(text_chunks, doc_id, use_gemini=True)`

**Steps**:
1. Get spaCy baseline entities
2. For each chunk:
   - Send to Gemini with structured prompt
   - Request JSON format with entity list
   - Parse response with retry logic (3 attempts)
   - Cap Gemini confidence at 0.92
3. Merge spaCy and Gemini results:
   - Entities found by both: boost confidence (+0.05)
   - Gemini-only entities: add if confidence ≥ 0.55
   - Merge source snippets (avoid duplicates)

**Prompt Structure**:
```
Extract entities from the following text. Return JSON with:
{
  "entities": [
    {"name": "...", "type": "PERSON|ORGANIZATION|CONCEPT|...", "confidence": 0.0-1.0}
  ]
}

Types: PERSON, ORGANIZATION, CONCEPT, DATE, PAPER, LOCATION

Text: [chunk]
```

**Complexity**: O(n × (m + g)) where g = Gemini API latency (~1-2s per chunk)

---

## Embedding Generation

### Gemini text-embedding-004

**Algorithm**: `generate_embeddings(texts)`

**Steps**:
1. Batch texts into groups of 10
2. For each batch:
   - Call Gemini embedding API
   - Retry on failure (3 attempts, exponential backoff)
   - Return 768-dimensional vectors
3. Handle failures gracefully (return None, not zero vectors)

**Output**: List of 768-dimensional float vectors

**Complexity**: O(n / batch_size × api_latency)

---

## Deduplication

### Multi-Signal Matching

The deduplication engine uses three signals to identify duplicate entities:

```mermaid
flowchart TD
    A[Entity Pairs] --> B{Same Type?}
    B -->|No| C[Keep Separate]
    B -->|Yes| D[String Similarity]
    D --> E{Similarity ≥ 0.85?}
    E -->|Yes| F[MERGE]
    E -->|No| G[Embedding Similarity]
    G --> H{Similarity ≥ 0.90?}
    H -->|Yes| F
    H -->|No| I[Abbreviation Check]
    I --> J{Is Abbreviation?}
    J -->|Yes| F
    J -->|No| C
```

### Algorithm: `should_merge(entity1, entity2, emb1, emb2)`

**Merge Conditions** (any one triggers merge):

1. **String Similarity** ≥ 0.85
   ```python
   normalized1 = normalize_text(entity1.name)  # lowercase, remove punctuation
   normalized2 = normalize_text(entity2.name)
   similarity = SequenceMatcher(None, normalized1, normalized2).ratio()
   ```

2. **Embedding Similarity** ≥ 0.90
   ```python
   cosine_sim = dot(emb1, emb2) / (norm(emb1) * norm(emb2))
   ```

3. **Abbreviation Detection**
   - One name contains the other
   - Shorter name ≤ 5 characters
   - Example: "AI" ⊂ "Artificial Intelligence"

### Merging Strategy

**Algorithm**: `deduplicate_entities(entities, embeddings)`

**Steps**:
1. Group entities by type (PERSON, ORGANIZATION, etc.)
2. For each type group:
   - Compare all pairs (n² comparisons)
   - Build merge clusters using union-find
3. For each cluster:
   - Select canonical entity (highest confidence)
   - Merge aliases from all variants
   - Combine source snippets
   - Average confidence scores

**Complexity**: O(t × n² × (s + e)) where:
- t = number of entity types
- n = average entities per type
- s = string comparison cost
- e = embedding comparison cost

**Optimization**: Group by type reduces comparisons from O(N²) to O(t × (N/t)²)

---

## Relationship Classification

### Two-Stage Approach: Co-occurrence + LLM Typing

```mermaid
flowchart TD
    A[Entities + Text Chunks] --> B[Find Co-occurrences]
    B --> C[Calculate Weights]
    C --> D{Weight ≥ 0.3?}
    D -->|No| E[Discard]
    D -->|Yes| F[Create Relationship]
    F --> G{Weight ≥ 0.5?}
    G -->|No| H[Keep Generic 'related_to']
    G -->|Yes| I[LLM Classification]
    I --> J[Specific Type]
    H --> K[Final Relationships]
    J --> K
```

### Stage 1: Co-occurrence Detection

**Algorithm**: `build_cooccurrence_relationships(text_chunks, entities, min_weight=0.3)`

**Steps**:
1. Map entities to chunk indices:
   ```python
   occurrences[entity_name] = {chunk_idx1, chunk_idx2, ...}
   ```

2. For each entity pair (i, j):
   - Find shared chunks: `shared = chunks_i ∩ chunks_j`
   - Calculate weight:
     ```python
     weight = len(shared) / min(len(chunks_i), len(chunks_j))
     ```
   - If weight ≥ min_weight, create relationship

3. Extract example snippets from shared chunks (up to 3)

**Weight Formula**:
```
weight = |shared_chunks| / min(|chunks_entity1|, |chunks_entity2|)
```

This allows a rare entity (1 occurrence) to have strong relationship (weight=1.0) with a common entity if they co-occur.

**Complexity**: O(n² × c) where n = entities, c = average chunks per entity

### Stage 2: LLM Relationship Typing

**Algorithm**: `classify_relationships_with_llm(relationships, gemini_client)`

**Steps**:
1. Filter relationships with weight ≥ 0.5
2. For each high-weight relationship:
   - Send entity pair + example snippets to Gemini
   - Request relationship type classification
   - Update `relationType` field
   - Boost confidence if LLM is confident

**Prompt Structure**:
```
Classify the relationship between these entities:
Entity 1: [name]
Entity 2: [name]

Context examples:
- [snippet 1]
- [snippet 2]

Return JSON:
{
  "type": "works_at|founded|authored|located_in|related_to|...",
  "confidence": 0.0-1.0
}
```

**Complexity**: O(r × g) where r = high-weight relationships, g = LLM latency

---

## Complexity Analysis

### Overall Pipeline

```
Input Text (length L)
    ↓
Text Chunking: O(L)
    ↓
Entity Extraction: O(n × m + n × g)  [n=chunks, m=chunk_length, g=Gemini_latency]
    ↓
Embedding Generation: O(e / 10 × g)  [e=entities]
    ↓
Deduplication: O(t × (e/t)² × (s + c))  [t=types, s=string_sim, c=cosine_sim]
    ↓
Relationship Detection: O(e² × avg_chunks)
    ↓
LLM Relationship Typing: O(r × g)  [r=high-weight_relationships]
    ↓
Graph Building: O(e + r)
```

### Time Complexity Summary

| Component | Complexity | Typical Time |
|-----------|------------|--------------|
| Text Chunking | O(L) | < 0.1s |
| spaCy NER | O(n × m) | 0.5-1s |
| Gemini Entity Extraction | O(n × g) | 2-5s |
| Embedding Generation | O(e / 10 × g) | 1-3s |
| Deduplication | O(e² / t) | 0.1-0.5s |
| Co-occurrence | O(e² × c) | 0.1-0.3s |
| LLM Relationship Typing | O(r × g) | 0-2s |
| **Total** | **O(L + n×g + e²)** | **3-12s** |

### Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Text Chunks | O(L) | Original text + chunks |
| Entities | O(e × (d + s)) | d=768 (embedding), s=snippet_length |
| Embeddings | O(e × 768) | 768-dimensional vectors |
| Relationships | O(r × k) | k=example_snippets |
| **Total** | **O(L + e×d + r)** | Dominated by embeddings |

### Optimization Strategies

1. **Batching**: Process embeddings in batches of 10
2. **Type Grouping**: Reduce deduplication from O(e²) to O(e²/t)
3. **Weight Filtering**: Only classify high-weight relationships
4. **Caching**: Cache spaCy model and Gemini client
5. **Parallel Processing**: Could parallelize chunk processing (not implemented)

---

## Algorithm Improvements (Future)

### Entity Extraction
- [ ] Add domain-specific entity types
- [ ] Implement entity linking to knowledge bases
- [ ] Use larger spaCy models for better accuracy

### Deduplication
- [ ] Implement approximate nearest neighbor search (O(e log e))
- [ ] Add phonetic matching for names
- [ ] Use graph-based clustering instead of pairwise

### Relationship Classification
- [ ] Train custom relationship classifier
- [ ] Add dependency parsing for explicit relationships
- [ ] Implement temporal relationship extraction

---

## References

### Libraries Used
- **spaCy**: `en_core_web_sm` model for NER
- **Gemini**: `gemini-1.5-flash` for entity extraction and relationship typing
- **Gemini Embeddings**: `text-embedding-004` for 768-dim vectors

### Papers & Techniques
- Named Entity Recognition: Rule-based + Statistical
- Embedding Similarity: Cosine similarity in high-dimensional space
- Co-occurrence Analysis: Jaccard-like similarity for entity pairs
- String Matching: Levenshtein distance via SequenceMatcher

---

## Appendix: Example Walkthrough

### Input
```
"Albert Einstein developed the theory of relativity."
```

### Step-by-Step

1. **Text Chunking**: Single chunk (< 4000 chars)

2. **spaCy NER**:
   - "Albert Einstein" → PERSON (confidence: 0.75)
   - "theory of relativity" → (not detected by spaCy)

3. **Gemini Enhancement**:
   - "Albert Einstein" → PERSON (confidence: 0.85)
   - "theory of relativity" → CONCEPT (confidence: 0.80)

4. **Merge Results**:
   - "Albert Einstein" → PERSON (confidence: 0.80, found by both)
   - "theory of relativity" → CONCEPT (confidence: 0.80, Gemini only)

5. **Embedding Generation**:
   - "Albert Einstein" → [0.12, -0.34, ..., 0.56] (768 dims)
   - "theory of relativity" → [0.08, 0.21, ..., -0.12] (768 dims)

6. **Deduplication**: No duplicates (only 2 entities)

7. **Co-occurrence**:
   - Both entities in chunk 0
   - Weight = 1 / min(1, 1) = 1.0
   - Create relationship with weight=1.0

8. **LLM Typing** (weight ≥ 0.5):
   - Entities: "Albert Einstein", "theory of relativity"
   - Context: "Albert Einstein developed the theory of relativity."
   - LLM Result: type="developed", confidence=0.85

9. **Final Graph**:
   - Nodes: 2 (Einstein, relativity)
   - Edges: 1 (Einstein -[developed]-> relativity)
   - Processing time: ~3-4 seconds

---

## Diagram Legend

```mermaid
flowchart LR
    A[Process Step] --> B{Decision Point}
    B -->|Condition| C[Outcome]
    B -->|Alternative| D[Alternative Outcome]
```

- **Rectangle**: Process or algorithm step
- **Diamond**: Decision or conditional check
- **Arrow**: Data flow or control flow
- **Dashed Line**: Optional or conditional path
