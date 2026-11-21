from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q
from .models import FlashcardDeck, Flashcard
from .serializers import FlashcardDeckSerializer, FlashcardSerializer, GenerateDeckRequestSerializer
from apps.documents.models import Document, DocumentChunkMetadata

class FlashcardDeckListCreateView(generics.ListCreateAPIView):
    serializer_class = FlashcardDeckSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        doc_id = self.request.query_params.get('document_id')
        qs = FlashcardDeck.objects.filter(
            Q(document__workspace__owner=user) | Q(document__workspace__memberships__user=user)
        ).distinct()
        if doc_id:
            qs = qs.filter(document_id=doc_id)
        return qs

    def create(self, request, *args, **kwargs):
        req_serializer = GenerateDeckRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        doc_id = req_serializer.validated_data['document_id']
        title = req_serializer.validated_data.get('deck_title')

        try:
            document = Document.objects.get(id=doc_id)
        except Document.DoesNotExist:
            raise NotFound("Document not found.")

        ws = document.workspace
        if ws.owner != request.user and not ws.memberships.filter(user=request.user).exists():
            raise PermissionDenied("Access to document denied.")

        chunks = list(DocumentChunkMetadata.objects.filter(document=document).order_by('chunk_index')[:8])

        deck = FlashcardDeck.objects.create(
            document=document,
            title=title or f"Active Recall Deck: {document.title}",
            description=f"Generated study flashcards derived from {document.title}",
            card_count=len(chunks) or 1
        )

        cards = []
        for i, c in enumerate(chunks, 1):
            cards.append(Flashcard(
                deck=deck,
                front_question=f"Key insight & question regarding section {i} (Page {c.page_number})?",
                back_answer=f"Evidence: {c.chunk_text_preview[:180]}...",
                topic="Core Findings",
                source_page=c.page_number,
                mastery_level='NEW'
            ))

        if not cards:
            cards.append(Flashcard(
                deck=deck,
                front_question=f"What is the main subject of '{document.title}'?",
                back_answer="Intelligent Document Analysis and Knowledge Retrieval.",
                topic="Overview",
                source_page=1
            ))

        Flashcard.objects.bulk_create(cards)
        deck.card_count = len(cards)
        deck.save()

        return Response(FlashcardDeckSerializer(deck).data, status=status.HTTP_201_CREATED)

class FlashcardDeckDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = FlashcardDeckSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return FlashcardDeck.objects.filter(
            Q(document__workspace__owner=user) | Q(document__workspace__memberships__user=user)
        ).distinct()

class FlashcardUpdateView(generics.UpdateAPIView):
    serializer_class = FlashcardSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return Flashcard.objects.filter(
            Q(deck__document__workspace__owner=user) | Q(deck__document__workspace__memberships__user=user)
        ).distinct()
