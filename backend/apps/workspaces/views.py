from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMembership
from .serializers import (
    WorkspaceSerializer, WorkspaceDetailSerializer,
    WorkspaceMembershipSerializer
)
from apps.common.permissions import IsWorkspaceMember, IsWorkspaceAdmin

User = get_user_model()

class WorkspaceListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkspaceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(
            Q(owner=user) | Q(memberships__user=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        existing_count = Workspace.objects.filter(owner=user).count()
        is_default = (existing_count == 0)

        workspace = serializer.save(owner=user, is_default=is_default)
        # Create Owner Membership
        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=user,
            role='OWNER'
        )

class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return WorkspaceDetailSerializer
        return WorkspaceSerializer

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(
            Q(owner=user) | Q(memberships__user=user)
        ).distinct()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            raise PermissionDenied("Only the workspace owner can delete this workspace.")
        instance.delete()

class WorkspaceMembersListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkspaceMembershipSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceAdmin)

    def get_queryset(self):
        workspace_id = self.kwargs.get('workspace_id')
        return WorkspaceMembership.objects.filter(workspace_id=workspace_id)

    def perform_create(self, serializer):
        workspace_id = self.kwargs.get('workspace_id')
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError("Workspace does not exist.")

        # Validate permission
        if workspace.owner != self.request.user and not workspace.memberships.filter(
            user=self.request.user, role__in=['OWNER', 'ADMIN']
        ).exists():
            raise PermissionDenied("You do not have permission to add members.")

        email = serializer.validated_data.get('user_email')
        if not email:
            raise ValidationError({"user_email": "This field is required."})

        try:
            target_user = User.objects.get(email=email.strip().lower())
        except User.DoesNotExist:
            raise ValidationError({"user_email": f"No user registered with email {email}."})

        if WorkspaceMembership.objects.filter(workspace=workspace, user=target_user).exists():
            raise ValidationError({"user_email": "User is already a member of this workspace."})

        serializer.save(workspace=workspace, user=target_user)

class WorkspaceMemberDetailView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceAdmin)

    def get_queryset(self):
        workspace_id = self.kwargs.get('workspace_id')
        return WorkspaceMembership.objects.filter(workspace_id=workspace_id)

    def perform_destroy(self, instance):
        if instance.role == 'OWNER':
            raise PermissionDenied("Cannot remove the owner of the workspace.")
        instance.delete()
