from rest_framework import serializers
from .models import ExtractedTable, ExtractedEntity

class ExtractedTableSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = ExtractedTable
        fields = ('id', 'document', 'document_title', 'page_number', 'title', 'headers', 'rows', 'row_count', 'col_count', 'created_at')
        read_only_fields = ('id', 'created_at')

class ExtractedEntitySerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = ExtractedEntity
        fields = ('id', 'document', 'document_title', 'entity_type', 'text', 'page_number', 'context_passage', 'created_at')
        read_only_fields = ('id', 'created_at')
