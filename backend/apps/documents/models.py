import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace

class DocumentCollection(BaseUUIDModel):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='collections'
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']
        unique_together = ('workspace', 'name')

    def __str__(self):
        return f"{self.name} in {self.workspace.name}"

class Document(BaseUUIDModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Ingestion'),
        ('PROCESSING', 'Processing & Indexing'),
        ('INDEXED', 'Indexed & Ready'),
        ('FAILED', 'Processing Failed'),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    collection = models.ForeignKey(
        DocumentCollection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents'
    )

    title = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    file_extension = models.CharField(max_length=20)
    storage_key = models.CharField(max_length=512)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    error_message = models.TextField(blank=True, default='')

    page_count = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)
    chunk_count = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(default=0)

    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['owner', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

class DocumentVersion(BaseUUIDModel):
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.IntegerField(default=1)
    storage_key = models.CharField(max_length=512)
    file_size = models.BigIntegerField()
    change_summary = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-version_number']
        unique_together = ('document', 'version_number')

class DocumentChunkMetadata(BaseUUIDModel):
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    chunk_index = models.IntegerField(db_index=True)
    page_number = models.IntegerField(default=1, db_index=True)
    page_start = models.IntegerField(default=1)
    page_end = models.IntegerField(default=1)
    char_start = models.IntegerField(default=0)
    char_end = models.IntegerField(default=0)
    qdrant_point_id = models.CharField(max_length=128, db_index=True)
    chunk_text_preview = models.CharField(max_length=500, blank=True, default='')

    class Meta:
        ordering = ['chunk_index']
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
            models.Index(fields=['document', 'page_number']),
        ]

    def __str__(self):
        return f"Doc {self.document.title} - Chunk {self.chunk_index} (Page {self.page_number})"
