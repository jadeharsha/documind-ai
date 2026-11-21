from rest_framework import serializers
from .models import FlashcardDeck, Flashcard

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ('id', 'front_question', 'back_answer', 'topic', 'source_page', 'mastery_level', 'created_at')

class FlashcardDeckSerializer(serializers.ModelSerializer):
    cards = FlashcardSerializer(many=True, read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = FlashcardDeck
        fields = ('id', 'document', 'document_title', 'title', 'description', 'card_count', 'cards', 'created_at')
        read_only_fields = ('id', 'created_at')

class GenerateDeckRequestSerializer(serializers.Serializer):
    document_id = serializers.UUIDField(required=True)
    deck_title = serializers.CharField(max_length=255, required=False)
