from rest_framework import serializers
from .models import DocumentComparison
from apps.documents.serializers import DocumentSerializer

class DocumentComparisonSerializer(serializers.ModelSerializer):
    compared_documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = DocumentComparison
        fields = (
            'id', 'workspace', 'user', 'title', 'compared_documents',
            'similarities', 'differences', 'contradictions', 'missing_information',
            'narrative_report', 'created_at'
        )
        read_only_fields = ('id', 'user', 'created_at')

class CompareRequestSerializer(serializers.Serializer):
    workspace_id = serializers.UUIDField(required=True)
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=2,
        required=True
    )
    title = serializers.CharField(max_length=255, required=False, default='Multi-Document Comparison')
