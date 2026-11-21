import time
import logging
from celery import shared_task
from django.utils import timezone
from apps.documents.models import Document, DocumentChunkMetadata
from apps.ingestion.services.storage import StorageService
from apps.ingestion.services.extractor import DocumentExtractor
from apps.ingestion.services.chunker import DocumentChunker
from apps.embeddings.services.embedding_service import EmbeddingService
from apps.retrieval.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_document_pipeline(self, document_id: str):
    """
    Asynchronous Celery pipeline for document ingestion:
    Extract -> Chunk -> Embed -> Qdrant Index -> Database Update.
    """
    start_time = time.time()
    logger.info("Starting ingestion pipeline for Document %s", document_id)

    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.error("Document with id %s does not exist.", document_id)
        return False

    document.status = 'PROCESSING'
    document.error_message = ''
    document.save(update_fields=['status', 'error_message', 'updated_at'])

    try:
        # 1. Resolve local file path
        storage = StorageService()
        file_path = storage.get_file_path(document.storage_key)

        # 2. Extract content & metadata
        extraction_res = DocumentExtractor.extract(file_path, document.file_extension)
        pages = extraction_res['pages']
        document.page_count = extraction_res['page_count']
        document.word_count = extraction_res['word_count']
        if extraction_res.get('metadata'):
            document.metadata.update(extraction_res['metadata'])

        # 3. Chunk text preserving page boundaries
        chunker = DocumentChunker()
        chunks = chunker.chunk_pages(pages)
        document.chunk_count = len(chunks)

        if not chunks:
            document.status = 'INDEXED'
            document.save()
            return True

        # 4. Generate Embeddings
        chunk_texts = [c.text for c in chunks]
        embedding_service = EmbeddingService()
        embeddings = embedding_service.embed_texts(chunk_texts)

        # 5. Build points for Qdrant
        points = []
        chunk_db_objects = []

        for c, emb in zip(chunks, embeddings):
            payload = {
                "document_id": str(document.id),
                "workspace_id": str(document.workspace_id),
                "owner_id": str(document.owner_id),
                "document_title": document.title,
                "chunk_index": c.chunk_index,
                "page_number": c.page_number,
                "page_start": c.page_start,
                "page_end": c.page_end,
                "char_start": c.char_start,
                "char_end": c.char_end,
                "text": c.text,
            }
            points.append({
                "id": c.chunk_id,
                "vector": emb,
                "payload": payload
            })

            chunk_db_objects.append(
                DocumentChunkMetadata(
                    document=document,
                    chunk_index=c.chunk_index,
                    page_number=c.page_number,
                    page_start=c.page_start,
                    page_end=c.page_end,
                    char_start=c.char_start,
                    char_end=c.char_end,
                    qdrant_point_id=c.chunk_id,
                    chunk_text_preview=c.text[:250]
                )
            )

        # 6. Index in Qdrant
        qdrant_service = QdrantService()
        qdrant_service.upsert_chunks(points)

        # 7. Save Chunks to MySQL
        DocumentChunkMetadata.objects.filter(document=document).delete()
        DocumentChunkMetadata.objects.bulk_create(chunk_db_objects)

        # 8. Mark Indexed
        elapsed_ms = int((time.time() - start_time) * 1000)
        document.processing_time_ms = elapsed_ms
        document.status = 'INDEXED'
        document.save()

        logger.info(
            "Document %s indexed successfully in %d ms (%d chunks, %d pages)",
            document_id, elapsed_ms, document.chunk_count, document.page_count
        )
        return True

    except Exception as exc:
        logger.exception("Failed processing document %s: %s", document_id, str(exc))
        document.status = 'FAILED'
        document.error_message = str(exc)[:1000]
        document.save(update_fields=['status', 'error_message', 'updated_at'])
        return False
