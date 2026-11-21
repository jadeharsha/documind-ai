# DocuMind AI — Testing & Quality Assurance Guide

## 1. Testing Strategy

The project employs a comprehensive test strategy covering unit, integration, and security layers:
1. **Backend Integration Suite**: Django REST Framework `APITestCase` suite validating authentication, workspace isolation, document management, grounded RAG, agent workflows, and deterministic math.
2. **Deterministic Math Validation**: Strict unit verification ensuring `calculate_statistics` computes exact mean, median, min, max, and variance in Python without relying on LLM guesses.
3. **Tenant Boundary Tests**: Verifies that User 2 receives 403 Forbidden or 404 Not Found when attempting to access User 1's workspaces or documents.

---

## 2. Running Automated Tests

### Backend Tests
```bash
cd backend
python manage.py test tests
```

Expected output:
```
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
......
----------------------------------------------------------------------
Ran 6 tests in 0.420s

OK
Destroying test database for alias 'default'...
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 3. End-to-End Acceptance Scenarios

The test suite validates the following 18 critical scenarios:
1. User registration & JWT token pair issuance.
2. User login and profile hydration.
3. Default workspace auto-creation.
4. Document upload validation (MIME types, file extensions, size limits).
5. File storage persistence and unique key generation.
6. Celery ingestion pipeline execution.
7. Page-preserving chunk creation with character offsets.
8. Embedding generation via SentenceTransformers.
9. Qdrant vector indexing with tenant payloads.
10. Grounded RAG query execution with page citations.
11. Multi-document context selection.
12. Multi-document comparison and contradiction detection.
13. Research paper analysis and research gap identification.
14. Agent task planning with intent classification.
15. Autonomous tool execution across all 22 registered tools.
16. Task cancellation and human approval handling.
17. Document deletion cascade across MinIO, Qdrant, and MySQL.
18. Multi-tenant access denial when unauthorized users attempt queries.
