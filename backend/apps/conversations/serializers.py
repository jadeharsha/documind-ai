from rest_framework import serializers
from .models import Conversation, Message, MessageCitation
from apps.documents.serializers import DocumentSerializer
from apps.documents.models import Document

class MessageCitationSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = MessageCitation
        fields = ('id', 'document', 'document_title', 'page_number', 'passage_excerpt', 'score')

class MessageSerializer(serializers.ModelSerializer):
    citations = MessageCitationSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'role', 'content', 'confidence_score', 'citations', 'created_at')
        read_only_fields = ('id', 'confidence_score', 'created_at')

class ConversationSerializer(serializers.ModelSerializer):
    selected_document_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Document.objects.all(),
        source='selected_documents',
        required=False
    )
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'workspace', 'user', 'title', 'selected_document_ids', 'last_message', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        last = obj.messages.last()
        return MessageSerializer(last).data if last else None

class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    selected_documents = DocumentSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ('messages', 'selected_documents')
