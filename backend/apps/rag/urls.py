from django.urls import path
from .views import RAGQueryView, CitationVerificationView

urlpatterns = [
    path('query/', RAGQueryView.as_view(), name='rag_query'),
    path('verify-citation/', CitationVerificationView.as_view(), name='rag_verify_citation'),
]
