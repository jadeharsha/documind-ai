from rest_framework import serializers
from .models import Quiz, QuizQuestion

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ('id', 'question_type', 'question_text', 'options', 'correct_answer', 'explanation', 'source_page')

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'document', 'document_title', 'title', 'difficulty', 'total_questions', 'questions', 'created_at')
        read_only_fields = ('id', 'created_at')

class GenerateQuizRequestSerializer(serializers.Serializer):
    document_id = serializers.UUIDField(required=True)
    difficulty = serializers.ChoiceField(choices=Quiz.DIFFICULTY_CHOICES, default='MEDIUM')
    question_count = serializers.IntegerField(default=5, min_value=1, max_value=20)
