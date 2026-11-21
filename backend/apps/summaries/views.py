from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q
from .models import DocumentSummary
from .serializers import DocumentSummarySerializer, GenerateSummaryRequestSerializer
from apps.documents.models import Document, DocumentChunkMetadata
from apps.rag.services.llm_service import LLMService

class SummaryListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSummarySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        doc_id = self.request.query_params.get('document_id')
        qs = DocumentSummary.objects.filter(
            Q(document__workspace__owner=user) | Q(document__workspace__memberships__user=user)
        ).distinct()
        if doc_id:
            qs = qs.filter(document_id=doc_id)
        return qs

    def create(self, request, *args, **kwargs):
        req_serializer = GenerateSummaryRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        doc_id = req_serializer.validated_data['document_id']
        summary_type = req_serializer.validated_data['summary_type']

        try:
            document = Document.objects.get(id=doc_id)
        except Document.DoesNotExist:
            raise NotFound("Document not found.")

        # Permission check
        ws = document.workspace
        if ws.owner != request.user and not ws.memberships.filter(user=request.user).exists():
            raise PermissionDenied("Access to this document is denied.")

        # Retrieve chunks for summarization
        chunks = DocumentChunkMetadata.objects.filter(document=document).order_by('chunk_index')[:15]
        chunk_texts = [f"[Page {c.page_number}]: {c.chunk_text_preview}" for c in chunks]
        pages_seen = list(set(c.page_number for c in chunks))

        context = "\n\n".join(chunk_texts)
        prompt = (
            f"Please generate a comprehensive {summary_type} summary of the document titled \"{document.title}\".\n\n"
            f"SOURCE EXCERPTS:\n{context}\n\n"
            "REQUIREMENTS:\n"
            "1. Focus strictly on facts presented in the excerpts above.\n"
            "2. Highlight key takeaways, main thesis, and conclusions with page references where possible.\n"
            "3. Do not invent details not present in the text."
        )

        llm = LLMService()
        generated_summary = llm.generate(
            prompt=prompt,
            system_prompt=f"You are an expert document research summarizer producing {summary_type} summaries."
        )

        # Extract bullet key findings
        findings = [
            line.strip().lstrip('-*•').strip()
            for line in generated_summary.split('\n')
            if line.strip().startswith(('-', '*', '•', '1.', '2.', '3.'))
        ][:5]

        summary_obj = DocumentSummary.objects.create(
            document=document,
            summary_type=summary_type,
            content=generated_summary,
            key_findings=findings,
            source_pages=pages_seen
        )

        return Response(DocumentSummarySerializer(summary_obj).data, status=status.HTTP_201_CREATED)

class SummaryDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSummarySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return DocumentSummary.objects.filter(
            Q(document__workspace__owner=user) | Q(document__workspace__memberships__user=user)
        ).distinct()
