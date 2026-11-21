from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.workspaces.models import Workspace
from .serializers import RAGQuerySerializer, RAGResponseSerializer
from .services.rag_engine import RAGEngine
from apps.conversations.models import Conversation, Message, MessageCitation

class RAGQueryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = RAGQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = serializer.validated_data['workspace_id']
        query = serializer.validated_data['query']
        document_ids = serializer.validated_data.get('document_ids', [])
        conversation_id = serializer.validated_data.get('conversation_id')
        top_k = serializer.validated_data.get('top_k', 5)

        # 1. Tenant & Workspace validation
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            raise ValidationError({"workspace_id": "Workspace not found."})

        if workspace.owner != request.user and not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have access to this workspace.")

        # 2. Conversation history if applicable
        history = []
        conversation = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, workspace=workspace)
                recent_msgs = conversation.messages.order_by('created_at')[:8]
                history = [{"role": m.role, "content": m.content} for m in recent_msgs]
            except Conversation.DoesNotExist:
                pass

        # 3. Execute Grounded RAG
        rag_engine = RAGEngine()
        result = rag_engine.answer_query(
            query=query,
            workspace_id=str(workspace.id),
            owner_id=str(request.user.id),
            document_ids=[str(d) for d in document_ids] if document_ids else None,
            conversation_history=history,
            top_k=top_k
        )

        # 4. Save to conversation if conversation_id provided
        if conversation:
            # User message
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=query
            )
            # Assistant message
            asst_msg = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=result['answer'],
                confidence_score=result['confidence_score']
            )
            for c in result['citations']:
                MessageCitation.objects.create(
                    message=asst_msg,
                    document_id=c['document_id'],
                    page_number=c['page_number'],
                    passage_excerpt=c['passage_excerpt'],
                    score=c['score']
                )

        return Response(result, status=status.HTTP_200_OK)

class CitationVerificationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Validates citation accuracy against source document chunks.
        """
        claim = request.data.get('claim', '')
        passage = request.data.get('passage', '')
        if not claim or not passage:
            return Response({"verified": False, "reason": "Both claim and passage are required."}, status=400)

        # Basic overlap / verification check
        claim_words = set(claim.lower().split())
        passage_words = set(passage.lower().split())
        overlap = claim_words.intersection(passage_words)
        ratio = len(overlap) / (len(claim_words) or 1)

        return Response({
            "verified": ratio >= 0.4,
            "overlap_ratio": round(ratio, 3),
            "claim": claim,
            "status": "grounded" if ratio >= 0.4 else "unsupported"
        })
