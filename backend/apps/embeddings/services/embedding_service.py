import logging
import hashlib
from typing import List
from django.conf import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialize_model()
        return cls._instance

    def _initialize_model(self):
        self.dimension = getattr(settings, 'EMBEDDING_DIMENSION', 384)
        self.model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'all-MiniLM-L6-v2')
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
            logger.info("Loaded SentenceTransformer model: %s", self.model_name)
        except Exception as e:
            logger.warning("Could not load SentenceTransformer (%s). Using deterministic fallback embeddings for test/offline mode.", str(e))
            self._model = None

    def _generate_fallback_vector(self, text: str) -> List[float]:
        """
        Deterministic pseudo-embedding for testing or offline environments
        without heavy PyTorch dependencies.
        """
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest()[:8], 16)
        import random
        rng = random.Random(seed)
        vec = [rng.uniform(-1.0, 1.0) for _ in range(self.dimension)]
        # Normalize vector
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        return [x / norm for x in vec]

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self._model is not None:
            try:
                embeddings = self._model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
                return embeddings.tolist()
            except Exception as e:
                logger.error("Error generating embeddings with model: %s. Using fallback.", str(e))

        return [self._generate_fallback_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        results = self.embed_texts([query])
        return results[0] if results else self._generate_fallback_vector(query)
