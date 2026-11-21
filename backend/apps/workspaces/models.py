import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.common.models import BaseUUIDModel

class Workspace(BaseUUIDModel):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, blank=True)
    description = models.TextField(blank=True, default='')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_workspaces'
    )
    is_default = models.BooleanField(default=False)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('owner', 'name')

    def __str__(self):
        return f"{self.name} ({self.owner.email})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "workspace"
            self.slug = f"{base_slug}-{str(uuid.uuid4())[:8]}"
        super().save(*args, **kwargs)

class WorkspaceMembership(BaseUUIDModel):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
        ('VIEWER', 'Viewer'),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workspace_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')

    class Meta:
        unique_together = ('workspace', 'user')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.email} in {self.workspace.name} as {self.role}"
