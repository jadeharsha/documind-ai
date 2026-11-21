from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Only return audit logs initiated by the user unless superuser
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=user)
