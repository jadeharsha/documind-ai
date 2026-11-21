from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True, default='')

    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'user_email', 'ip_address', 'request_method', 'path', 'status_code', 'action', 'details', 'created_at')
        read_only_fields = ('id', 'created_at')
