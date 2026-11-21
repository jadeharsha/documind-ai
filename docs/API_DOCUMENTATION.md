# DocuMind AI — REST API Documentation

Base URL: `/api/v1`

All requests except registration and login require an `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.

---

## 1. Authentication Endpoints

### Register Account
- **Endpoint**: `POST /auth/register/`
- **Request Body**:
```json
{
  "email": "researcher@university.edu",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "first_name": "Harsha",
  "last_name": "Vardhan"
}
```
- **Response** (201 Created):
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "c1f7a0b3-...",
    "email": "researcher@university.edu",
    "full_name": "Harsha Vardhan"
  },
  "tokens": {
    "access": "eyJ0eXAi...",
    "refresh": "eyJhbGci..."
  }
}
```

### Sign In
- **Endpoint**: `POST /auth/login/`
- **Request Body**:
```json
{
  "email": "researcher@university.edu",
  "password": "SecurePassword123!"
}
```

### Current User
- **Endpoint**: `GET /auth/me/`
- **Response** (200 OK): User details, active profile, and personalized settings.

---

## 2. Workspaces Endpoints

### List & Create Workspaces
- `GET /workspaces/`: List accessible workspaces for the authenticated tenant.
- `POST /workspaces/`: Create a new workspace.
```json
{
  "name": "Generative AI Lab",
  "description": "Multi-agent research and document evaluation"
}
```

### Workspace Details & Members
- `GET /workspaces/{id}/`: Retrieve workspace details, member counts, and active documents.
- `DELETE /workspaces/{id}/`: Permanently delete workspace and cascade its resources.
- `GET /workspaces/{id}/members/`: List workspace members.
- `POST /workspaces/{id}/members/`: Invite a member by email (`{"user_email": "colleague@uni.edu", "role": "MEMBER"}`).

---

## 3. Documents Endpoints

### List & Upload Documents
- `GET /documents/?workspace_id={id}&status={status}&search={term}`
- `POST /documents/` (Multipart Form-Data):
  - `file`: Binary file (`.pdf`, `.docx`, `.txt`)
  - `workspace_id`: UUID
  - `title`: Optional custom display title

### Document Details & Deletion
- `GET /documents/{id}/`: Returns document metadata, page count, chunk count, processing latency.
- `DELETE /documents/{id}/`: Cascades deletion across MinIO storage, Qdrant vectors, and MySQL chunk records.
- `GET /documents/{id}/chunks/`: Returns chunks with page numbers and character boundaries.

---

## 4. Grounded RAG & Chat Endpoints

### Grounded Question Query
- **Endpoint**: `POST /rag/query/`
- **Request Body**:
```json
{
  "query": "What are the primary benchmark results reported on page 5?",
  "workspace_id": "9b1deb4d-...",
  "document_ids": ["c1f7a0b3-..."],
  "top_k": 5
}
```
- **Response** (200 OK):
```json
{
  "answer": "The paper reports an accuracy of 92.4% on the SQuAD benchmark [Transformer Overview, Page 5].",
  "citations": [
    {
      "source_index": 1,
      "document_id": "c1f7a0b3-...",
      "document_title": "Transformer Overview",
      "page_number": 5,
      "passage_excerpt": "Our model achieves an accuracy of 92.4% on the standard benchmark...",
      "score": 0.884
    }
  ],
  "confidence_score": 0.884,
  "retrieved_chunk_count": 5
}
```

---

## 5. Autonomous Agent Endpoints

### Launch Agent Task
- **Endpoint**: `POST /agent/tasks/`
- **Request Body**:
```json
{
  "workspace_id": "9b1deb4d-...",
  "task_description": "Compare these two research papers, extract methodologies, and calculate average accuracy statistics.",
  "document_ids": ["c1f7a0b3-...", "e2b4c1a8-..."]
}
```
- **Response** (201 Created):
```json
{
  "id": "f8a9b2c3-...",
  "status": "COMPLETED",
  "intent": "MULTI_DOCUMENT_COMPARISON",
  "execution_plan": [
    {"name": "Discover Documents", "tool_name": "search_documents"},
    {"name": "Extract Chunk Proofs", "tool_name": "hybrid_search"},
    {"name": "Analyze Differences", "tool_name": "detect_contradictions"},
    {"name": "Synthesize Comparative Report", "tool_name": "generate_report"}
  ],
  "final_report": "# DocuMind AI Agent Execution Report...",
  "execution_time_ms": 320
}
```

### Task Controls & Inspection
- `GET /agent/tasks/{id}/status/`: Lightweight polling of execution status and current step index.
- `GET /agent/tasks/{id}/steps/`: Execution timeline with tool inputs, outputs, and latencies.
- `POST /agent/tasks/{id}/cancel/`: Cancels in-flight task execution.
- `POST /agent/tasks/{id}/approve/`: Approves task awaiting human clearance.
- `POST /agent/tasks/{id}/reject/`: Rejects sensitive action and halts execution.
- `GET /agent/tools/`: List all 22 registered tools and parameter schemas.
- `GET /agent/usage/`: Returns user agent usage statistics and quotas.

---

## 6. Document Intelligence Endpoints

- `POST /summaries/`: Generate executive, detailed, or section-wise summary.
- `POST /comparison/`: Compare 2 to 10 documents for similarities, differences, and contradictions.
- `POST /research/`: Deconstruct research paper objectives, methodology, datasets, and research gaps.
- `POST /extraction/documents/{id}/run/`: Extract structured tables and named entities.
- `POST /quizzes/`: Generate grounded MCQs and short-answer study quizzes.
- `POST /flashcards/decks/`: Generate active recall study flashcards.
- `GET /analytics/dashboard/`: Real-time workspace stats, upload counts, and recent tasks.
- `GET /audit/logs/`: Immutable security audit log entries.
