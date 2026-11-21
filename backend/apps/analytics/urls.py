from django.urls import path
from .views import DashboardStatsView, AnalyticsMetricsView

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='analytics_dashboard'),
    path('metrics/', AnalyticsMetricsView.as_view(), name='analytics_metrics'),
]
