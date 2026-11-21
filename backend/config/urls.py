from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "DocuMind AI Backend API",
        "version": "1.0.0",
        "database": settings.DB_ENGINE,
        "storage": settings.STORAGE_BACKEND
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),

    # API v1 Endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/workspaces/', include('apps.workspaces.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/rag/', include('apps.rag.urls')),
    path('api/v1/conversations/', include('apps.conversations.urls')),
    path('api/v1/summaries/', include('apps.summaries.urls')),
    path('api/v1/comparison/', include('apps.comparison.urls')),
    path('api/v1/research/', include('apps.research.urls')),
    path('api/v1/extraction/', include('apps.extraction.urls')),
    path('api/v1/quizzes/', include('apps.quizzes.urls')),
    path('api/v1/flashcards/', include('apps.flashcards.urls')),
    path('api/v1/agent/', include('apps.agent.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
