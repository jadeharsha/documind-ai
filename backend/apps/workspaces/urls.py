from django.urls import path
from .views import (
    WorkspaceListCreateView, WorkspaceDetailView,
    WorkspaceMembersListCreateView, WorkspaceMemberDetailView
)

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace_list_create'),
    path('<uuid:pk>/', WorkspaceDetailView.as_view(), name='workspace_detail'),
    path('<uuid:workspace_id>/members/', WorkspaceMembersListCreateView.as_view(), name='workspace_members'),
    path('<uuid:workspace_id>/members/<uuid:pk>/', WorkspaceMemberDetailView.as_view(), name='workspace_member_detail'),
]
