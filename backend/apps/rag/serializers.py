from rest_framework import serializers

class CitationSerializer(serializers.Serializer):
    source_index = serializers.IntegerField()
    document_id = serializers.UUIDField()
    document_title = serializers.CharField()
    page_number = serializers.IntegerField()
    passage_excerpt = serializers.CharField()
    score = serializers.FloatField()

class RAGQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True, min_length=2, max_length=2000)
    workspace_id = serializers.UUIDField(required=True)
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        default=list
    )
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    top_k = serializers.IntegerField(required=False, default=5, min_value=1, max_value=20)

class RAGResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    citations = CitationSerializer(many=True)
    confidence_score = serializers.FloatField()
    retrieved_chunk_count = serializers.IntegerField()
