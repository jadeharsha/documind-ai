from django.urls import path
from .views import (
    DocumentListCreateView, DocumentDetailView,
    DocumentChunksListView, DocumentCollectionListCreateView,
    DocumentCollectionDetailView
)

urlpatterns = [
    path('', DocumentListCreateView.as_view(), name='document_list_create'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document_detail'),
    path('<uuid:document_id>/chunks/', DocumentChunksListView.as_view(), name='document_chunks'),
    path('collections/', DocumentCollectionListCreateView.as_view(), name='document_collections'),
    path('collections/<uuid:pk>/', DocumentCollectionDetailView.as_view(), name='document_collection_detail'),
]
