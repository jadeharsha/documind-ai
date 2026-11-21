from django.urls import path
from .views import (
    FlashcardDeckListCreateView, FlashcardDeckDetailView, FlashcardUpdateView
)

urlpatterns = [
    path('decks/', FlashcardDeckListCreateView.as_view(), name='flashcard_decks'),
    path('decks/<uuid:pk>/', FlashcardDeckDetailView.as_view(), name='flashcard_deck_detail'),
    path('cards/<uuid:pk>/', FlashcardUpdateView.as_view(), name='flashcard_update'),
]
