# Testing Guidelines

## 🚫 Critical Rules (To Prevent Known Errors)

### 1. Naming Conventions (Prevents Namespace Conflicts)
**NEVER** use generic names that might be duplicated in other directories.
*   ❌ Bad: `test_utils.py`, `test_entity_extractor.py`, `test_routes.py`
*   ✅ Good: `test_gemini_utils.py`, `test_entity_extraction_basic.py`, `test_organize_routes.py`

**Why?** Pytest flat namespace can cause collisions if two files have the same name, even in different folders.

### 2. File Encoding (Prevents Unicode Errors)
**ALWAYS** ensure files are saved as **UTF-8**.
*   **PowerShell Users:** Do NOT use `> output.txt` as it creates UTF-16 files by default.
*   **Python:** Always use `encoding='utf-8'` when opening files.

### 3. Mocking
**ALWAYS** mock the *wrapper* class, not the internal library, unless testing the wrapper itself.
*   If `EmbeddingService` uses `GeminiClient`, mock `GeminiClient`, not `google.generativeai`.

## Running Tests

Run all tests from the `services/ml-service` directory:
```bash
python -m pytest -v
```

## Directory Structure
*   `tests/features/`: Integration tests for specific features.
*   `tests/unit/`: Unit tests for individual components.
