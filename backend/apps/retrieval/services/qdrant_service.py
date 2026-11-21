import logging
import uuid
from typing import List, Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

class QdrantService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QdrantService, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.host = getattr(settings, 'QDRANT_HOST', 'localhost')
        self.port = getattr(settings, 'QDRANT_PORT', 6333)
        self.api_key = getattr(settings, 'QDRANT_API_KEY', None)
        self.collection_name = getattr(settings, 'QDRANT_COLLECTION_PREFIX', 'documind_collection')
        self.dimension = getattr(settings, 'EMBEDDING_DIMENSION', 384)

        # In-memory store fallback for test suites or offline environments
        self._memory_points: Dict[str, Dict[str, Any]] = {}

        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models as rest_models
            self.rest_models = rest_models
            self.client = QdrantClient(host=self.host, port=self.port, api_key=self.api_key, timeout=5.0)
            self._ensure_collection()
            self.is_connected = True
        except Exception as e:
            logger.warning("Could not connect to Qdrant cluster (%s). Operating in-memory vector store.", str(e))
            self.client = None
            self.is_connected = False

    def _ensure_collection(self):
        if not self.client:
            return
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=self.rest_models.VectorParams(
                        size=self.dimension,
                        distance=self.rest_models.Distance.COSINE
                    )
                )
                logger.info("Created Qdrant collection: %s", self.collection_name)
        except Exception as e:
            logger.warning("Error creating Qdrant collection: %s", str(e))
            self.client = None
            self.is_connected = False

    def upsert_chunks(self, points: List[Dict[str, Any]]):
        """
        Upserts vector points with structured metadata.
        Each item in points: {'id': uuid_str, 'vector': [...], 'payload': {...}}
        """
        if not points:
            return

        if self.client and self.is_connected:
            try:
                qdrant_points = [
                    self.rest_models.PointStruct(
                        id=str(p['id']),
                        vector=p['vector'],
                        payload=p['payload']
                    )
                    for p in points
                ]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=qdrant_points
                )
                return
            except Exception as e:
                logger.error("Failed to upsert to Qdrant: %s. Using in-memory fallback.", str(e))

        # Store in-memory fallback
        for p in points:
            self._memory_points[str(p['id'])] = {
                'vector': p['vector'],
                'payload': p['payload']
            }

    def search(
        self,
        query_vector: List[float],
        workspace_id: str,
        owner_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5,
        score_threshold: float = 0.2
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search strictly filtered by workspace and owner.
        Guarantees tenant isolation.
        """
        if self.client and self.is_connected:
            try:
                must_filters = [
                    self.rest_models.FieldCondition(
                        key="workspace_id",
                        match=self.rest_models.MatchValue(value=str(workspace_id))
                    )
                ]
                if owner_id:
                    must_filters.append(
                        self.rest_models.FieldCondition(
                            key="owner_id",
                            match=self.rest_models.MatchValue(value=str(owner_id))
                        )
                    )
                if document_ids:
                    must_filters.append(
                        self.rest_models.FieldCondition(
                            key="document_id",
                            match=self.rest_models.MatchAny(any=[str(d) for d in document_ids])
                        )
                    )

                filter_obj = self.rest_models.Filter(must=must_filters)
                search_results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=filter_obj,
                    limit=top_k,
                    score_threshold=score_threshold
                )

                return [
                    {
                        "id": hit.id,
                        "score": hit.score,
                        "payload": hit.payload
                    }
                    for hit in search_results
                ]
            except Exception as e:
                logger.error("Qdrant search error: %s. Falling back to in-memory search.", str(e))

        # In-memory search fallback
        results = []
        for point_id, data in self._memory_points.items():
            payload = data['payload']
            # Tenant isolation checks
            if str(payload.get('workspace_id')) != str(workspace_id):
                continue
            if owner_id and str(payload.get('owner_id')) != str(owner_id):
                continue
            if document_ids and str(payload.get('document_id')) not in [str(d) for d in document_ids]:
                continue

            # Cosine similarity
            v = data['vector']
            dot = sum(a * b for a, b in zip(query_vector, v))
            norm_q = sum(a * a for a in query_vector) ** 0.5 or 1.0
            norm_v = sum(b * b for b in v) ** 0.5 or 1.0
            sim = dot / (norm_q * norm_v)

            if sim >= score_threshold:
                results.append({
                    "id": point_id,
                    "score": float(sim),
                    "payload": payload
                })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]

    def delete_document_vectors(self, document_id: str):
        """
        Deletes all vector points belonging to a specific document.
        """
        if self.client and self.is_connected:
            try:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=self.rest_models.FilterSelector(
                        filter=self.rest_models.Filter(
                            must=[
                                self.rest_models.FieldCondition(
                                    key="document_id",
                                    match=self.rest_models.MatchValue(value=str(document_id))
                                )
                            ]
                        )
                    )
                )
            except Exception as e:
                logger.error("Error deleting document vectors from Qdrant: %s", str(e))

        # Also purge from in-memory store
        to_del = [pid for pid, d in self._memory_points.items() if str(d['payload'].get('document_id')) == str(document_id)]
        for pid in to_del:
            del self._memory_points[pid]
