import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace
from apps.documents.models import Document

class Conversation(BaseUUIDModel):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=255, default='New Conversation')
    selected_documents = models.ManyToManyField(Document, blank=True, related_name='conversations')

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.user.email})"

class Message(BaseUUIDModel):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    content = models.TextField()
    confidence_score = models.FloatField(default=1.0)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

class MessageCitation(BaseUUIDModel):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='citations'
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='message_citations'
    )
    page_number = models.IntegerField(default=1)
    passage_excerpt = models.TextField()
    score = models.FloatField(default=0.0)

    def __str__(self):
        return f"Citation in Doc {self.document.title} (Page {self.page_number})"
