from rest_framework import serializers
from .models import AgentTask, AgentExecutionStep, AgentToolCall
from apps.documents.serializers import DocumentSerializer

class AgentToolCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentToolCall
        fields = ('id', 'tool_name', 'arguments', 'result', 'is_success', 'error_message', 'created_at')

class AgentExecutionStepSerializer(serializers.ModelSerializer):
    tool_calls = AgentToolCallSerializer(many=True, read_only=True)

    class Meta:
        model = AgentExecutionStep
        fields = (
            'id', 'step_number', 'name', 'description', 'tool_name',
            'tool_arguments', 'tool_output', 'status', 'execution_time_ms',
            'tool_calls', 'created_at'
        )

class AgentTaskSerializer(serializers.ModelSerializer):
    selected_documents = DocumentSerializer(many=True, read_only=True)
    step_count = serializers.SerializerMethodField()

    class Meta:
        model = AgentTask
        fields = (
            'id', 'workspace', 'user', 'conversation', 'task_description',
            'intent', 'selected_documents', 'status', 'execution_plan',
            'current_step_index', 'requires_approval', 'approval_status',
            'approval_reason', 'total_tokens_used', 'execution_time_ms',
            'error_message', 'step_count', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'intent', 'status', 'execution_plan',
            'current_step_index', 'approval_status', 'approval_reason',
            'total_tokens_used', 'execution_time_ms', 'error_message',
            'created_at', 'updated_at'
        )

    def get_step_count(self, obj):
        return obj.steps.count()

class AgentTaskDetailSerializer(AgentTaskSerializer):
    steps = AgentExecutionStepSerializer(many=True, read_only=True)

    class Meta(AgentTaskSerializer.Meta):
        fields = AgentTaskSerializer.Meta.fields + (
            'steps', 'final_report', 'findings', 'evidence', 'citations', 'verification_summary'
        )

class CreateAgentTaskSerializer(serializers.Serializer):
    workspace_id = serializers.UUIDField(required=True)
    task_description = serializers.CharField(required=True, min_length=5, max_length=5000)
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        default=list
    )
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    requires_approval = serializers.BooleanField(required=False, default=False)
