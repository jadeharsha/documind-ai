from django.urls import path
from .views import ComparisonListCreateView, ComparisonDetailView

urlpatterns = [
    path('', ComparisonListCreateView.as_view(), name='comparison_list_create'),
    path('<uuid:pk>/', ComparisonDetailView.as_view(), name='comparison_detail'),
]
