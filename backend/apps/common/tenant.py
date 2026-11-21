from rest_framework.exceptions import PermissionDenied, NotFound
from apps.workspaces.models import Workspace

def get_tenant_workspace(workspace_id, user):
    """
    Validates and returns the workspace only if the requesting user is the owner
    or an active member. Never relies on user-supplied ownership claims.
    """
    try:
        workspace = Workspace.objects.get(id=workspace_id)
    except Workspace.DoesNotExist:
        raise NotFound("Workspace not found.")

    if workspace.owner != user and not workspace.memberships.filter(user=user).exists():
        raise PermissionDenied("You do not have permission to access this workspace.")

    return workspace
