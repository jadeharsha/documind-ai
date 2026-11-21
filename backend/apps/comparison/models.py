from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace
from apps.documents.models import Document

class DocumentComparison(BaseUUIDModel):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='comparisons')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comparisons')
    title = models.CharField(max_length=255, default='Document Comparison')
    compared_documents = models.ManyToManyField(Document, related_name='comparisons')

    similarities = models.JSONField(default=list, blank=True)
    differences = models.JSONField(default=list, blank=True)
    contradictions = models.JSONField(default=list, blank=True)
    missing_information = models.JSONField(default=list, blank=True)
    narrative_report = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.created_at.strftime('%Y-%m-%d')})"
