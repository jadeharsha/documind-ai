from django.urls import path
from .views import (
    ConversationListCreateView, ConversationDetailView,
    ConversationMessagesListView
)

urlpatterns = [
    path('', ConversationListCreateView.as_view(), name='conversation_list_create'),
    path('<uuid:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('<uuid:conversation_id>/messages/', ConversationMessagesListView.as_view(), name='conversation_messages'),
]
