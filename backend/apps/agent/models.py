from django.db import models
from django.conf import settings
from apps.common.models import BaseUUIDModel
from apps.workspaces.models import Workspace
from apps.documents.models import Document
from apps.conversations.models import Conversation

class AgentTask(BaseUUIDModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Initialization'),
        ('PLANNING', 'Formulating Structured Plan'),
        ('EXECUTING', 'Executing Steps & Tools'),
        ('WAITING_APPROVAL', 'Awaiting Human Approval'),
        ('VERIFYING', 'Verifying Evidence & Grounding'),
        ('COMPLETED', 'Successfully Completed'),
        ('FAILED', 'Task Failed'),
        ('CANCELLED', 'Cancelled by User'),
    )

    APPROVAL_CHOICES = (
        ('NONE', 'Not Required'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='agent_tasks')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='agent_tasks')
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_tasks')

    task_description = models.TextField()
    intent = models.CharField(max_length=150, blank=True, default='')
    selected_documents = models.ManyToManyField(Document, blank=True, related_name='agent_tasks')

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    execution_plan = models.JSONField(default=list, blank=True)
    current_step_index = models.IntegerField(default=0)

    final_report = models.TextField(blank=True, default='')
    findings = models.JSONField(default=list, blank=True)
    evidence = models.JSONField(default=list, blank=True)
    citations = models.JSONField(default=list, blank=True)
    verification_summary = models.JSONField(default=dict, blank=True)

    requires_approval = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='NONE')
    approval_reason = models.TextField(blank=True, default='')

    total_tokens_used = models.IntegerField(default=0)
    execution_time_ms = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Task {str(self.id)[:8]}: {self.task_description[:50]} ({self.status})"

class AgentExecutionStep(BaseUUIDModel):
    STEP_STATUS = (
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('SKIPPED', 'Skipped'),
    )

    task = models.ForeignKey(AgentTask, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField()
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    tool_name = models.CharField(max_length=100, blank=True, default='')
    tool_arguments = models.JSONField(default=dict, blank=True)
    tool_output = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STEP_STATUS, default='PENDING')
    execution_time_ms = models.IntegerField(default=0)

    class Meta:
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number}: {self.name} ({self.status})"

class AgentToolCall(BaseUUIDModel):
    step = models.ForeignKey(AgentExecutionStep, on_delete=models.CASCADE, related_name='tool_calls')
    tool_name = models.CharField(max_length=100)
    arguments = models.JSONField(default=dict)
    result = models.JSONField(default=dict, blank=True)
    is_success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.tool_name} ({'OK' if self.is_success else 'ERR'})"

class AgentMemory(BaseUUIDModel):
    MEMORY_TYPES = (
        ('SHORT_TERM', 'Short-Term Context'),
        ('TASK', 'Task Intermediate Memory'),
        ('LONG_TERM', 'Explicit Long-Term Knowledge'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    key = models.CharField(max_length=150, db_index=True)
    memory_type = models.CharField(max_length=20, choices=MEMORY_TYPES, default='TASK')
    data = models.JSONField(default=dict)

    class Meta:
        unique_together = ('user', 'workspace', 'key', 'memory_type')

class AgentCheckpoint(BaseUUIDModel):
    task = models.ForeignKey(AgentTask, on_delete=models.CASCADE, related_name='checkpoints')
    step_index = models.IntegerField()
    state_snapshot = models.JSONField(default=dict)

    class Meta:
        ordering = ['step_index']

class AgentUsage(BaseUUIDModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    total_tasks = models.IntegerField(default=0)
    total_tool_calls = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    total_compute_time_ms = models.BigIntegerField(default=0)
