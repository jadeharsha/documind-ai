from django.urls import path
from .views import ExtractedTableListView, ExtractedEntityListView, RunExtractionView

urlpatterns = [
    path('documents/<uuid:document_id>/tables/', ExtractedTableListView.as_view(), name='extracted_tables'),
    path('documents/<uuid:document_id>/entities/', ExtractedEntityListView.as_view(), name='extracted_entities'),
    path('documents/<uuid:document_id>/run/', RunExtractionView.as_view(), name='run_extraction'),
]
