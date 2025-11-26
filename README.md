# Really Nicca - Knowledge Graph Extraction & Visualization

**Really Nicca** is a knowledge graph extraction and visualization tool that transforms unstructured text into interactive, meaningful knowledge graphs using hybrid ML techniques (spaCy + Google Gemini).

## 🎯 Current Status

**Phase 2: UI & Productization** (In Progress)

✅ **Completed**:
- Hybrid entity extraction (spaCy + Gemini)
- Multi-signal deduplication
- Relationship detection and classification
- Backend API with file upload support
- Interactive graph visualization (React + Cytoscape.js)
- File processing (PDF, DOCX, TXT)

🚧 **In Progress**:
- Manual graph editing features
- Advanced export formats
- Multi-document graph merging

## 🚀 Features

### Core Capabilities
- **Multi-Format Input**: Upload PDF, DOCX, TXT files or paste text directly
- **Intelligent Entity Extraction**:
  - Hybrid pipeline combining spaCy (fast) + Gemini (accurate)
  - Supports: PERSON, ORGANIZATION, CONCEPT, DATE, LOCATION, PAPER
  - 80%+ precision on test datasets
- **Advanced Deduplication**: Merges similar entities using string similarity, semantic embeddings, and abbreviation detection
- **Relationship Detection**: Co-occurrence analysis + optional LLM classification
- **Interactive Visualization**: 
  - Force-directed graph layout with Cytoscape.js
  - Zoom, pan, node/edge inspection
  - Filter by confidence and entity type
- **Export**: JSON graph format (CSV and image export coming soon)

## 🛠️ Tech Stack

### Monorepo Structure
```
services/
├── backend/          # Node.js + Express + TypeScript
├── frontend/         # React + Vite + Cytoscape.js
└── ml-service/       # Python + FastAPI + spaCy + Gemini

packages/
└── types/            # Shared TypeScript types
```

### Technologies
- **Backend**: Node.js 18+, Express, TypeScript, Winston (logging)
- **Frontend**: React 18, Vite, Cytoscape.js, Tailwind CSS
- **ML Service**: Python 3.10+, FastAPI, spaCy, Google Gemini API
- **Storage**: JSON files (Neo4j integration planned)

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm
- Python 3.10+
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/really-nicca.git
   cd really-nicca
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up ML Service**
   ```bash
   cd services/ml-service
   python -m venv venv
   
   # Windows
   .\\venv\\Scripts\\activate
   # Linux/Mac
   # source venv/bin/activate
   
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   cd ../..
   ```

4. **Configure environment variables**
   ```bash
   # Root .env
   cp .env.example .env
   
   # ML Service .env
   cp services/ml-service/.env.example services/ml-service/.env
   # Add your GEMINI_API_KEY
   ```

## 🏃 Running the Application

### Development Mode

**Terminal 1 - ML Service:**
```bash
cd services/ml-service
# Activate venv first
python start.py
# Runs on http://localhost:8000
```

**Terminal 2 - Backend:**
```bash
cd services/backend
npm run start
# Runs on http://localhost:3000
```

**Terminal 3 - Frontend:**
```bash
cd services/frontend
npm run dev
# Runs on http://localhost:5173
```

### Quick Start (All Services)
```bash
# From root directory
pnpm dev:all
```

## 📖 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and data flow
- **[API.md](docs/API.md)** - API endpoints and examples
- **[DEVELOPMENT.md](docs/Development_Framework.md)** - Coding standards and workflows
- **[ALGORITHMS.md](docs/ALGORITHMS.md)** - Core algorithms explained
- **[ORGANIZE_FEATURES.md](docs/ORGANIZE_FEATURES.md)** - Feature specifications

## 🧪 Testing

```bash
# Backend tests
cd services/backend
npm test

# ML Service tests
cd services/ml-service
pytest

# Frontend tests
cd services/frontend
npm test
```

## 🎨 Usage

1. Open http://localhost:5173 in your browser
2. Upload a document (PDF, DOCX, or TXT) or paste text
3. Wait for processing (10-30 seconds depending on size)
4. Explore the interactive knowledge graph
5. Export as JSON for further use

## 📊 Performance

- **100-word text**: < 5 seconds
- **1000-word text**: < 15 seconds
- **5000-word text**: < 30 seconds
- **Entity precision**: ≥ 80%
- **Entity recall**: ≥ 70%

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Project Specification](docs/PROJECT_SPEC.md)
- [Tasks & Roadmap](TASKS.md)
- [Changelog](CHANGELOG.md)

---

**Last Updated**: 2025-11-26  
**Current Phase**: Phase 2 - UI & Productization  
**Status**: Active Development
