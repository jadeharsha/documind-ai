from django.db import models
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace

class SubscriptionPlan(BaseUUIDModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    max_documents = models.IntegerField(default=50)
    max_workspaces = models.IntegerField(default=3)
    max_file_size_mb = models.IntegerField(default=25)
    max_agent_tasks_monthly = models.IntegerField(default=100)
    features = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mo)"

class WorkspaceSubscription(BaseUUIDModel):
    workspace = models.OneToOneField(Workspace, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    is_active = models.BooleanField(default=True)
    valid_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.workspace.name} - {self.plan.name}"
