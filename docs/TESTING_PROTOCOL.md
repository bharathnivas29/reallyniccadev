# Manual Testing Protocol

## Overview
This document provides step-by-step manual testing procedures for the Really Nicca Knowledge Graph Extraction Engine. Use this protocol to verify system functionality, accuracy, and performance.

---

## Prerequisites

### Services Running
```bash
# Terminal 1: ML Service
cd services/ml-service
python start.py

# Terminal 2: Backend Service
cd services/backend
npm run dev
```

### Health Check
```bash
# Backend health
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# ML Service health
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"ml-service"}
```

---

## Test Case 1: Single Entity Text

### Input
```json
{
  "text": "Albert Einstein was a theoretical physicist who developed the theory of relativity."
}
```

### Expected Output
- **Entities**: 2-3 entities
  - "Albert Einstein" (PERSON)
  - "theory of relativity" or "relativity" (CONCEPT)
- **Relationships**: At least 1 relationship (Einstein → relativity)
- **Graph Structure**: Valid JSON with nodes and edges

### Execution
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Albert Einstein was a theoretical physicist who developed the theory of relativity."}'
```

### Verification Checklist
- [ ] Response status: 200
- [ ] `success: true`
- [ ] Graph contains "Albert Einstein" entity
- [ ] Graph contains relativity-related entity
- [ ] At least 1 edge exists
- [ ] All nodes have valid UUIDs
- [ ] Response time < 10 seconds

---

## Test Case 2: Multiple Entities, Same Type

### Input
```json
{
  "text": "Google, Microsoft, and Apple are leading technology companies. Amazon and Meta are also major players in the tech industry."
}
```

### Expected Output
- **Entities**: 5 organizations (Google, Microsoft, Apple, Amazon, Meta)
- **Entity Type**: All should be ORGANIZATION
- **Relationships**: Multiple co-occurrence relationships
- **Deduplication**: No duplicate entities

### Execution
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Google, Microsoft, and Apple are leading technology companies. Amazon and Meta are also major players in the tech industry."}'
```

### Verification Checklist
- [ ] 5 distinct organization entities
- [ ] All entities have type "ORGANIZATION"
- [ ] Multiple relationships detected
- [ ] No duplicate nodes
- [ ] Response time < 15 seconds

---

## Test Case 3: Aliases (Deduplication Test)

### Input
```json
{
  "text": "AI is transforming industries. Artificial Intelligence has many applications. A.I. systems are becoming more sophisticated. Machine learning and AI are related fields."
}
```

### Expected Output
- **Entities**: 1-2 entities (AI variants should be merged)
- **Aliases**: "AI", "A.I.", "Artificial Intelligence" should be aliases of the canonical entity
- **Deduplication**: Embedding-based merging should work

### Execution
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"AI is transforming industries. Artificial Intelligence has many applications. A.I. systems are becoming more sophisticated. Machine learning and AI are related fields."}'
```

### Verification Checklist
- [ ] AI variants merged into 1-2 entities max
- [ ] Canonical entity has aliases array populated
- [ ] "Machine learning" is separate entity
- [ ] Relationship between AI and ML exists
- [ ] Response time < 15 seconds

---

## Test Case 4: Large Text (5000 words)

### Input
Use the sample text from `docs/sample-5000-words.txt` (create if needed, or use a Wikipedia article)

### Expected Output
- **Entities**: 50-200 entities (depending on content)
- **Relationships**: 100-500 relationships
- **Performance**: Completes within 30 seconds
- **Memory**: No crashes or timeouts

### Execution
```bash
# Save large text to file first
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d @docs/sample-5000-words.json
```

### Verification Checklist
- [ ] Request completes successfully
- [ ] Response time < 30 seconds
- [ ] Graph contains 50+ entities
- [ ] Graph contains 100+ relationships
- [ ] No server crashes
- [ ] Memory usage stays reasonable (< 2GB)

---

## Test Case 5: Error Handling

### Test 5.1: Empty Text
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":""}'
```
**Expected**: 400 error, message about text being too short

### Test 5.2: Very Short Text
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi"}'
```
**Expected**: 400 error, message about minimum length

### Test 5.3: Missing Text Field
```bash
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected**: 400 error, message about missing required field

### Verification Checklist
- [ ] All invalid inputs return 400 status
- [ ] Error messages are descriptive
- [ ] No server crashes
- [ ] Errors are logged properly

---

## Performance Benchmarks

### Measurement Setup
Use the following script to measure performance:

```bash
# Create benchmark script
cat > benchmark.sh << 'EOF'
#!/bin/bash
echo "Running performance benchmarks..."

# Test 1: Small text (100 words)
echo "Test 1: Small text"
time curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"'$(head -c 500 docs/sample-text.txt)'"}'

# Test 2: Medium text (1000 words)
echo "Test 2: Medium text"
time curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d @docs/medium-text.json

# Test 3: Large text (5000 words)
echo "Test 3: Large text"
time curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d @docs/large-text.json
EOF

chmod +x benchmark.sh
./benchmark.sh
```

### Expected Performance
| Text Size | Expected Time | Max Entities | Max Relationships |
|-----------|---------------|--------------|-------------------|
| 100 words | < 5 seconds   | 10-20        | 5-15              |
| 1000 words| < 15 seconds  | 50-100       | 50-150            |
| 5000 words| < 30 seconds  | 100-300      | 200-600           |

### Verification Checklist
- [ ] Small text: < 5 seconds
- [ ] Medium text: < 15 seconds
- [ ] Large text: < 30 seconds
- [ ] No memory leaks (check with `htop` or Task Manager)
- [ ] CPU usage returns to baseline after request

---

## Memory Usage Monitoring

### Linux/Mac
```bash
# Monitor backend
ps aux | grep node

# Monitor ML service
ps aux | grep python
```

### Windows
```powershell
# Monitor processes
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*"} | Select-Object ProcessName, WorkingSet
```

### Expected Memory Usage
- **Backend Service**: 100-300 MB
- **ML Service**: 500-1500 MB (due to spaCy and Gemini models)

### Verification Checklist
- [ ] Backend memory < 500 MB
- [ ] ML service memory < 2 GB
- [ ] No memory growth over multiple requests
- [ ] Memory is released after requests complete

---

## Graph Quality Verification

### Manual Inspection
1. Save a graph response to `test-graph.json`
2. Open in a JSON viewer or text editor
3. Verify:
   - [ ] All nodes have unique IDs
   - [ ] All edges reference valid node IDs
   - [ ] Entity types are correct (PERSON, ORGANIZATION, CONCEPT, etc.)
   - [ ] Confidence scores are between 0 and 1
   - [ ] Relationship weights are between 0 and 1
   - [ ] Source snippets are present and relevant

### Example Verification
```bash
# Extract and save
curl -X POST http://localhost:3000/api/organize/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Einstein developed relativity."}' \
  > test-graph.json

# Verify structure
cat test-graph.json | jq '.graph.nodes | length'  # Count nodes
cat test-graph.json | jq '.graph.edges | length'  # Count edges
cat test-graph.json | jq '.graph.nodes[0]'        # Inspect first node
```

---

## Integration Test Suite

### Run Automated Tests
```bash
cd services/backend
npm run test:integration
```

### Expected Output
```
PASS tests/integration/e2e-graph-extraction.test.ts
  E2E Graph Extraction Integration Tests
    ✓ should extract entities from simple text
    ✓ should extract and type technical entities
    ✓ should detect relationships between entities
    ✓ should merge similar entities
    ✓ should reject empty text
    ✓ should reject text that is too short
    ✓ should reject missing text field

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

### Verification Checklist
- [ ] All 7 tests pass
- [ ] No test timeouts
- [ ] No flaky tests (run 3 times to verify)

---

## Accuracy Evaluation

### Run Evaluation Script
```bash
cd services/backend
npm run accuracy:evaluate
```

### Expected Output
```
✅ Accuracy evaluation completed. Report written to accuracy_evaluation_report.md
```

### Review Report
Open `accuracy_evaluation_report.md` and verify:
- [ ] Entity Precision ≥ 70%
- [ ] Entity Recall ≥ 70%
- [ ] Entity F1 ≥ 70%
- [ ] Relationship extraction is working (even if accuracy is low)

---

## Troubleshooting

### Issue: Connection Refused
**Symptoms**: `ECONNREFUSED` errors  
**Solution**: Ensure both services are running on correct ports (3000 and 8000)

### Issue: Timeout Errors
**Symptoms**: Requests take > 30 seconds  
**Solution**: Check ML service logs, verify Gemini API key is valid

### Issue: Empty Graph
**Symptoms**: No entities or relationships extracted  
**Solution**: Check text length (must be > 10 chars), verify ML service is healthy

### Issue: Nodemon Restart Loop
**Symptoms**: Backend keeps restarting during requests  
**Solution**: Verify `nodemon.json` ignores `data/` and `uploads/` directories

---

## Test Completion Checklist

### All Test Cases
- [ ] Test Case 1: Single Entity - PASSED
- [ ] Test Case 2: Multiple Entities - PASSED
- [ ] Test Case 3: Aliases/Deduplication - PASSED
- [ ] Test Case 4: Large Text (5000 words) - PASSED
- [ ] Test Case 5: Error Handling - PASSED

### Performance
- [ ] All requests complete in < 30 seconds
- [ ] Memory usage is acceptable
- [ ] No crashes or undefined behavior

### Quality
- [ ] Integration tests pass (7/7)
- [ ] Accuracy evaluation shows ≥ 70% entity F1
- [ ] Graph structure is valid and meaningful

### Documentation
- [ ] All test results documented
- [ ] Performance benchmarks recorded
- [ ] Any issues logged in `ERRORS.md`

---

## Sign-Off

**Tester Name**: ___________________  
**Date**: ___________________  
**Result**: ☐ PASS  ☐ FAIL  
**Notes**: ___________________
