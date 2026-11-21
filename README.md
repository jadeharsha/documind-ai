# DocuMind AI 🧠📄
### Intelligent Document Understanding, Research and Agentic Knowledge Platform

DocuMind AI is a production-grade, modular, scalable SaaS platform that transforms documents (PDF, DOCX, TXT) into queryable, structured knowledge. Powered by LangGraph agents, semantic/hybrid vector retrieval via Qdrant, asynchronous task processing via Celery & Redis, and a modern React + TypeScript interface.

---

## 🌟 Key Features

- **Document Ingestion & Multi-Format Parsing**: PyMuPDF, python-docx, OCR-ready architecture, structured chunking with page-level citation metadata.
- **Agentic Knowledge & LangGraph Orchestration**: Autonomous agent workflows with plan-and-solve, web search tool integration, self-reflection, and multi-step execution.
- **RAG & Hybrid Retrieval**: Dense vector embeddings paired with Qdrant, semantic search, metadata-filtered workspace queries, and grounded LLM synthesis.
- **Multi-Document Comparison & Contradiction Detection**: Side-by-side analysis, difference matrix extraction, and cross-document verification.
- **Automated Research & Synthesis**: Deep literature analysis, methodology extraction, research gap discovery, and executive report generation.
- **Structured Extraction & Evaluation**: Table and key-value extraction, automated quiz and flashcard generation with active recall tracking.
- **Enterprise-Grade SaaS Architecture**: Workspace multi-tenancy, JWT authentication, granular RBAC, audit logging, rate limiting, and MinIO/S3 object storage.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React, Recharts |
| **Backend** | Python 3.11+, Django 5.x, Django REST Framework, Pydantic, Celery |
| **Databases** | MySQL (Relational metadata, users, audits) & Qdrant (High-performance vector store) |
| **Queue & Cache** | Redis 7 |
| **Storage** | MinIO (Local) / AWS S3 (Production) |
| **AI / Orchestration** | LangGraph, LangChain, HuggingFace Sentence Transformers, Ollama / OpenAI / Anthropic abstractions |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- Python 3.11 or higher (or [uv](https://github.com/astral-sh/uv))
- Node.js 18+ and npm
- Docker & Docker Compose (optional, for full containerized stack)

---

### Option A: Running with Docker Compose (Recommended for Full Stack)

Run the complete stack (MySQL, Redis, Qdrant, MinIO, Backend, Celery, Frontend, Nginx):

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and launch all containers
docker-compose up --build -d

# 3. View running services
docker-compose ps
```

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000/api/v1/
- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **MinIO Console**: http://localhost:9001 (User: `documind_minio_admin`, Pass: `documind_minio_secret_2026`)

---

### Option B: Running Locally (Step-by-Step)

#### 1. Backend Setup

Open a terminal in the project root:

```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
# python -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements/dev.txt

# Run database migrations (uses SQLite by default for instant local setup)
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver 8000
```
Backend API will be live at: **http://127.0.0.1:8000/api/v1/**

#### 2. Celery Worker (Optional for background ingestion in dev)

In a separate terminal with virtual environment activated:
```powershell
cd backend
celery -A config worker --loglevel=info
```

#### 3. Frontend Setup

Open a new terminal window:

```powershell
# Navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be live at: **http://localhost:5173/**

---

## 🧪 Testing

### Backend Test Suite
```powershell
cd backend
python manage.py test tests
```

### Frontend Build & Lint Check
```powershell
cd frontend
npm run build
```

---

## 📁 Repository Structure

```
documind-ai/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # User auth, JWT, profiles, API keys
│   │   ├── workspaces/      # Multi-tenant workspace isolation
│   │   ├── documents/       # Document metadata and upload management
│   │   ├── ingestion/       # Text extraction, chunking, OCR, Celery tasks
│   │   ├── embeddings/      # Vector generation abstraction
│   │   ├── retrieval/       # Qdrant client, hybrid and semantic search
│   │   ├── rag/             # Grounded Q&A, citation engine
│   │   ├── conversations/   # Chat sessions and messages
│   │   ├── agent/           # LangGraph multi-step autonomous agent
│   │   ├── summaries/       # Recursive & hierarchical summarization
│   │   ├── comparison/      # Cross-document comparison & contradiction detector
│   │   ├── research/        # Research paper gap analysis & synthesis
│   │   ├── extraction/      # Structured entity & table extraction
│   │   ├── quizzes/         # Dynamic quiz generation & grading
│   │   ├── flashcards/      # Flashcard generation with spaced repetition
│   │   ├── analytics/       # System metrics & usage tracking
│   │   ├── billing/         # Tier subscription enforcement
│   │   └── audit/           # Security audit logs
│   ├── config/              # Django settings, URLs, Celery setup
│   └── tests/               # Backend integration and unit test suite
├── frontend/
│   ├── src/
│   │   ├── features/        # Feature-driven UI modules (Chat, Agent, Summaries, etc.)
│   │   ├── components/      # Reusable UI component library
│   │   ├── layouts/         # App layouts, Navigation sidebar, headers
│   │   ├── pages/           # Route views
│   │   ├── services/        # Axios API client integrations
│   │   └── stores/          # Zustand global state (Auth, Workspace, etc.)
├── docs/                    # Complete architectural and system documentation
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── AI_ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
├── infrastructure/          # Dockerfiles and Nginx configurations
└── docker-compose.yml       # Production-ready container orchestration
```

---

## 🛡️ Security & Privacy

- All document access strictly enforces workspace tenant boundaries at database query level.
- Multi-factor API key authentication and secure JWT with rotation.
- Strict input validation with Pydantic and Django REST Framework serializers.
- Non-root container execution in production Docker images.

---

## 📄 License
This project is licensed under the MIT License.
