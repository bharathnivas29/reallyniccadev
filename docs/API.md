# API Documentation

**Last Updated:** November 26, 2025  
**Version:** 1.0.0

This document serves as the single source of truth for the Really Nicca API. It details all active endpoints for both the Node.js Backend and the Python ML Service.

---

## 1. Backend API (Node.js)

**Base URL:** `http://localhost:3000/api`  
**Technology:** Express.js + TypeScript

### A. Organize Module (`/organize`)

#### 1. Extract Graph from Text
Extracts a knowledge graph from raw text using the ML pipeline.

- **Endpoint:** `POST /api/organize/extract`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "text": "Alan Turing invented the Turing machine in 1936..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "graphId": "uuid-string",
    "graph": {
      "nodes": [
        {
          "id": "1",
          "label": "Alan Turing",
          "type": "PERSON",
          "aliases": [],
          "confidence": 0.95,
          "sources": [
            {
              "chunkIndex": 0,
              "snippet": "Alan Turing invented..."
            }
          ]
        }
      ],
      "edges": [
        {
          "id": "e1",
          "sourceId": "1",
          "targetId": "2",
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
      "processingTime": 8349,
      "entityCount": 25,
      "relationshipCount": 300
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Missing or invalid text
  - `500 Internal Server Error`: ML service failure

---

#### 2. Upload File and Extract Graph
Uploads a file (PDF, DOCX, TXT), extracts text, and generates a knowledge graph.

- **Endpoint:** `POST /api/organize/upload`
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `file`: File to upload (PDF, DOCX, or TXT)
- **Supported File Types:**
  - `application/pdf` (PDF)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
  - `text/plain` (TXT)
- **Max File Size:** 10MB
- **Response (200 OK):**
  Same structure as Extract Graph endpoint
- **Errors:**
  - `400 Bad Request`: No file uploaded or unsupported file type
  - `413 Payload Too Large`: File exceeds 10MB
  - `500 Internal Server Error`: File parsing or ML service failure

---

#### 3. List All Graphs
Retrieves a list of all saved knowledge graphs.

- **Endpoint:** `GET /api/organize/graphs`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "uuid-string",
      "createdAt": "2025-11-26T12:00:00.000Z",
      "nodeCount": 25,
      "edgeCount": 300,
      "metadata": {}
    }
  ]
  ```

---

#### 4. Get Specific Graph
Retrieves a specific knowledge graph by ID.

- **Endpoint:** `GET /api/organize/graphs/:graphId`
- **Response (200 OK):**
  Returns the full `Graph` object (same structure as Extract response)
- **Errors:**
  - `404 Not Found`: Graph ID does not exist

---

## 2. ML Service API (Python/FastAPI)

**Base URL:** `http://localhost:8000`  
**Technology:** FastAPI + Python  
**Note:** These endpoints are consumed by the Backend, not the Frontend directly.

### A. Extraction Pipeline (`/organize/extract`)

#### 1. Extract Graph
The core ML pipeline for entity extraction, deduplication, and relationship building.

- **Endpoint:** `POST /organize/extract`
- **Request Body:**
  ```json
  {
    "docId": "unique-document-id",
    "textChunks": [
      "Alan Turing invented the Turing machine in 1936.",
      "The Turing machine laid the foundation for modern computer science."
    ]
  }
  ```
- **Response (200 OK):**
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

---

### Pipeline Stages (ML Service)

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
   - Merges similar entities

4. **Relationship Building**
   - Co-occurrence analysis
   - Weight calculation based on shared chunks

5. **Relationship Classification** (Top 20)
   - Gemini-powered semantic classification
   - Types: FOUNDED, INVENTED, LOCATED_IN, etc.
   - Optimized: Only top 20 relationships classified

---

## 3. Data Types

### Entity
```typescript
interface Entity {
  id: string;
  label: string;
  type: 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'DATE' | 'LOCATION' | 'PAPER';
  aliases: string[];
  confidence: number; // 0.0 to 1.0
  sources: Array<{
    chunkIndex: number;
    snippet: string;
  }>;
}
```

### Relationship
```typescript
interface Relationship {
  id: string;
  sourceId: string; // Entity ID
  targetId: string; // Entity ID
  type: string; // "cooccurrence" | "explicit" | "semantic"
  relationType: string; // "FOUNDED" | "INVENTED" | "LOCATED_IN" | "related_to" etc.
  weight: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  examples: string[]; // Text snippets showing the relationship
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

## 4. Performance Metrics

- **Text Extraction**: ~1-4 seconds
- **Full Pipeline (with Gemini)**: ~8-10 seconds
- **Timeout**: 120 seconds (2 minutes)
- **Typical Entity Count**: 20-40 per document
- **Typical Relationship Count**: 100-500 per document

---

## 5. Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP Status Codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server or ML service failure

---

## 6. Environment Variables

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

## 7. Rate Limits & Quotas

- **Gemini API**: Subject to Google's API quotas
- **File Upload**: 10MB max per file
- **Concurrent Requests**: No hard limit (depends on server resources)

---

## Notes

- The ML service uses Gemini 2.0 Flash Lite for optimal performance
- Relationship classification is limited to top 20 relationships to prevent timeouts
- All Gemini features (entity extraction, embeddings, classification) are currently enabled
- File uploads are automatically cleaned up after processing
