# Really Nicca - API Routes Tracker

> **Purpose:** Track all API endpoints, their status, and testing results.  
> Update this file as endpoints are implemented.

---

## ML Service (Python/FastAPI) - Port 8000

### Health & Status

| Endpoint | Method | Status | Description | Test Status |
|----------|--------|--------|-------------|-------------|
| `/health` | GET | [ ] | Health check | [ ] |

---

### Organize - Entity & Relationship Extraction

| Endpoint | Method | Status | Description | Test Status |
|----------|--------|--------|-------------|-------------|
| `POST /organize/extract` | POST | [ ] | Extract entities & relationships from text | [ ] |

**Request Schema:**
```json
{
  "textChunks": ["string"],
  "docId": "string"
}
```

**Response Schema:**
```json
{
  "entities": [
    {
      "name": "string",
      "type": "PERSON | ORGANIZATION | CONCEPT | DATE | PAPER",
      "confidence": 0.0-1.0,
      "sources": [
        {
          "docId": "string",
          "snippet": "string",
          "chunkIndex": 0
        }
      ],
      "aliases": ["string"]
    }
  ],
  "relationships": [
    {
      "sourceEntity": "string",
      "targetEntity": "string",
      "type": "cooccurrence | semantic | explicit",
      "weight": 0.0-1.0,
      "confidence": 0.0-1.0,
      "examples": ["string"]
    }
  ]
}
```

**Test Cases:**
- [ ] Valid request with single chunk
- [ ] Valid request with multiple chunks
- [ ] Empty text chunks (error case)
- [ ] Large text (performance test)
- [ ] Special characters/Unicode
- [ ] Missing docId (should use default)

---

## Backend Service (Node.js/Express) - Port 3000

### Organize - Graph Extraction

| Endpoint | Method | Status | Description | Test Status |
|----------|--------|--------|-------------|-------------|
| `POST /api/organize/extract` | POST | [ ] | Convert text to graph | [ ] |
| `GET /api/organize/graphs` | GET | [ ] | List all saved graphs | [ ] |
| `GET /api/organize/graphs/:graphId` | GET | [ ] | Get specific graph by ID | [ ] |

---

### POST /api/organize/extract

**Purpose:** Main endpoint - convert raw text into knowledge graph

**Request Schema:**
```json
{
  "text": "string (required, max 50000 chars)"
}
```

**Response Schema:**
```json
{
  "graphId": "uuid",
  "graph": {
    "nodes": [
      {
        "id": "uuid",
        "label": "string",
        "type": "PERSON | ORGANIZATION | CONCEPT | DATE | PAPER",
        "aliases": ["string"],
        "confidence": 0.0-1.0,
        "sources": [
          {
            "docId": "string",
            "snippet": "string",
            "chunkIndex": 0
          }
        ],
        "metadata": {
          "importance": 0.0-1.0
        }
      }
    ],
    "edges": [
      {
        "id": "uuid",
        "sourceId": "uuid",
        "targetId": "uuid",
        "type": "cooccurrence | semantic | explicit",
        "relationType": "string (optional)",
        "weight": 0.0-1.0,
        "confidence": 0.0-1.0,
        "examples": ["string"]
      }
    ],
    "meta": {
      "graphId": "uuid",
      "createdAt": "ISO date",
      "updatedAt": "ISO date",
      "sourceText": "string (first 200 chars)"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid input (missing text, too long, etc.)
- `500` - ML service unavailable
- `503` - Processing timeout

**Test Cases:**
- [ ] Simple text (1 paragraph)
- [ ] Medium text (5 paragraphs)
- [ ] Large text (10+ paragraphs)
- [ ] Text with special characters
- [ ] Text with multiple entities of same name
- [ ] Text with clear relationships
- [ ] Empty string (should error)
- [ ] Text > 50000 chars (should error)
- [ ] Concurrent requests (stress test)

---

### GET /api/organize/graphs

**Purpose:** List all saved graphs (metadata only)

**Response Schema:**
```json
{
  "graphs": [
    {
      "graphId": "uuid",
      "createdAt": "ISO date",
      "nodeCount": 0,
      "edgeCount": 0,
      "preview": "string (first 100 chars of source text)"
    }
  ]
}
```

**Test Cases:**
- [ ] No graphs saved (empty array)
- [ ] Multiple graphs saved
- [ ] Sorted by createdAt (most recent first)

---

### GET /api/organize/graphs/:graphId

**Purpose:** Retrieve specific graph by ID

**Response Schema:**
Same as `POST /api/organize/extract` graph object

**Error Responses:**
- `404` - Graph not found

**Test Cases:**
- [ ] Valid graphId
- [ ] Invalid graphId (404)
- [ ] Malformed UUID (400)

---

## Testing Status Summary

- [ ] All ML endpoints tested
- [ ] All backend endpoints tested
- [ ] Error handling verified
- [ ] Performance benchmarks documented
- [ ] CORS configured correctly
- [ ] Request validation working

---

## Notes

- ML service must be running on port 8000
- Backend service must be running on port 3000
- Both services should handle graceful shutdown
- Log all requests for debugging
- Add request IDs for tracing

---

## Future Endpoints (Phase 2+)

These will be added later:
- `POST /api/organize/upload` - File upload
- `PATCH /api/organize/graphs/:graphId/nodes/:nodeId` - Edit node
- `POST /api/organize/graphs/:graphId/merge` - Merge nodes
- `DELETE /api/organize/graphs/:graphId/edges/:edgeId` - Delete edge
- `GET /api/organize/graphs/:graphId/export` - Export graph
