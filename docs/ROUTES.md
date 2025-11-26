# API Routes Documentation

## Overview
The Really Nicca Knowledge Graph Extraction Engine provides a RESTful API for extracting knowledge graphs from text. This document describes all available endpoints, request/response formats, and error codes.

**Base URL**: `http://localhost:3000`

---

## Table of Contents
- [Health Check](#health-check)
- [Extract Graph](#extract-graph)
- [Get Graph](#get-graph)
- [List Graphs](#list-graphs)
- [Error Codes](#error-codes)

---

## Health Check

### GET `/health`

Check if the backend service is running.

**Response**
```json
{
  "status": "ok"
}
```

**Example**
```bash
curl http://localhost:3000/health
```

---

## Extract Graph

### POST `/api/organize/extract`

Extract a knowledge graph from input text.

**Request Body**
```json
{
  "text": "string (required, min 10 chars, max 100,000 chars)"
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "graphId": "uuid",
  "graph": {
    "nodes": [
      {
        "id": "uuid",
        "label": "Entity Name",
        "type": "PERSON | ORGANIZATION | CONCEPT | DATE | PAPER | LOCATION",
        "aliases": ["Alternative Name 1", "Alternative Name 2"],
        "confidence": 0.85,
        "importance": 0.75,
        "sources": [
          {
            "docId": "string",
            "snippet": "...context around entity...",
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
        "type": "cooccurrence | semantic | explicit",
        "relationType": "related_to | works_at | authored | etc",
        "weight": 0.75,
        "confidence": 0.7,
        "examples": ["Example sentence 1", "Example sentence 2"]
      }
    ],
    "metadata": {
      "createdAt": "2025-11-24T00:00:00.000Z",
      "sourceText": "Original input text...",
      "processingTimeMs": 3500,
      "textLength": 150,
      "chunkCount": 1,
      "entityCount": 5,
      "relationshipCount": 10
    }
  }
}
```

**Error Responses**

400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Text must be at least 10 characters long"
}
```

500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Extraction failed: [error details]"
}
```

**Examples**

Simple extraction:
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Albert Einstein developed the theory of relativity."}'
```

Complex extraction:
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Google, Microsoft, and Apple are leading technology companies. They compete in cloud computing, AI, and consumer electronics. Sundar Pichai leads Google while Satya Nadella runs Microsoft."
  }'
```

---

## Get Graph

### GET `/api/organize/graphs/:graphId`

Retrieve a previously generated graph by its ID.

**Parameters**
- `graphId` (path parameter): UUID of the graph

**Response** (200 OK)
```json
{
  "success": true,
  "graph": {
    "nodes": [...],
    "edges": [...],
    "metadata": {...}
  }
}
```

**Error Responses**

404 Not Found
```json
{
  "error": "Not Found",
  "message": "Graph not found"
}
```

**Example**
```bash
curl http://localhost:3000/api/organize/graphs/550e8400-e29b-41d4-a716-446655440000
```

---

## List Graphs

### GET `/api/organize/graphs`

List all stored graphs with metadata.

**Response** (200 OK)
```json
{
  "success": true,
  "graphs": [
    {
      "id": "uuid",
      "createdAt": "2025-11-24T00:00:00.000Z",
      "nodeCount": 5,
      "edgeCount": 10,
      "textLength": 150
    }
  ]
}
```

**Example**
```bash
curl http://localhost:3000/api/organize/graphs
```

---

## Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input (empty text, too short, too long, missing fields) |
| 404 | Not Found | Requested graph does not exist |
| 500 | Internal Server Error | Server error during processing |
| 503 | Service Unavailable | ML service is not available |

### Common Error Messages

**Text Validation Errors**
- `"Text must be a non-empty string"`
- `"Text is empty after cleaning"`
- `"Text must be at least 10 characters long"`
- `"Text exceeds maximum length of 100,000 characters"`

**Processing Errors**
- `"Extraction failed: [details]"`
- `"ML service unavailable"`
- `"Failed to save graph"`

---

## Rate Limiting

Currently, there are no rate limits. This may change in production.

---

## Performance

### Expected Response Times
| Text Size | Expected Time |
|-----------|---------------|
| < 200 chars | < 5 seconds |
| 200-1000 chars | < 15 seconds |
| 1000-5000 chars | < 30 seconds |

### Optimization Tips
1. Keep text concise and focused
2. Remove unnecessary whitespace
3. Split very large documents into smaller chunks

---

## Entity Types

| Type | Description | Examples |
|------|-------------|----------|
| PERSON | People, historical figures | "Albert Einstein", "Marie Curie" |
| ORGANIZATION | Companies, institutions | "Google", "MIT", "United Nations" |
| CONCEPT | Abstract ideas, technologies | "Machine Learning", "Quantum Computing" |
| DATE | Dates, time periods | "2024", "21st century" |
| PAPER | Publications, documents | "Theory of Relativity", "Nature Paper" |
| LOCATION | Places, geographical entities | "California", "New York", "Europe" |

---

## Relationship Types

| Type | Description | Examples |
|------|-------------|----------|
| related_to | Generic relationship (default) | Any co-occurring entities |
| works_at | Employment relationship | "Person works_at Organization" |
| founded | Founding relationship | "Person founded Organization" |
| authored | Authorship | "Person authored Paper" |
| located_in | Location relationship | "Organization located_in Location" |

**Note**: Currently, most relationships are labeled as `related_to`. Specific relationship typing is being improved.

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

### cURL with JSON file
```bash
# Save text to file
echo '{"text":"Your long text here..."}' > input.json

# Extract graph
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d @input.json \
  > output.json

# View results
cat output.json | jq '.graph.nodes | length'
```

---

## Troubleshooting

### Issue: Connection Refused
**Cause**: Backend service not running  
**Solution**: Start backend with `npm run dev`

### Issue: Timeout
**Cause**: Text too large or ML service slow  
**Solution**: Reduce text size or check ML service health at `http://localhost:8000/health`

### Issue: Empty Graph
**Cause**: Text too short or no recognizable entities  
**Solution**: Ensure text is at least 10 characters and contains meaningful content

### Issue: Generic Relationships Only
**Cause**: Relationship typing is still being improved  
**Solution**: This is expected behavior. Specific relationship types coming in future updates.

---

## Changelog

### v0.1.0 (2025-11-24)
- Initial API release
- POST `/api/organize/extract` endpoint
- GET `/api/organize/graphs/:graphId` endpoint
- GET `/api/organize/graphs` endpoint
- Entity extraction with spaCy + Gemini
- Embedding-based deduplication
- Co-occurrence relationship detection

---

## Support

For issues or questions:
- Check `docs/ERRORS.md` for common errors and solutions
- Review `docs/TESTING_PROTOCOL.md` for testing procedures
- See `docs/ALGORITHMS.md` for implementation details
