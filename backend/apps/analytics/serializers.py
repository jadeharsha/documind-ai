from rest_framework import serializers
from .models import UsageRecord

class UsageRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageRecord
        fields = ('id', 'workspace', 'event_type', 'tokens_consumed', 'compute_time_ms', 'document_count', 'metadata', 'created_at')
        read_only_fields = ('id', 'created_at')
