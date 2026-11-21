from django.db import models
from apps.common.models import BaseUUIDModel
from apps.documents.models import Document

class Quiz(BaseUUIDModel):
    DIFFICULTY_CHOICES = (
        ('EASY', 'Easy / Foundational'),
        ('MEDIUM', 'Medium / Analytical'),
        ('HARD', 'Hard / Mastery'),
    )

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='MEDIUM')
    total_questions = models.IntegerField(default=5)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.difficulty})"

class QuizQuestion(BaseUUIDModel):
    QUESTION_TYPES = (
        ('MCQ', 'Multiple Choice'),
        ('SHORT_ANSWER', 'Short Answer'),
        ('TRUE_FALSE', 'True / False'),
    )

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=30, choices=QUESTION_TYPES, default='MCQ')
    question_text = models.TextField()
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.CharField(max_length=500)
    explanation = models.TextField(blank=True, default='')
    source_page = models.IntegerField(default=1)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Q: {self.question_text[:50]}"
