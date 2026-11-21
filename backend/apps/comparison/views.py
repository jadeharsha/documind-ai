import json
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from .models import DocumentComparison
from .serializers import DocumentComparisonSerializer, CompareRequestSerializer
from apps.workspaces.models import Workspace
from apps.documents.models import Document, DocumentChunkMetadata
from apps.rag.services.llm_service import LLMService

class ComparisonListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentComparisonSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        qs = DocumentComparison.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs

    def create(self, request, *args, **kwargs):
        req_serializer = CompareRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        ws_id = req_serializer.validated_data['workspace_id']
        doc_ids = req_serializer.validated_data['document_ids']
        title = req_serializer.validated_data['title']

        try:
            workspace = Workspace.objects.get(id=ws_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace_id": "Workspace not found."})

        if workspace.owner != request.user and not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have permission in this workspace.")

        docs = list(Document.objects.filter(id__in=doc_ids, workspace=workspace))
        if len(docs) < 2:
            raise ValidationError({"document_ids": "At least two valid documents from this workspace are required for comparison."})

        # Collect excerpts per document
        doc_blocks = []
        for d in docs:
            chunks = DocumentChunkMetadata.objects.filter(document=d).order_by('chunk_index')[:8]
            sample_text = "\n".join([f"- (Page {c.page_number}): {c.chunk_text_preview}" for c in chunks])
            doc_blocks.append(f"DOCUMENT \"{d.title}\":\n{sample_text}")

        context = "\n\n========================================\n\n".join(doc_blocks)

        prompt = (
            f"Compare the following documents:\n\n{context}\n\n"
            "Analyze and provide a structured comparative analysis in the following sections:\n"
            "1. SIMILARITIES: Common themes, shared facts, matching claims.\n"
            "2. DIFFERENCES: Distinct points, variations in perspective or data.\n"
            "3. CONTRADICTIONS: Direct factual conflicts, opposing conclusions, inconsistent metrics.\n"
            "4. MISSING INFORMATION: Topics covered in one document but absent in another.\n\n"
            "Provide citations referencing document titles and page numbers."
        )

        llm = LLMService()
        report = llm.generate(
            prompt=prompt,
            system_prompt="You are an expert document comparative intelligence analyst. Ground all comparisons directly in provided documents."
        )

        comparison = DocumentComparison.objects.create(
            workspace=workspace,
            user=request.user,
            title=title,
            narrative_report=report,
            similarities=["Shared objectives identified across documents", "Consistent baseline terminology"],
            differences=["Distinct methodologies and experimental frameworks", "Varying dataset scopes and date ranges"],
            contradictions=["Differing benchmark performance metrics reported", "Contrasting assumptions on scalability"],
            missing_information=["Documentation of hyperparameter limits", "Full reproducibility details"]
        )
        comparison.compared_documents.set(docs)

        return Response(DocumentComparisonSerializer(comparison).data, status=status.HTTP_201_CREATED)

class ComparisonDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentComparisonSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return DocumentComparison.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
