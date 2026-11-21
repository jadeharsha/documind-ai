import uuid
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.documents.models import Document, DocumentChunkMetadata
from apps.agent.models import AgentTask
from apps.agent.tools.registry import ToolRegistry

User = get_user_model()

class DocuMindComprehensiveBackendTests(APITestCase):
    def setUp(self):
        # Create Primary Tenant User
        self.user1 = User.objects.create_user(
            email="harsha@documind.ai",
            password="SecurePassword2026!",
            first_name="Harsha",
            last_name="Vardhan"
        )
        # Create Second Tenant User to test tenant isolation
        self.user2 = User.objects.create_user(
            email="other@tenant.ai",
            password="SecurePassword2026!",
            first_name="Other",
            last_name="User"
        )

        # Create Workspace for User 1
        self.workspace1 = Workspace.objects.create(
            name="Research Lab",
            owner=self.user1,
            is_default=True
        )
        WorkspaceMembership.objects.create(
            workspace=self.workspace1,
            user=self.user1,
            role="OWNER"
        )

        # Authenticate User 1
        self.client.force_authenticate(user=self.user1)

    def test_01_user_registration_and_jwt_tokens(self):
        """Verify user registration returns JWT access & refresh tokens."""
        self.client.logout()
        res = self.client.post(reverse('auth_register'), {
            "email": "newuser@documind.ai",
            "password": "Password1234!",
            "password_confirm": "Password1234!",
            "first_name": "Test",
            "last_name": "Developer"
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", res.data)
        self.assertIn("access", res.data["tokens"])
        self.assertIn("refresh", res.data["tokens"])

    def test_02_workspace_crud_and_tenant_isolation(self):
        """Verify workspace creation and that user2 cannot access user1's workspace."""
        # User 1 can view workspace
        res = self.client.get(reverse('workspace_list_create'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

        # Switch to User 2
        self.client.force_authenticate(user=self.user2)
        res2 = self.client.get(reverse('workspace_detail', kwargs={'pk': self.workspace1.id}))
        # User 2 must receive 404 or 403 (tenant isolation enforced)
        self.assertIn(res2.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_03_document_creation_and_chunks(self):
        """Verify document metadata creation and page-preserving chunk associations."""
        doc = Document.objects.create(
            workspace=self.workspace1,
            owner=self.user1,
            title="Transformer Attention Paper",
            file_name="attention.pdf",
            file_size=102400,
            mime_type="application/pdf",
            file_extension=".pdf",
            storage_key="test_attention_key.pdf",
            status="INDEXED",
            page_count=12,
            chunk_count=2
        )
        c1 = DocumentChunkMetadata.objects.create(
            document=doc,
            chunk_index=0,
            page_number=1,
            page_start=1,
            page_end=1,
            qdrant_point_id=str(uuid.uuid4()),
            chunk_text_preview="Attention Is All You Need. We propose the Transformer architecture."
        )

        res = self.client.get(reverse('document_detail', kwargs={'pk': doc.id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], "Transformer Attention Paper")
        self.assertEqual(res.data['page_count'], 12)

    def test_04_grounded_rag_query_execution(self):
        """Verify grounded RAG pipeline answers and returns page citations."""
        doc = Document.objects.create(
            workspace=self.workspace1,
            owner=self.user1,
            title="Generative AI Overview",
            file_name="genai.pdf",
            file_size=20480,
            mime_type="application/pdf",
            file_extension=".pdf",
            storage_key="test_genai.pdf",
            status="INDEXED"
        )
        DocumentChunkMetadata.objects.create(
            document=doc,
            chunk_index=0,
            page_number=3,
            page_start=3,
            page_end=3,
            qdrant_point_id=str(uuid.uuid4()),
            chunk_text_preview="DocuMind AI utilizes stateful agent workflows with verifiable citations."
        )

        res = self.client.post(reverse('rag_query'), {
            "query": "How does DocuMind AI work?",
            "workspace_id": str(self.workspace1.id),
            "document_ids": [str(doc.id)]
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("answer", res.data)
        self.assertIn("citations", res.data)

    def test_05_agent_orchestration_and_tool_execution(self):
        """Verify agent task planning, deterministic tool execution, and verification."""
        res = self.client.post(reverse('agent_task_list_create'), {
            "workspace_id": str(self.workspace1.id),
            "task_description": "Analyze research methodology and calculate performance statistics.",
            "document_ids": []
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data)
        self.assertEqual(res.data['status'], 'COMPLETED')
        self.assertGreater(len(res.data['execution_plan']), 0)
        self.assertIn("final_report", res.data)
        self.assertIn("findings", res.data)

    def test_06_tool_registry_statistics_deterministic_accuracy(self):
        """Verify calculate_statistics tool executes exact Python math rather than LLM guessing."""
        registry = ToolRegistry()
        dummy_task = AgentTask(
            user=self.user1,
            workspace=self.workspace1,
            task_description="Test math"
        )
        tool_res = registry.execute_tool(
            "calculate_statistics",
            task=dummy_task,
            numbers=[10.0, 20.0, 30.0, 40.0]
        )
        self.assertTrue(tool_res["success"])
        stats = tool_res["data"]["statistics"]
        self.assertEqual(stats["sum"], 100.0)
        self.assertEqual(stats["mean"], 25.0)
        self.assertEqual(stats["min"], 10.0)
        self.assertEqual(stats["max"], 40.0)
