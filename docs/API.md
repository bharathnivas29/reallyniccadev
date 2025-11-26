# API Documentation

**Last Updated:** 2025-11-26  
**Version:** 1.0.0

This document is the single source of truth for the Really Nicca API, detailing all endpoints for both the Backend (Node.js) and ML Service (Python).

---

## Table of Contents
- [Backend API](#backend-api)
  - [Health Check](#health-check)
  - [Extract Graph from Text](#extract-graph-from-text)
  - [Upload File and Extract](#upload-file-and-extract)
  - [List All Graphs](#list-all-graphs)
  - [Get Specific Graph](#get-specific-graph)
- [ML Service API](#ml-service-api)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Integration Examples](#integration-examples)

---

## Backend API

**Base URL:** `http://localhost:3000`  
**Technology:** Node.js + Express + TypeScript

### Health Check

**Endpoint:** `GET /health`

Check if the backend service is running.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### Extract Graph from Text

**Endpoint:** `POST /api/organize/extract`

Extracts a knowledge graph from raw text using the ML pipeline.

**Request Body:**
```json
{
  "text": "string (required, min 10 chars, max 100,000 chars)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "graphId": "uuid-string",
  "graph": {
    "nodes": [
      {
        "id": "uuid",
        "label": "Alan Turing",
        "type": "PERSON",
        "aliases": [],
        "confidence": 0.95,
        "importance": 0.85,
        "sources": [
          {
            "docId": "string",
            "snippet": "Alan Turing invented...",
            "chunkIndex": 0
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "uuid",
        "sourceId": "uuid",
        "targetId": "uuid",
        "type": "cooccurrence",
        "relationType": "INVENTED",
        "weight": 0.85,
        "confidence": 0.90,
        "examples": ["Alan Turing invented the Turing machine..."]
      }
    ],
    "meta": {
      "graphId": "uuid-string",
      "createdAt": "2025-11-26T12:00:00.000Z",
      "updatedAt": "2025-11-26T12:00:00.000Z"
    }
  },
  "metadata": {
    "processingTimeMs": 8349,
    "textLength": 150,
    "chunkCount": 1,
    "entityCount": 25,
    "relationshipCount": 300
  }
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Bad Request",
  "message": "Text must be at least 10 characters long"
}
```

500 Internal Server Error:
```json
{
  "error": "Internal Server Error",
  "message": "Extraction failed: [error details]"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Albert Einstein developed the theory of relativity in 1905."}'
```

---

### Upload File and Extract

**Endpoint:** `POST /api/organize/upload`

Uploads a file (PDF, DOCX, TXT), extracts text, and generates a knowledge graph.

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file`: File to upload (required)

**Supported File Types:**
- `application/pdf` (PDF)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `text/plain` (TXT)

**Max File Size:** 10MB

**Response (200 OK):**
Same structure as Extract Graph endpoint.

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Bad Request",
  "message": "No file uploaded"
}
```

413 Payload Too Large:
```json
{
  "error": "Payload Too Large",
  "message": "File size exceeds 10MB limit"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/organize/upload \
  -F "file=@document.pdf"
```

---

### List All Graphs

**Endpoint:** `GET /api/organize/graphs`

Retrieves a list of all saved knowledge graphs with metadata.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "graphs": [
    {
      "graphId": "uuid-string",
      "createdAt": "2025-11-26T12:00:00.000Z",
      "nodeCount": 25,
      "edgeCount": 300
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/organize/graphs
```

---

### Get Specific Graph

**Endpoint:** `GET /api/organize/graphs/:graphId`

Retrieves a specific knowledge graph by ID.

**Parameters:**
- `graphId` (path parameter): UUID of the graph

**Response (200 OK):**
```json
{
  "success": true,
  "graph": {
    "nodes": [...],
    "edges": [...],
    "meta": {...}
  }
}
```

**Error Responses:**

404 Not Found:
```json
{
  "error": "Not Found",
  "message": "Graph with ID 'xxx' not found"
}
```

**Example:**
```bash
curl http://localhost:3000/api/organize/graphs/550e8400-e29b-41d4-a716-446655440000
```

---

## ML Service API

**Base URL:** `http://localhost:8000`  
**Technology:** Python + FastAPI  
**Note:** These endpoints are consumed by the Backend, not directly by the Frontend.

### Extract Entities and Relationships

**Endpoint:** `POST /organize/extract`

The core ML pipeline for entity extraction, deduplication, and relationship building.

**Request Body:**
```json
{
  "docId": "unique-document-id",
  "textChunks": [
    "Alan Turing invented the Turing machine in 1936.",
    "The Turing machine laid the foundation for modern computer science."
  ]
}
```

**Response (200 OK):**
```json
{
  "entities": [
    {
      "name": "Alan Turing",
      "type": "PERSON",
      "confidence": 0.95,
      "sources": [
        {
          "chunkIndex": 0,
          "snippet": "Alan Turing invented..."
        }
      ],
      "aliases": []
    }
  ],
  "relationships": [
    {
      "sourceEntity": "Alan Turing",
      "targetEntity": "Turing machine",
      "type": "cooccurrence",
      "relationType": "INVENTED",
      "weight": 0.85,
      "confidence": 0.90,
      "examples": ["Alan Turing invented the Turing machine..."]
    }
  ]
}
```

### Pipeline Stages

The ML service processes text through 5 stages:

1. **Entity Extraction** (Hybrid)
   - spaCy: Fast syntactic extraction
   - Gemini 2.0 Flash Lite: Semantic enhancement
   - Model: `gemini-2.0-flash-lite-preview-02-05`

2. **Embedding Generation**
   - Model: `text-embedding-004`
   - Dimensions: 768
   - Batch size: 10

3. **Deduplication**
   - Multi-signal matching (string similarity + embeddings)
   - Thresholds: String ≥ 0.85, Semantic ≥ 0.90

4. **Relationship Building**
   - Co-occurrence analysis
   - Weight = shared_chunks / min(count_A, count_B)
   - Minimum weight: 0.3

5. **Relationship Classification** (Top 20)
   - Gemini-powered semantic classification
   - Types: FOUNDED, INVENTED, LOCATED_IN, etc.
   - Optimized: Only top 20 relationships classified to prevent timeouts

---

## Data Types

### Entity
```typescript
interface Entity {
  id: string;                    // UUID
  label: string;                 // Canonical name
  type: EntityType;              // PERSON | ORGANIZATION | CONCEPT | DATE | LOCATION | PAPER
  aliases: string[];             // Alternative names
  confidence: number;            // 0.0 to 1.0
  importance?: number;           // 0.0 to 1.0 (degree centrality)
  sources: Array<{
    docId: string;
    snippet: string;
    chunkIndex: number;
  }>;
}
```

### Relationship
```typescript
interface Relationship {
  id: string;                    // UUID
  sourceId: string;              // Entity UUID
  targetId: string;              // Entity UUID
  type: string;                  // "cooccurrence" | "explicit" | "semantic"
  relationType?: string;         // "INVENTED" | "FOUNDED" | "LOCATED_IN" | "related_to"
  weight: number;                // 0.0 to 1.0 (strength)
  confidence: number;            // 0.0 to 1.0 (certainty)
  examples: string[];            // Text snippets showing the relationship
}
```

### Graph
```typescript
interface Graph {
  nodes: Entity[];
  edges: Relationship[];
  meta: {
    graphId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input (empty text, too short, too long, missing fields) |
| 404 | Not Found | Requested graph does not exist |
| 413 | Payload Too Large | File exceeds 10MB |
| 500 | Internal Server Error | Server error during processing |
| 503 | Service Unavailable | ML service is not available |

### Common Error Messages

**Text Validation:**
- `"Text must be a non-empty string"`
- `"Text is empty after cleaning"`
- `"Text must be at least 10 characters long"`
- `"Text exceeds maximum length of 100,000 characters"`

**File Upload:**
- `"No file uploaded"`
- `"Unsupported file type"`
- `"File size exceeds 10MB limit"`

**Processing:**
- `"Extraction failed: [details]"`
- `"ML service unavailable"`
- `"Failed to save graph"`

---

## Performance

### Expected Response Times
| Text Size | Expected Time |
|-----------|---------------|
| < 200 chars | < 5 seconds |
| 200-1000 chars | < 15 seconds |
| 1000-5000 chars | < 30 seconds |

### Metrics
- **Text Extraction**: ~1-4 seconds
- **Full Pipeline (with Gemini)**: ~8-10 seconds
- **Timeout**: 120 seconds (2 minutes)
- **Typical Entity Count**: 20-40 per document
- **Typical Relationship Count**: 100-500 per document

---

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function extractGraph(text) {
  try {
    const response = await axios.post('http://localhost:3000/api/organize/extract', {
      text: text
    });
    return response.data;
  } catch (error) {
    console.error('Extraction failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const result = await extractGraph('Einstein developed relativity.');
console.log(`Extracted ${result.graph.nodes.length} entities`);
```

### Python
```python
import requests

def extract_graph(text):
    url = 'http://localhost:3000/api/organize/extract'
    response = requests.post(url, json={'text': text})
    response.raise_for_status()
    return response.json()

# Usage
result = extract_graph('Einstein developed relativity.')
print(f"Extracted {len(result['graph']['nodes'])} entities")
```

### cURL with File Upload
```bash
# Upload PDF
curl -X POST http://localhost:3000/api/organize/upload \
  -F "file=@research-paper.pdf"

# Upload DOCX
curl -X POST http://localhost:3000/api/organize/upload \
  -F "file=@notes.docx"
```

---

## Environment Variables

### Backend (.env)
```
PORT=3000
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)
```
GEMINI_API_KEY=your-api-key-here
```

---

## Rate Limits & Quotas

- **Gemini API**: Subject to Google's API quotas
- **File Upload**: 10MB max per file
- **Text Input**: 100,000 characters max
- **Concurrent Requests**: No hard limit (depends on server resources)

---

## Troubleshooting

### Issue: Connection Refused
**Cause**: Backend service not running  
**Solution**: Start backend with `npm run start` or `npm run dev`

### Issue: Timeout
**Cause**: Text too large or ML service slow  
**Solution**: Reduce text size or check ML service health at `http://localhost:8000/health`

### Issue: Empty Graph
**Cause**: Text too short or no recognizable entities  
**Solution**: Ensure text is at least 10 characters and contains meaningful content

### Issue: File Upload Fails
**Cause**: Unsupported file type or file too large  
**Solution**: Ensure file is PDF/DOCX/TXT and under 10MB

---

## Notes

- The ML service uses Gemini 2.0 Flash Lite for optimal performance
- Relationship classification is limited to top 20 relationships to prevent timeouts
- All Gemini features (entity extraction, embeddings, classification) are currently enabled
- File uploads are automatically cleaned up after processing
- Graphs are stored as JSON files in `data/graphs/`

---

**For more details:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [ALGORITHMS.md](ALGORITHMS.md) - Algorithm details
- [DEVELOPMENT.md](Development_Framework.md) - Development guide
