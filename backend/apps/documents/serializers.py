from rest_framework import serializers
from .models import Document, DocumentCollection, DocumentChunkMetadata, DocumentVersion
from apps.accounts.serializers import UserSerializer

class DocumentCollectionSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = DocumentCollection
        fields = ('id', 'workspace', 'name', 'description', 'document_count', 'created_at')
        read_only_fields = ('id', 'created_at', 'document_count')

    def get_document_count(self, obj):
        return obj.documents.count()

class DocumentChunkMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunkMetadata
        fields = (
            'id', 'chunk_index', 'page_number', 'page_start', 'page_end',
            'char_start', 'char_end', 'qdrant_point_id', 'chunk_text_preview'
        )

class DocumentSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True, default='')

    class Meta:
        model = Document
        fields = (
            'id', 'workspace', 'owner', 'collection', 'collection_name',
            'title', 'file_name', 'file_size', 'mime_type', 'file_extension',
            'status', 'error_message', 'page_count', 'word_count', 'chunk_count',
            'processing_time_ms', 'metadata', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'owner', 'file_size', 'mime_type', 'file_extension',
            'status', 'error_message', 'page_count', 'word_count', 'chunk_count',
            'processing_time_ms', 'created_at', 'updated_at'
        )

class DocumentDetailSerializer(DocumentSerializer):
    chunks = DocumentChunkMetadataSerializer(many=True, read_only=True)

    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ('chunks',)

class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    workspace_id = serializers.UUIDField(required=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255, required=False)
