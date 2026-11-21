import os
from pathlib import Path
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.conf import settings
from django.db.models import Q
from .models import Document, DocumentCollection, DocumentChunkMetadata
from .serializers import (
    DocumentSerializer, DocumentDetailSerializer,
    DocumentCollectionSerializer, DocumentChunkMetadataSerializer,
    DocumentUploadSerializer
)
from apps.workspaces.models import Workspace
from apps.ingestion.services.storage import StorageService
from apps.ingestion.tasks import process_document_pipeline
from apps.retrieval.services.qdrant_service import QdrantService
from apps.common.permissions import IsWorkspaceMember

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.md'}

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        queryset = Document.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()

        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        collection_id = self.request.query_params.get('collection_id')
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(file_name__icontains=search))

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        return queryset

    def create(self, request, *args, **kwargs):
        upload_serializer = DocumentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)

        workspace_id = upload_serializer.validated_data['workspace_id']
        file_obj = upload_serializer.validated_data['file']
        collection_id = upload_serializer.validated_data.get('collection_id')
        custom_title = upload_serializer.validated_data.get('title')

        # 1. Validate Workspace Access
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace_id": "Specified workspace not found."})

        if workspace.owner != request.user and not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have permission to upload to this workspace.")

        # 2. Validate File
        filename = file_obj.name
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError({"file": f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"})

        max_size_bytes = getattr(settings, 'MAX_UPLOAD_SIZE_MB', 25) * 1024 * 1024
        if file_obj.size > max_size_bytes:
            raise ValidationError({"file": f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB."})

        # 3. Store File
        storage = StorageService()
        storage_key = storage.save_file(file_obj, filename)

        # 4. Create Document Record
        collection = None
        if collection_id:
            collection = DocumentCollection.objects.filter(id=collection_id, workspace=workspace).first()

        doc_title = custom_title if custom_title else Path(filename).stem

        document = Document.objects.create(
            workspace=workspace,
            owner=request.user,
            collection=collection,
            title=doc_title,
            file_name=filename,
            file_size=file_obj.size,
            mime_type=file_obj.content_type or 'application/octet-stream',
            file_extension=ext,
            storage_key=storage_key,
            status='PENDING'
        )

        # 5. Dispatch Processing Task
        try:
            process_document_pipeline.delay(str(document.id))
        except Exception:
            # If celery broker is not actively running, run synchronously
            process_document_pipeline(str(document.id))

        # Re-fetch document
        document.refresh_from_db()
        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DocumentDetailSerializer
        return DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        return Document.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()

    def perform_destroy(self, instance):
        # 1. Purge from Qdrant vector database
        qdrant = QdrantService()
        qdrant.delete_document_vectors(str(instance.id))

        # 2. Purge file from storage
        storage = StorageService()
        storage.delete_file(instance.storage_key)

        # 3. Delete database record
        instance.delete()

class DocumentChunksListView(generics.ListAPIView):
    serializer_class = DocumentChunkMetadataSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        doc_id = self.kwargs.get('document_id')
        user = self.request.user
        return DocumentChunkMetadata.objects.filter(
            document_id=doc_id,
            document__workspace__memberships__user=user
        ) | DocumentChunkMetadata.objects.filter(
            document_id=doc_id,
            document__workspace__owner=user
        )

class DocumentCollectionListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentCollectionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        user = self.request.user
        qs = DocumentCollection.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace": "Workspace not found."})

        if workspace.owner != self.request.user and not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied("You do not have permission in this workspace.")

        serializer.save(workspace=workspace)

class DocumentCollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentCollectionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return DocumentCollection.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
