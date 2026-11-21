from django.urls import path
from .views import SummaryListCreateView, SummaryDetailView

urlpatterns = [
    path('', SummaryListCreateView.as_view(), name='summary_list_create'),
    path('<uuid:pk>/', SummaryDetailView.as_view(), name='summary_detail'),
]
