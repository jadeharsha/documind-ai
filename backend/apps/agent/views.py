from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from django.db.models import Q
from .models import AgentTask, AgentExecutionStep, AgentToolCall, AgentUsage
from .serializers import (
    AgentTaskSerializer, AgentTaskDetailSerializer,
    AgentExecutionStepSerializer, CreateAgentTaskSerializer
)
from .tools.registry import ToolRegistry
from .orchestrator.langgraph_workflow import AgentWorkflowOrchestrator
from apps.workspaces.models import Workspace
from apps.documents.models import Document

class AgentTaskListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateAgentTaskSerializer
        return AgentTaskSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AgentTask.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateAgentTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = serializer.validated_data['workspace_id']
        task_desc = serializer.validated_data['task_description']
        doc_ids = serializer.validated_data.get('document_ids', [])
        conversation_id = serializer.validated_data.get('conversation_id')
        requires_approval = serializer.validated_data.get('requires_approval', False)

        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace_id": "Workspace not found."})

        if workspace.owner != request.user and not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have permission in this workspace.")

        task = AgentTask.objects.create(
            user=request.user,
            workspace=workspace,
            conversation_id=conversation_id,
            task_description=task_desc,
            requires_approval=requires_approval,
            approval_status='PENDING' if requires_approval else 'NONE',
            status='PENDING'
        )

        if doc_ids:
            docs = Document.objects.filter(id__in=doc_ids, workspace=workspace)
            task.selected_documents.set(docs)

        # Run workflow orchestrator
        orchestrator = AgentWorkflowOrchestrator(str(task.id))
        completed_task = orchestrator.run() or task

        return Response(AgentTaskDetailSerializer(completed_task).data, status=status.HTTP_201_CREATED)

class AgentTaskDetailView(generics.RetrieveAPIView):
    serializer_class = AgentTaskDetailSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return AgentTask.objects.filter(
            Q(workspace__owner=user) | Q(workspace__memberships__user=user)
        ).distinct()

class AgentTaskStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        return Response({
            "task_id": str(task.id),
            "status": task.status,
            "current_step": task.current_step_index,
            "total_steps": len(task.execution_plan),
            "requires_approval": task.requires_approval,
            "approval_status": task.approval_status,
            "execution_time_ms": task.execution_time_ms,
            "error_message": task.error_message
        })

class AgentTaskResultsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        return Response({
            "task_id": str(task.id),
            "status": task.status,
            "final_report": task.final_report,
            "findings": task.findings,
            "evidence": task.evidence,
            "citations": task.citations,
            "verification": task.verification_summary
        })

class AgentTaskStepsView(generics.ListAPIView):
    serializer_class = AgentExecutionStepSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return AgentExecutionStep.objects.filter(task_id=task_id).order_by('step_number')

class AgentTaskCitationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        return Response({"citations": task.citations})

class AgentTaskCancelView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id, user=request.user)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        if task.status in ['COMPLETED', 'FAILED', 'CANCELLED']:
            return Response({"detail": f"Task is already {task.status}."}, status=status.HTTP_400_BAD_REQUEST)

        task.status = 'CANCELLED'
        task.save(update_fields=['status', 'updated_at'])
        return Response({"message": "Task successfully cancelled.", "status": task.status})

class AgentTaskApproveView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id, user=request.user)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        task.approval_status = 'APPROVED'
        task.approval_reason = request.data.get('reason', 'User approved execution.')
        task.status = 'EXECUTING'
        task.save(update_fields=['approval_status', 'approval_reason', 'status', 'updated_at'])
        return Response({"message": "Task approved. Continuing execution.", "status": task.status})

class AgentTaskRejectView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, task_id):
        try:
            task = AgentTask.objects.get(id=task_id, user=request.user)
        except AgentTask.DoesNotExist:
            raise NotFound("Task not found.")

        task.approval_status = 'REJECTED'
        task.approval_reason = request.data.get('reason', 'User rejected execution.')
        task.status = 'CANCELLED'
        task.save(update_fields=['approval_status', 'approval_reason', 'status', 'updated_at'])
        return Response({"message": "Task rejected and halted.", "status": task.status})

class AgentToolsListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        registry = ToolRegistry()
        return Response({"tools": registry.list_tools()})

class AgentUsageView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        total_tasks = AgentTask.objects.filter(user=request.user).count()
        completed_tasks = AgentTask.objects.filter(user=request.user, status='COMPLETED').count()
        return Response({
            "total_tasks_initiated": total_tasks,
            "tasks_completed": completed_tasks,
            "tasks_success_rate": round(completed_tasks / (total_tasks or 1) * 100, 1),
            "allowed_concurrent_tasks": 3,
            "max_execution_steps": 15
        })
