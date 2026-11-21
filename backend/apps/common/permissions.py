from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access or edit it.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class IsWorkspaceMember(permissions.BasePermission):
    """
    Allows access only to authenticated users who are members of the given workspace.
    """
    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        if not workspace or not request.user.is_authenticated:
            return False
        return workspace.memberships.filter(user=request.user).exists() or workspace.owner == request.user

class IsWorkspaceAdmin(permissions.BasePermission):
    """
    Allows access only to workspace owners or members with ADMIN role.
    """
    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        if not workspace or not request.user.is_authenticated:
            return False
        if workspace.owner == request.user:
            return True
        return workspace.memberships.filter(
            user=request.user, role__in=['OWNER', 'ADMIN']
        ).exists()
