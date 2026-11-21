from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel

class AuditLog(BaseUUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    request_method = models.CharField(max_length=10)
    path = models.CharField(max_length=512)
    status_code = models.IntegerField(default=200)
    action = models.CharField(max_length=150)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.request_method}] {self.path} - {self.status_code} ({self.created_at.strftime('%H:%M:%S')})"
