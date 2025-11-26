# Really Nicca - Knowledge Graph Visualization Engine

**Really Nicca** is a powerful, user-friendly knowledge graph visualization tool designed to transform unstructured text into interactive, meaningful knowledge graphs. It combines the accuracy of LLMs (Gemini) with the speed of traditional NLP (spaCy) to deliver a superior graph extraction and exploration experience.

## 🚀 Features

- **Multi-Format Input**: Upload PDF, Word, Text, or URLs directly.
- **Intelligent Entity Extraction**:
  - **Hybrid Pipeline**: Combines spaCy (fast) and Google Gemini (accurate) for 90%+ precision.
  - **Context-Aware**: Distinguishes between concepts like "Apple" (company) and "Apple" (fruit).
- **Advanced Deduplication**: Merges duplicate entities (e.g., "AI" and "Artificial Intelligence") using fuzzy matching and semantic similarity.
- **Rich Relationship Detection**: Identifies specific relationship types (e.g., `is_a`, `causes`, `uses`) rather than just generic links.
- **Interactive Visualization**: Force-directed graph layout with zooming, panning, and node details.
- **Community Detection**: Automatically clusters related concepts using the Louvain algorithm.
- **Search & Filter**: Powerful tools to find entities and filter by confidence, frequency, or type.

## 🛠️ Tech Stack

This project is a monorepo managed with `pnpm`.

- **Frontend**: React, Vite, Cytoscape.js, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **ML Service**: Python, FastAPI, spaCy, Google Gemini API

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- pnpm
- Python (v3.10+)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/really-nicca.git
   cd really-nicca
   ```

2. **Install Node.js dependencies**

   ```bash
   pnpm install
   ```

3. **Install Python dependencies**

   ```bash
   cd services/ml-service
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   # source venv/bin/activate
   pip install -r requirements.txt
   cd ../..
   ```

4. **Environment Variables**

   - Copy `.env.example` to `.env` in the root and service directories.
   - Configure your API keys (e.g., `GEMINI_API_KEY`).

## 🏃‍♂️ Running the App

You can run the services individually or together.

**Backend:**

```bash
pnpm dev:backend
```

**ML Service:**

```bash
# Ensure venv is activated
cd services/ml-service
python start.py
```

**Frontend:**

```bash
cd services/frontend
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
