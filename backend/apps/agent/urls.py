from django.urls import path
from .views import (
    AgentTaskListCreateView, AgentTaskDetailView, AgentTaskStatusView,
    AgentTaskResultsView, AgentTaskStepsView, AgentTaskCitationsView,
    AgentTaskCancelView, AgentTaskApproveView, AgentTaskRejectView,
    AgentToolsListView, AgentUsageView
)

urlpatterns = [
    path('tasks/', AgentTaskListCreateView.as_view(), name='agent_task_list_create'),
    path('tasks/<uuid:pk>/', AgentTaskDetailView.as_view(), name='agent_task_detail'),
    path('tasks/<uuid:task_id>/status/', AgentTaskStatusView.as_view(), name='agent_task_status'),
    path('tasks/<uuid:task_id>/results/', AgentTaskResultsView.as_view(), name='agent_task_results'),
    path('tasks/<uuid:task_id>/steps/', AgentTaskStepsView.as_view(), name='agent_task_steps'),
    path('tasks/<uuid:task_id>/citations/', AgentTaskCitationsView.as_view(), name='agent_task_citations'),
    path('tasks/<uuid:task_id>/cancel/', AgentTaskCancelView.as_view(), name='agent_task_cancel'),
    path('tasks/<uuid:task_id>/approve/', AgentTaskApproveView.as_view(), name='agent_task_approve'),
    path('tasks/<uuid:task_id>/reject/', AgentTaskRejectView.as_view(), name='agent_task_reject'),
    path('tools/', AgentToolsListView.as_view(), name='agent_tools'),
    path('usage/', AgentUsageView.as_view(), name='agent_usage'),
]
