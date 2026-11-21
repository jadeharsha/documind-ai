import re
import logging
from typing import List, Dict, Any, Optional
from apps.embeddings.services.embedding_service import EmbeddingService
from apps.retrieval.services.qdrant_service import QdrantService
from .llm_service import LLMService

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, llm_provider: Optional[str] = None):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.llm_service = LLMService(provider=llm_provider)

    def preprocess_query(self, query: str) -> str:
        """
        Cleans and normalizes user query.
        """
        query = query.strip()
        query = re.sub(r'\s+', ' ', query)
        return query

    def retrieve_context(
        self,
        query: str,
        workspace_id: str,
        owner_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval: vector semantic search filtered by tenant and workspace,
        augmented with keyword term overlap reranking.
        """
        clean_query = self.preprocess_query(query)
        query_vector = self.embedding_service.embed_query(clean_query)

        hits = self.qdrant_service.search(
            query_vector=query_vector,
            workspace_id=workspace_id,
            owner_id=owner_id,
            document_ids=document_ids,
            top_k=top_k * 2,
            score_threshold=0.1
        )

        # Keyword overlap reranking
        query_terms = set(re.findall(r'\w+', clean_query.lower()))
        for hit in hits:
            text = hit['payload'].get('text', '').lower()
            overlap_count = sum(1 for term in query_terms if term in text)
            keyword_score = overlap_count / (len(query_terms) or 1)
            # Combined score: 70% dense vector + 30% keyword overlap
            hit['final_score'] = (0.7 * hit['score']) + (0.3 * keyword_score)

        hits.sort(key=lambda x: x['final_score'], reverse=True)
        return hits[:top_k]

    def build_grounded_prompt(self, query: str, context_chunks: List[Dict[str, Any]], conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Constructs context-bounded system prompt and user prompt.
        """
        if not context_chunks:
            return (
                f"User Question: {query}\n\n"
                "Note: No relevant document evidence was found in the selected documents.\n"
                "State clearly: 'I could not find sufficient supporting information in the selected documents.'"
            )

        context_blocks = []
        for i, hit in enumerate(context_chunks, 1):
            p = hit['payload']
            doc_title = p.get('document_title', 'Document')
            page_num = p.get('page_number', 1)
            text = p.get('text', '').strip()
            context_blocks.append(
                f"[Source {i}] Document: \"{doc_title}\" | Page: {page_num}\nPassage: {text}"
            )

        context_str = "\n\n".join(context_blocks)

        history_str = ""
        if conversation_history:
            history_str = "Prior Conversation History:\n" + "\n".join(
                [f"{m['role'].capitalize()}: {m['content']}" for m in conversation_history[-4:]]
            ) + "\n\n"

        prompt = (
            f"{history_str}"
            f"DOCUMENT EVIDENCE:\n"
            f"----------------------------------------\n"
            f"{context_str}\n"
            f"----------------------------------------\n\n"
            f"USER QUESTION: {query}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Answer the question using ONLY the facts directly supported by the document evidence above.\n"
            f"2. Every factual claim MUST be followed by its source citation format: [Document Title, Page X].\n"
            f"3. If the provided evidence does NOT contain the answer, reply exactly:\n"
            f"   'I could not find sufficient supporting information in the selected documents.'\n"
            f"4. Never hallucinate or fabricate facts, statistics, page numbers, or quotes."
        )
        return prompt

    def answer_query(
        self,
        query: str,
        workspace_id: str,
        owner_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Full grounded RAG pipeline execution.
        """
        # 1. Retrieve
        context_chunks = self.retrieve_context(
            query=query,
            workspace_id=workspace_id,
            owner_id=owner_id,
            document_ids=document_ids,
            top_k=top_k
        )

        if not context_chunks:
            return {
                "answer": "I could not find sufficient supporting information in the selected documents.",
                "citations": [],
                "confidence_score": 0.0,
                "retrieved_chunk_count": 0
            }

        # 2. Build prompt
        prompt = self.build_grounded_prompt(query, context_chunks, conversation_history)

        # 3. Generate answer
        system_prompt = (
            "You are DocuMind AI, an evidence-grounded document intelligence system. "
            "Never invent facts or citations. Rely exclusively on the provided document excerpts."
        )
        raw_answer = self.llm_service.generate(prompt=prompt, system_prompt=system_prompt)

        # 4. Map and verify citations
        citations = []
        for i, hit in enumerate(context_chunks, 1):
            p = hit['payload']
            citations.append({
                "source_index": i,
                "document_id": p.get('document_id'),
                "document_title": p.get('document_title'),
                "page_number": p.get('page_number', 1),
                "passage_excerpt": p.get('text', '')[:250],
                "score": hit.get('final_score', hit.get('score', 0.0))
            })

        avg_score = sum(c['score'] for c in citations) / len(citations) if citations else 0.0

        return {
            "answer": raw_answer.strip(),
            "citations": citations,
            "confidence_score": round(avg_score, 4),
            "retrieved_chunk_count": len(context_chunks)
        }
