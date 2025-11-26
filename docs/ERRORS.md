# Error Log - Really Nicca ML Service

**Purpose:** Centralized error tracking and resolution documentation  
**Last Updated:** 2025-11-26  
**Status:** Active

---

## Table of Contents

- [Active Errors](#active-errors)
- [Resolved Errors](#resolved-errors)
- [Error Categories](#error-categories)
- [Prevention Guidelines](#prevention-guidelines)

---

### ERR-017: Gemini API Key Not Loading in ML Service

**Status:** 🔴 Active
**Severity:** High
**Reported:** 2025-11-26
**Category:** ML Service - Configuration

**Description:**
The Gemini API key (`GEMINI_API_KEY`) appears to not be loading correctly in the ML service, causing all Gemini-dependent features to fail silently. This affects:
- Relationship type classification (all default to "related_to")
- Entity extraction enhancement
- Embedding generation

**Symptoms:**
- Text extraction works but relationships show generic "related_to" type
- Browser-based extraction works correctly (suggests timing/loading issue)
- API-based extraction fails
- Very fast processing times (~1s instead of expected 10-15s)
- No Gemini API calls visible in logs

**Root Cause (Suspected):**
The `.env` file exists with `GEMINI_API_KEY` set, but the ML service may not be loading it correctly, causing `GeminiClient` to initialize with `model=None`.

**Impact:**
- ❌ Relationship classification non-functional
- ❌ Advanced entity extraction disabled
- ⚠️ Basic entity extraction still works (spaCy only)

**Next Steps:**
1. Add debug endpoint to verify API key loading
2. Check ML service startup logs for "GeminiClient initialized successfully"
3. Consider hardcoding API key temporarily to isolate issue
4. Add fallback behavior when Gemini is unavailable

---

### ERR-016: Multiple Server Instances Causing Conflicts

**Status:** ✅ Resolved
**Severity:** Medium
**Reported:** 2025-11-26
**Resolved:** 2025-11-26
**Category:** Deployment/DevOps

**Description:**
During end-to-end testing, discovered 6 Python processes and 2 Node.js backend processes running simultaneously, causing port conflicts and inconsistent behavior.

**Error Message:**
```
ML service unavailable after 3 attempts: Request failed with status code 500
```

**Root Cause:**
Multiple instances of services running from previous development sessions:
- Frontend: 1 instance (correct)
- Backend: 2 instances (duplicate)
- ML Service: 3 instances (too many)

**Resolution:**
Terminated all processes and restarted clean single instances:
```powershell
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```
Then started one instance of each service.

**Prevention:**
- Always check for running processes before starting new instances
- Use process managers that handle restarts automatically
- Add health check endpoints to verify correct instance is responding

---

### ERR-015: Embedding Vector Format Bug - TypeError in Similarity Calculation

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-26
**Resolved:** 2025-11-26
**Category:** ML Service - Embedding Generation

**Description:**
File upload endpoint consistently failed with 500 error. ML service crashed with `TypeError` when calculating cosine similarity between entity embeddings during deduplication.

**Error Message:**
```python
File "app/shared/utils/similarity.py", line 77, in <genexpr>
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
                      ~~^~~
TypeError: can't multiply sequence by non-int of type 'list'
```

**Root Cause:**
The `embedding_service.py` was incorrectly extracting embeddings from the Gemini API response. Instead of extracting flat 768-dimensional vectors, it was storing nested list structures, causing the dot product calculation to fail.

**Affected Code:**
`services/ml-service/app/features/organize/services/embedding_service.py` lines 54-76

**Resolution:**
Rewrote embedding extraction logic to properly handle Gemini API response formats:
```python
if hasattr(response, 'embedding'):
    results[i] = response.embedding  # Extract from object attribute
elif isinstance(response, dict) and 'embedding' in response:
    results[i] = response['embedding']  # Extract from dict
elif isinstance(response, list):
    # Handle batch responses
    for j, emb_obj in enumerate(response):
        if hasattr(emb_obj, 'embedding'):
            results[i + j] = emb_obj.embedding
        # ... additional format handling
```

**Additional Changes:**
- Increased backend ML client timeout from 30s to 120s to accommodate Gemini API processing time
- Added detailed error logging to backend ML client

**Testing:**
- ✅ Direct ML service calls work correctly
- ⚠️ File upload still has issues (likely related to ERR-017)

**Impact:**
- Fixed TypeError crash
- Enabled proper embedding-based entity deduplication
- Improved error visibility with enhanced logging

---

## Resolved Errors


### ERR-013: ML Service 500 Error - Invalid Model Name

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-25
**Resolved:** 2025-11-25
**Category:** ML Service - Configuration

**Description:**
After updating the ML service to improve relationship classification, the extraction endpoint started returning `500 Internal Server Error`. This occurred because the Gemini model name was incorrectly specified as `gemini-2.5-flash` (which does not exist or is inaccessible) instead of `gemini-1.5-flash`.

**Error Message:**
Frontend received `500 Internal Server Error`.
ML Service logs (inferred): `404 Not Found` or similar from Google GenAI API.

**Root Cause:**
Typo/Invalid model name in `GeminiClient` initialization:
```python
self.model = genai.GenerativeModel('gemini-2.5-flash')
```

**Resolution:**
Corrected the model name to the standard `gemini-1.5-flash`:
```python
self.model = genai.GenerativeModel('gemini-1.5-flash')
```
Also improved prompt construction safety in `gemini_client.py`.

**Result:**
✅ Extraction works successfully
✅ Relationship types are correctly classified (e.g., "founded", "located_in")

### ERR-014: Stale ML Service Instances

**Status:** ✅ Resolved
**Severity:** Medium
**Reported:** 2025-11-25
**Resolved:** 2025-11-25
**Category:** Deployment/DevOps

**Description:**
Despite applying fixes to the ML service code, the frontend continued to show old behavior (generic "related_to" relationships). Investigation revealed multiple instances of the Python ML service running simultaneously.

**Root Cause:**
Previous `python start.py` commands were not terminated before starting new ones, leading to "zombie" processes serving outdated code.

**Resolution:**
Terminated all Python processes using `taskkill /F /IM python.exe` and restarted a single instance of the ML service.

**Prevention:**
Always ensure the previous service instance is stopped before starting a new one, or use a process manager that handles restarts automatically.

---

### ERR-012: Backend TypeScript Module Error - pdf-parse

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-25
**Resolved:** 2025-11-25
**Category:** Backend - TypeScript Configuration

**Description:**
After implementing Stage 10.2 backend file upload with pdf-parse library, the backend server failed to start with a TypeScript compilation error. The server would crash immediately on startup with diagnostic code 7016.

**Error Message:**
```
[nodemon] app crashed - waiting for file changes before starting...
Error: Cannot find module 'pdf-parse' or its corresponding type declarations.
  diagnosticCodes: [ 7016 ]
```

**Root Cause:**
The `pdf-parse` npm package does not include TypeScript type definitions (@types/pdf-parse doesn't exist). When using ES6 import syntax (`import pdfParse from 'pdf-parse'`), TypeScript couldn't resolve the module types, causing compilation to fail.

**Resolution:**
Changed from ES6 import to CommonJS require syntax in `file-parser.service.ts`:

```typescript
// Before (failed):
import pdfParse from 'pdf-parse';

// After (works):
const pdfParse = require('pdf-parse');
```

This allows TypeScript to compile successfully while still having access to the pdf-parse functionality at runtime.

**Result:**
✅ Backend server starts successfully
✅ TypeScript compilation passes
✅ PDF parsing functionality works correctly
✅ File upload endpoint operational

**Prevention:**
- Check for TypeScript definitions before importing npm packages
- Use `require()` for packages without TypeScript support
- Consider creating custom `.d.ts` files only when necessary
- Test backend startup after adding new dependencies

**Related Files:**
- `services/backend/src/features/organize/services/file-parser.service.ts`
- `services/backend/src/pdf-parse.d.ts` (attempted fix, not needed with require)

**Alternative Considered:**
Created custom type declarations in `pdf-parse.d.ts`, but this wasn't sufficient. The require() approach is simpler and more reliable for CommonJS modules without TypeScript support.

---

### ERR-011: Frontend API Response Parsing Error

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-25
**Resolved:** 2025-11-25
**Category:** Frontend - API Integration

**Description:**
When pasting text into the frontend and clicking "Extract Knowledge Graph", the application threw an error: `"Cannot read properties of undefined (reading 'graphId')"`. This prevented the knowledge graph from being displayed after successful extraction.

**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'graphId')
    at OrganizeApiClient.extractGraph (api-client.ts:59)
```

**Root Cause:**
The frontend API client (`api-client.ts`) was trying to access `response.data.meta.graphId`, but the backend actually returns the response in a different structure:
```json
{
  "success": true,
  "graphId": "...",
  "graph": {...},
  "metadata": {...}
}
```

The API client was incorrectly accessing the nested path when it should have been accessing the root-level properties.

**Resolution:**
Updated `services/frontend/src/features/organize/services/api-client.ts`:

```typescript
// Before (incorrect):
async extractGraph(text: string): Promise<ExtractResponse> {
  const response: AxiosResponse<Graph> = await this.client.post('/extract', { text });
  return {
    graphId: response.data.meta.graphId || 'unknown',  // ❌ Wrong path
    graph: response.data
  };
}

// After (correct):
async extractGraph(text: string): Promise<ExtractResponse> {
  const response: AxiosResponse<any> = await this.client.post('/extract', { text });
  return {
    graphId: response.data.graphId || 'unknown',  // ✅ Correct path
    graph: response.data.graph
  };
}
```

**Result:**
✅ Text paste functionality works perfectly
✅ Knowledge graph displays correctly after extraction
✅ File upload also working (uses same API endpoint)

**Prevention:**
- Review backend API response structure before implementing frontend client
- Add TypeScript interfaces that match actual backend responses
- Test API integration early with actual backend responses
- Consider adding response validation/schema checking

**Related Files:**
- `services/frontend/src/features/organize/services/api-client.ts`
- `services/backend/src/features/organize/controllers/extract.controller.ts`

---

### ERR-010: Frontend CSS Not Loading (Tailwind Directives Missing)

**Status:** ✅ Resolved
**Severity:** Critical
**Reported:** 2025-11-25
**Resolved:** 2025-11-25
**Category:** Frontend - Build Configuration

**Description:**
The frontend application loaded without any CSS styling. The page appeared completely unstyled with no colors, fonts, or layouts applied. This made the application completely unusable.

**Error Message:**
No explicit error in console, but visual inspection showed:
- No Tailwind utility classes being applied
- Missing custom CSS variables
- Broken layout and typography

**Root Cause:**
During implementation of the shimmer animation for the progress bar, the `@tailwind` directives were accidentally removed from `services/frontend/src/styles/global.css`. The file was edited to add animation keyframes, but the critical Tailwind directives at the top of the file were deleted:

```css
/* Missing from global.css: */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Without these directives, Vite's PostCSS processor couldn't inject Tailwind's utility classes, resulting in no CSS being generated.

**Resolution:**
Restored the complete `global.css` file with all necessary content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", ...;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  color: #333;
}

/* ... rest of styles ... */

/* Animations */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

**Result:**
✅ Vite hot-reloaded the changes immediately
✅ All Tailwind utility classes working
✅ Custom CSS variables and styles restored
✅ Application fully styled and usable

**Prevention:**
- Always verify the complete file structure when making edits
- Be cautious when replacing large sections of CSS files
- Use version control to quickly identify and revert breaking changes
- Test visual appearance after CSS changes
- Consider using CSS modules or separate files for animations to avoid touching critical base files

**Related Files:**
- `services/frontend/src/styles/global.css`
- `services/frontend/vite.config.ts` (PostCSS/Tailwind configuration)
- `services/frontend/tailwind.config.js` (Tailwind configuration)

---

### ERR-007: Integration Test Connection Refused

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-23
**Resolved:** 2025-11-23
**Category:** Test Infrastructure

**Description:**
Integration tests failed with `error.response` undefined because the test runner attempted to execute tests before the backend and ML services were fully started and listening on their respective ports.

**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'status')
    at tests/integration/e2e-graph-extraction.test.ts:75:29
```
(And general failure to connect to localhost:3000)

**Root Cause:**
Race condition: `npm run test:integration` was executed immediately after `npm run dev` without waiting for the server to be ready.

**Resolution:**
Created a launch script (`scripts/run-e2e-tests.ts`) that:
1. Starts Backend and ML services as child processes.
2. Polls `/health` endpoints until both return 200 OK.
3. Executes tests only after services are healthy.

**Prevention:**
- Always use a test runner/orchestrator that waits for services.
- Implement health checks for all services.
- Do not rely on `&` or parallel execution without wait conditions in CI/CD or test scripts.

**Related Files:**
- `services/backend/scripts/run-e2e-tests.ts`
- `services/backend/tests/integration/e2e-graph-extraction.test.ts`

---

### ERR-008: Nodemon Restart Loop (ECONNRESET)

**Status:** ✅ Resolved
**Severity:** High
**Reported:** 2025-11-23
**Resolved:** 2025-11-23
**Category:** Dev Environment

**Description:**
Requests to the backend failed with `ECONNRESET` during graph extraction. This happened because the backend saves generated graphs to `data/graphs/`, and `nodemon` (watching `*.*`) detected the file change and restarted the server *mid-request*.

**Error Message:**
```
AxiosError: read ECONNRESET
code: 'ECONNRESET'
```
(And in backend logs: `[nodemon] restarting due to changes...`)

**Root Cause:**
Default `nodemon` configuration watched the entire project directory, including the `data/` folder where output files are written.

**Resolution:**
Created `nodemon.json` to explicitly ignore the `data/` and `uploads/` directories:
```json
{
  "ignore": ["data/*", "uploads/*"]
}
```

**Prevention:**
- Always configure file watchers to ignore output/data directories.
- Use specific watch paths (e.g., `src/`) instead of `.` where possible.

**Related Files:**
- `services/backend/nodemon.json`

---

### ERR-009: Short Text Validation Missing

**Status:** ✅ Resolved
**Severity:** Low
**Reported:** 2025-11-24
**Resolved:** 2025-11-24
**Category:** Input Validation

**Description:**
Integration test "should reject text that is too short" was failing because the backend accepted very short text (e.g., "Hi") instead of rejecting it with a 400 error.

**Error Message:**
```
TypeError: Cannot read properties of undefined
Expected 400 error for short text, got 200 OK
```

**Root Cause:**
The `validateText` method in `text-processor.service.ts` did not check for minimum text length, only for empty text and maximum length.

**Resolution:**
Added minimum length validation of 10 characters:
```typescript
if (cleaned.length < 10) {
  return { valid: false, error: 'Text must be at least 10 characters long' };
}
```

**Prevention:**
- Always include minimum and maximum bounds in validation logic
- Write integration tests for edge cases before implementation

**Related Files:**
- `services/backend/src/features/organize/services/text-processor.service.ts`
- `services/backend/tests/integration/e2e-graph-extraction.test.ts`

**Test Result:**
✅ All 7 integration tests now pass

---

### ERR-006: TypeScript Type Predicate Error - Graph Builder Service

**Status:** ✅ Resolved  
**Severity:** Medium  
**Reported:** 2025-11-23  
**Resolved:** 2025-11-23  
**Category:** TypeScript Type System

**Description:**
TypeScript compilation failed in `graph-builder.service.ts` due to type predicate incompatibility in the filter function when mapping ML relationships to Graph edges.

**Error Message:**
```
error TS2677: A type predicate's type must be assignable to its parameter's type.
Type 'Relationship' is not assignable to type '{ id: string; sourceId: string; targetId: string; 
type: any; relationType: string; weight: number; confidence: number; examples: string[]; } | null'.
```

**Root Cause:**
The `.filter((edge): edge is Relationship => edge !== null)` type predicate was incompatible with the union type `(Relationship | null)[]` produced by the `.map()` function. TypeScript's strict type checking couldn't properly narrow the type.

**Resolution:**
Replaced the `.map().filter()` chain with a simple `for` loop that uses `continue` to skip invalid relationships:

```typescript
// Before (error):
const edges: Relationship[] = mlRelationships
  .map(rel => {
    // ... create edge or return null
  })
  .filter((edge): edge is Relationship => edge !== null);

// After (fixed):
const edges: Relationship[] = [];
for (const rel of mlRelationships) {
  const sourceId = entityIdMap.get(rel.sourceEntity);
  const targetId = entityIdMap.get(rel.targetEntity);
  
  if (!sourceId || !targetId) {
    console.warn(`Skipping relationship...`);
    continue;
  }
  
  edges.push({ /* edge object */ });
}
```

**Result:**
TypeScript compilation successful, all tests passing.

**Prevention:**
- Use simpler control flow (for loops) when dealing with complex type predicates
- Avoid chaining `.map().filter()` with type predicates on union types
- Test TypeScript compilation early when working with complex types

**Related Files:**
- `services/backend/src/features/organize/services/graph-builder.service.ts`

---

### ERR-001: Pytest Collection Error - test_entity_extractor.py

**Status:** ✅ Resolved  
**Severity:** Low  
**Reported:** 2025-11-23  
**Resolved:** 2025-11-23  
**Category:** Test Infrastructure

**Description:**
Pytest failed to collect `tests/unit/organize/test_entity_extractor.py` when running full test suite due to namespace conflict with similarly named files in other directories.

**Error Message:**
```
ERROR tests/unit/organize/test_entity_extractor.py
imported module 'test_entity_extractor' has this __file__ attribute
```

**Root Cause:**
Pytest module import conflict. Multiple files with similar names (`test_entity_extractor.py`, `test_entity_extractor_spacy_only.py`, `test_entity_extractor_with_llm.py`) in different test directories caused namespace collision during collection.

**Resolution:**
Renamed file to avoid conflict:
```bash
Move-Item "tests/unit/organize/test_entity_extractor.py" "tests/unit/organize/test_entity_extraction_basic.py"
```

**Result:**
All 71 tests now passing (100% success rate).

**Prevention:**
- Use unique, descriptive test file names
- Avoid generic names like `test_entity_extractor.py` when similar files exist
- Follow naming convention: `test_<feature>_<specific_aspect>.py`

**Related Files:**
- `tests/unit/organize/test_entity_extraction_basic.py` (renamed)
- `tests/unit/organize/test_entity_extractor_spacy_only.py`
- `tests/unit/organize/test_entity_extractor_with_llm.py`
- `tests/features/organize/services/test_entity_extractor.py`

---

### ERR-002: UTF-16 Encoding - Test Output Files

**Status:** ✅ Resolved  
**Severity:** High  
**Reported:** 2025-11-23  
**Resolved:** 2025-11-23  
**Category:** File Encoding

**Description:**
Files `test_output_ml.txt` and `test_output.txt` were created with UTF-16 encoding (BOM: `FF FE`), causing pytest to fail during test collection.

**Error Message:**
```
ERROR test_output_ml.txt - UnicodeDecodeError: 'utf-8' codec can't decode byte 0xf...
```

**Root Cause:**
PowerShell's default encoding created UTF-16 files instead of UTF-8. Pytest attempted to collect these as test files.

**Resolution:**
```bash
Remove-Item -Path "test_output_ml.txt", "test_output.txt" -Force
```

**Prevention:**
- Add `test_output*.txt` to `.gitignore`
- Use explicit UTF-8 encoding when creating files programmatically
- Keep test directories clean of non-test files

**Related Documentation:**
- `services/ml-service/docs/TEST_ERROR_RESOLUTION.md`

---

### ERR-003: Empty Test Files - Corrupted During Creation

**Status:** ✅ Resolved  
**Severity:** High  
**Reported:** 2025-11-23  
**Resolved:** 2025-11-23  
**Category:** File Corruption

**Description:**
Test files `test_embedding_service.py` and `test_entity_extractor.py` became empty/corrupted during file operations.

**Error Message:**
```
ERROR tests/unit/organize/test_embedding_service.py
ERROR tests/unit/organize/test_entity_extractor.py
```

**Root Cause:**
Failed write operations or encoding issues during file creation/modification.

**Resolution:**
Recreated files with proper UTF-8 encoding:
- `test_entity_extractor.py` - 3 tests for basic entity extraction
- `test_embeddings.py` - 3 tests for embedding service

**Prevention:**
- Verify file contents after write operations
- Use atomic file operations
- Implement file integrity checks

---

### ERR-004: Mock Implementation Mismatch - EmbeddingService

**Status:** ✅ Resolved  
**Severity:** Medium  
**Reported:** 2025-11-23  
**Resolved:** 2025-11-23  
**Category:** Test Implementation

**Description:**
Test mocks for `EmbeddingService` did not match actual implementation, causing `TypeError: object of type 'NoneType' has no len()`.

**Error Message:**
```
TypeError: object of type 'NoneType' has no len()
tests/unit/organize/test_embeddings.py::TestEmbeddingService::test_generate_embeddings_success
```

**Root Cause:**
Initial mock was patching `genai.EmbedContentModel.from_pretrained`, but actual implementation uses `GeminiClient._call_with_retry`.

**Resolution:**
Updated mock to properly patch `GeminiClient`:

```python
@pytest.fixture
def mock_gemini_client(self):
    with patch("app.features.organize.services.embedding_service.GeminiClient") as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = MagicMock()
        yield mock_instance

def test_generate_embeddings_success(self, mock_gemini_client):
    mock_gemini_client._call_with_retry.return_value = [
        [0.1] * 768,
        [0.2] * 768
    ]
    # ... rest of test
```

**Prevention:**
- Review source code before writing mocks
- Test mocks individually before integration
- Keep mocks aligned with implementation changes

---

### ERR-005: FastAPI/Starlette Version Incompatibility

**Status:** ✅ Resolved  
**Severity:** High  
**Reported:** 2025-11-22  
**Resolved:** 2025-11-22  
**Category:** Dependency Management

**Description:**
`TestClient` from `fastapi.testclient` failed to initialize due to version mismatch between FastAPI and Starlette.

**Error Message:**
```
RuntimeError: The starlette.testclient module requires ...
```

**Root Cause:**
Incompatible versions of `fastapi` and `starlette` packages.

**Resolution:**
```bash
pip install --upgrade fastapi starlette httpx
```

**Prevention:**
- Pin dependency versions in `requirements.txt`
- Use virtual environments
- Test after dependency updates

---

## Error Categories

### 1. File Encoding Issues
- **ERR-002:** UTF-16 encoding in test files
- **ERR-003:** Corrupted/empty test files

**Common Causes:**
- PowerShell default encoding (UTF-16)
- Failed write operations
- Encoding mismatches

**Prevention:**
- Always specify UTF-8 encoding
- Verify file contents after creation
- Use `.gitignore` for temporary files

---

### 2. Test Infrastructure
- **ERR-001:** Pytest collection errors
- **ERR-004:** Mock implementation mismatches

**Common Causes:**
- Namespace conflicts
- Pytest caching issues
- Mock/implementation drift

**Prevention:**
- Clear naming conventions
- Regular cache clearing
- Review mocks during refactoring

---

### 3. Dependency Management
- **ERR-005:** Package version conflicts

**Common Causes:**
- Incompatible package versions
- Missing dependencies
- Environment inconsistencies

**Prevention:**
- Pin versions in requirements.txt
- Use virtual environments
- Document dependency changes

---

## Prevention Guidelines

### File Operations
1. **Always use UTF-8 encoding**
   ```python
   with open(file, 'w', encoding='utf-8') as f:
       f.write(content)
   ```

2. **Verify file contents**
   ```python
   # After write
   assert os.path.exists(file)
   assert os.path.getsize(file) > 0
   ```

3. **Keep directories clean**
   - Add temporary files to `.gitignore`
   - Regular cleanup of test artifacts

### Test Development
1. **Review implementation before mocking**
   - Check actual method signatures
   - Verify call patterns
   - Test mocks individually

2. **Clear pytest cache regularly**
   ```bash
   python -m pytest --cache-clear
   ```

3. **Use descriptive test names**
   - Avoid naming conflicts
   - Follow conventions: `test_<feature>_<scenario>.py`

### Dependency Management
1. **Pin versions**
   ```
   fastapi==0.104.1
   starlette==0.27.0
   ```

2. **Document changes**
   - Update `requirements.txt`
   - Note breaking changes
   - Test after updates

3. **Use virtual environments**
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

---

## Error Reporting Template

When reporting new errors, use this template:

```markdown
### ERR-XXX: [Brief Description]

**Status:** 🔴 Active / 🟡 In Progress / ✅ Resolved  
**Severity:** Critical / High / Medium / Low  
**Reported:** YYYY-MM-DD  
**Category:** [Category Name]

**Description:**
[Detailed description of the error]

**Error Message:**
```
[Exact error message]
```

**Root Cause:**
[Analysis of why the error occurred]

**Impact:**
- [Impact on functionality]
- [Impact on development]

**Resolution:**
[Steps taken to resolve, or current status]

**Prevention:**
[How to prevent this error in the future]

**Related Files:**
- [List of affected files]
```

---

## Quick Reference

### Test Suite Status
- **Total Tests:** 71
- **Passing:** 71 (100% ✅)
- **Active Issues:** 0

### Common Commands
```bash
# Run all tests
python -m pytest -v

# Clear cache
python -m pytest --cache-clear

# Run specific test file
python -m pytest tests/unit/organize/test_entity_extraction_basic.py -v

# Verbose output with traceback
python -m pytest -vv --tb=short
```

---

**Maintained By:** Development Team  
**Review Frequency:** Weekly  
**Last Review:** 2025-11-23
