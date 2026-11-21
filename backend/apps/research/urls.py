from django.urls import path
from .views import ResearchAnalysisListCreateView, ResearchAnalysisDetailView

urlpatterns = [
    path('', ResearchAnalysisListCreateView.as_view(), name='research_list_create'),
    path('<uuid:pk>/', ResearchAnalysisDetailView.as_view(), name='research_detail'),
]
