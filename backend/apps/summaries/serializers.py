from rest_framework import serializers
from .models import DocumentSummary

class DocumentSummarySerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = DocumentSummary
        fields = ('id', 'document', 'document_title', 'summary_type', 'content', 'key_findings', 'source_pages', 'created_at')
        read_only_fields = ('id', 'created_at')

class GenerateSummaryRequestSerializer(serializers.Serializer):
    document_id = serializers.UUIDField(required=True)
    summary_type = serializers.ChoiceField(choices=DocumentSummary.SUMMARY_TYPES, default='EXECUTIVE')
