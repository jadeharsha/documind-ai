from django.db import models
from apps.common.models import BaseUUIDModel
from apps.documents.models import Document

class DocumentSummary(BaseUUIDModel):
    SUMMARY_TYPES = (
        ('SHORT', 'Short Overview'),
        ('DETAILED', 'Detailed Analysis'),
        ('EXECUTIVE', 'Executive Summary'),
        ('SECTION_WISE', 'Section-Wise Breakdown'),
        ('KEY_POINTS', 'Key Bullet Points'),
    )

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='summaries')
    summary_type = models.CharField(max_length=30, choices=SUMMARY_TYPES, default='EXECUTIVE')
    content = models.TextField()
    key_findings = models.JSONField(default=list, blank=True)
    source_pages = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.summary_type} of {self.document.title}"
