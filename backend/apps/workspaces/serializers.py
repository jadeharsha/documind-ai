from rest_framework import serializers
from .models import Workspace, WorkspaceMembership
from apps.accounts.serializers import UserSerializer

class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = WorkspaceMembership
        fields = ('id', 'workspace', 'user', 'user_email', 'role', 'created_at')
        read_only_fields = ('id', 'created_at', 'workspace')

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'slug', 'description', 'owner', 'is_default', 'settings', 'member_count', 'document_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'owner', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_document_count(self, obj):
        return getattr(obj, 'documents', None).count() if hasattr(obj, 'documents') else 0

class WorkspaceDetailSerializer(WorkspaceSerializer):
    memberships = WorkspaceMembershipSerializer(many=True, read_only=True)

    class Meta(WorkspaceSerializer.Meta):
        fields = WorkspaceSerializer.Meta.fields + ('memberships',)
