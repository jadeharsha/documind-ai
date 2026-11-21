from rest_framework import serializers
from .models import ResearchAnalysis

class ResearchAnalysisSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = ResearchAnalysis
        fields = (
            'id', 'document', 'document_title', 'title', 'objectives',
            'methodology', 'datasets', 'results', 'limitations', 'findings',
            'research_gaps', 'literature_review_draft', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

class AnalyzeRequestSerializer(serializers.Serializer):
    document_id = serializers.UUIDField(required=True)
