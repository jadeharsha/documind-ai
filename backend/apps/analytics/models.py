from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace

class UsageRecord(BaseUUIDModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='usage_records')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='usage_records')
    event_type = models.CharField(max_length=100, db_index=True)
    tokens_consumed = models.IntegerField(default=0)
    compute_time_ms = models.IntegerField(default=0)
    document_count = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} by {self.user.email} ({self.created_at.strftime('%Y-%m-%d')})"
