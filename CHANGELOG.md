# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-11-26

### Added

- **Core Pipeline**: Implemented hybrid entity extraction using spaCy and Gemini.
- **Frontend**: Interactive graph visualization with Cytoscape.js.
- **Backend**: Express server for handling file uploads and orchestration.
- **ML Service**: FastAPI service for NLP and LLM processing.
- **Features**:
  - Multi-format document upload (PDF, Text).
  - Entity deduplication and resolution.
  - Relationship detection and classification.
  - Graph export capabilities.

### Changed
- **Code Consistency Overhaul**:
  - **Logging**: Standardized Winston logger (Backend), conditional logging (Frontend), Python logging (ML).
  - **Linting**: Enforced ESLint, Prettier, Flake8, Black, MyPy across all services.
  - **Type Safety**: Unified shared types and removed duplicates.
  - **Standardization**: Converted default exports to named exports.
