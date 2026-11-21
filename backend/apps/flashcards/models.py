from django.db import models
from apps.common.models import BaseUUIDModel
from apps.documents.models import Document

class FlashcardDeck(BaseUUIDModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='flashcard_decks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    card_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.card_count} cards)"

class Flashcard(BaseUUIDModel):
    MASTERY_CHOICES = (
        ('NEW', 'New'),
        ('LEARNING', 'Learning'),
        ('REVIEWING', 'Reviewing'),
        ('MASTERED', 'Mastered'),
    )

    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='cards')
    front_question = models.TextField()
    back_answer = models.TextField()
    topic = models.CharField(max_length=150, blank=True, default='General')
    source_page = models.IntegerField(default=1)
    mastery_level = models.CharField(max_length=20, choices=MASTERY_CHOICES, default='NEW')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Card: {self.front_question[:40]}"
