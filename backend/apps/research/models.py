from django.db import models
from apps.common.models import BaseUUIDModel
from apps.documents.models import Document

class ResearchAnalysis(BaseUUIDModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='research_analyses')
    title = models.CharField(max_length=255)

    objectives = models.TextField(blank=True, default='')
    methodology = models.TextField(blank=True, default='')
    datasets = models.JSONField(default=list, blank=True)
    results = models.TextField(blank=True, default='')
    limitations = models.TextField(blank=True, default='')
    findings = models.JSONField(default=list, blank=True)
    research_gaps = models.JSONField(default=list, blank=True)
    literature_review_draft = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Research Analysis: {self.title}"
