# DocuMind AI — System Architecture Specification

## 1. Architectural Philosophy

DocuMind AI is engineered as a **Modular Monolith** backend paired with a high-performance single-page application frontend. This design guarantees clean separation of concerns, high maintainability, robust transactional consistency in MySQL, and low operational complexity without premature microservice fragmentation.

```mermaid
flowchart TD
    User["End User / Browser"] --> ReverseProxy["Nginx Reverse Proxy"]
    ReverseProxy -->|Static Assets| Frontend["React + TypeScript SPA"]
    ReverseProxy -->|API Requests| Backend["Django REST API Modular Monolith"]
    
    Backend --> RelationalDB[("MySQL Primary Database")]
    Backend --> TaskQueue[("Redis Broker & Cache")]
    Backend --> VectorDB[("Qdrant Vector Engine")]
    Backend --> ObjectStore[("MinIO / S3 Document Store")]
    
    TaskQueue --> Worker["Celery Ingestion Worker"]
    Worker --> ObjectStore
    Worker --> VectorDB
    Worker --> RelationalDB
```

---

## 2. Component Specifications

### 2.1 Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS utilizing a custom dark SaaS design system with slate and brand teal accents.
- **State Management**:
  - `Zustand`: Global state stores (`authStore`, `workspaceStore`) for lightweight, decoupled reactive state.
  - `TanStack Query`: Server state caching, background refetching, and query invalidation.
- **Routing**: `React Router v6` with protected route layouts (`AppLayout` vs `AuthLayout`).

### 2.2 Backend Architecture
- **Framework**: Python 3.11+ / Django 5.0 with Django REST Framework (DRF).
- **Authentication**: JWT-based authentication using `rest_framework_simplejwt` with automatic token rotation and blacklist enforcement.
- **Tenant Isolation**: Every incoming request extracts the authenticated user from the token. Workspace membership is validated at the database layer before allowing query access or mutations.

### 2.3 Storage & Ingestion Pipeline
1. **Multipart Upload**: Document is validated for MIME type, extension (`.pdf`, `.docx`, `.txt`), and file size (`MAX_UPLOAD_SIZE_MB`).
2. **Object Storage**: Stored in MinIO S3 bucket or local media cache under a deterministic UUID storage key.
3. **Asynchronous Processing**: `process_document_pipeline` Celery task extracts text page-by-page using `PyMuPDF`.
4. **Chunking**: `DocumentChunker` splits text preserving exact page numbers, character start/end offsets, and chunk indices.
5. **Vector Indexing**: Chunks are embedded via `SentenceTransformers` (`all-MiniLM-L6-v2`) and upserted to Qdrant with tenant-filtered payload metadata.
6. **Relational Synchronization**: `DocumentChunkMetadata` records are stored in MySQL to allow fast relational querying of document structure.

---

## 3. Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant API as Django REST API
    participant Celery as Celery Worker
    participant MySQL
    participant Qdrant
    participant MinIO

    User->>Frontend: Uploads Research Paper (PDF)
    Frontend->>API: POST /api/v1/documents/ (Multipart)
    API->>MinIO: Save File with Unique Storage Key
    API->>MySQL: Create Document Record (status='PENDING')
    API->>Celery: Enqueue process_document_pipeline(document_id)
    API-->>Frontend: 201 Created (Document Object)
    
    Note over Celery: Asynchronous Processing
    Celery->>MinIO: Fetch File Stream
    Celery->>Celery: PyMuPDF Text Extraction & Page Chunking
    Celery->>Celery: Generate 384-d Vector Embeddings
    Celery->>Qdrant: Upsert Points with Workspace & Owner Filter Payload
    Celery->>MySQL: Save DocumentChunkMetadata & update status='INDEXED'
    
    User->>Frontend: Ask Grounded Question
    Frontend->>API: POST /api/v1/rag/query/
    API->>Qdrant: Vector Search (filtered by workspace_id & owner_id)
    Qdrant-->>API: Return Top-K Chunks with Page Provenance
    API->>API: Rerank & Grounding Prompt Construction
    API->>API: LLM Generates Response with [Title, Page X]
    API-->>Frontend: Grounded Answer + Verified Citations
```
