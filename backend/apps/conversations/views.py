from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationDetailSerializer, MessageSerializer
from apps.workspaces.models import Workspace
from rest_framework.exceptions import PermissionDenied, ValidationError

class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        qs = Conversation.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace": "Workspace not found."})

        if workspace.owner != self.request.user and not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied("You do not have permission in this workspace.")

        serializer.save(user=self.request.user, workspace=workspace)

class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ConversationDetailSerializer
        return ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()

class ConversationMessagesListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        conv_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(
            conversation_id=conv_id,
            conversation__user=self.request.user
        )

    def perform_create(self, serializer):
        conv_id = self.kwargs.get('conversation_id')
        try:
            conversation = Conversation.objects.get(id=conv_id, user=self.request.user)
        except Conversation.DoesNotExist:
            raise ValidationError("Conversation does not exist.")
        serializer.save(conversation=conversation)
