from django.db import models
from apps.common.models import BaseUUIDModel
from apps.documents.models import Document

class ExtractedTable(BaseUUIDModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='tables')
    page_number = models.IntegerField(default=1)
    title = models.CharField(max_length=255, blank=True, default='Extracted Table')
    headers = models.JSONField(default=list)
    rows = models.JSONField(default=list)
    row_count = models.IntegerField(default=0)
    col_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['page_number', 'created_at']

    def __str__(self):
        return f"Table on page {self.page_number} ({self.document.title})"

class ExtractedEntity(BaseUUIDModel):
    ENTITY_TYPES = (
        ('ORGANIZATION', 'Organization'),
        ('PERSON', 'Person'),
        ('DATE', 'Date'),
        ('METRIC', 'Metric / Value'),
        ('LOCATION', 'Location'),
        ('CONCEPT', 'Domain Concept'),
    )

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='entities')
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPES, default='CONCEPT')
    text = models.CharField(max_length=255)
    page_number = models.IntegerField(default=1)
    context_passage = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['page_number', 'entity_type']

    def __str__(self):
        return f"[{self.entity_type}] {self.text} (Page {self.page_number})"
