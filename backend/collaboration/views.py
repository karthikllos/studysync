from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import (
    StudyRoom,
    GroupMembership,
    GroupRole,
    ChatMessage,
    DirectMessage,
    CollaborativeDocument,
    TaskItem,
    SharedResource,
    WhiteboardState
)
from .serializers import (
    StudyRoomSerializer,
    GroupMembershipSerializer,
    ChatMessageSerializer,
    DirectMessageSerializer,
    CollaborativeDocumentSerializer,
    TaskItemSerializer,
    SharedResourceSerializer,
    WhiteboardStateSerializer
)

User = get_user_model()

class StudyRoomViewSet(viewsets.ModelViewSet):
    queryset = StudyRoom.objects.all().select_related('owner')
    serializer_class = StudyRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudyRoom.objects.all().select_related('owner')
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        my_only = self.request.query_params.get('my_rooms', None)

        if category and category != 'ALL':
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(course_code__icontains=search) |
                Q(description__icontains=search)
            )
        if my_only == 'true':
            queryset = queryset.filter(memberships__user=self.request.user)
        return queryset.distinct()

    def perform_create(self, serializer):
        room = serializer.save(owner=self.request.user)
        # Add creator as LEADER
        GroupMembership.objects.create(
            user=self.request.user,
            room=room,
            role=GroupRole.LEADER
        )
        # Create default collaborative document
        CollaborativeDocument.objects.create(
            room=room,
            title=f"Welcome & Study Notes - {room.course_code}",
            content=f"# 📚 {room.name} ({room.course_code})\n\nWelcome everyone! Use this live collaborative document to brainstorm, outline assignments, and share lecture key points.\n\n### Upcoming Deadlines & Goals:\n- [ ] Review Chapter 1\n- [ ] Prepare Problem Set 1\n",
            last_modified_by=self.request.user
        )
        # Create initial whiteboard state
        WhiteboardState.objects.create(
            room=room,
            elements_json='[]',
            last_updated_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        room = self.get_object()
        if room.is_private:
            passcode = request.data.get('passcode', '')
            if passcode != room.passcode:
                return Response({'error': 'Incorrect passcode for private room.'}, status=status.HTTP_403_FORBIDDEN)

        membership, created = GroupMembership.objects.get_or_create(
            user=request.user,
            room=room,
            defaults={'role': GroupRole.MEMBER}
        )
        if created:
            room.members_count = room.memberships.count()
            room.save(update_fields=['members_count'])
            # Send system message in chat
            ChatMessage.objects.create(
                room=room,
                sender=request.user,
                message_type='SYSTEM',
                content=f"🎉 {request.user.get_full_name() or request.user.username} joined the study room."
            )
        return Response({'message': 'Joined room successfully.', 'role': membership.role})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        room = self.get_object()
        membership = GroupMembership.objects.filter(user=request.user, room=room).first()
        if membership:
            membership.delete()
            room.members_count = room.memberships.count()
            room.save(update_fields=['members_count'])
            ChatMessage.objects.create(
                room=room,
                sender=request.user,
                message_type='SYSTEM',
                content=f"👋 {request.user.get_full_name() or request.user.username} left the study room."
            )
            return Response({'message': 'Left room successfully.'})
        return Response({'error': 'You are not a member of this room.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        room = self.get_object()
        memberships = room.memberships.select_related('user').all()
        return Response(GroupMembershipSerializer(memberships, many=True).data)

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all().select_related('sender')
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room', None)
        if room_id:
            return ChatMessage.objects.filter(room_id=room_id).select_related('sender').order_by('created_at')
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        room = get_object_or_404(StudyRoom, id=room_id)
        serializer.save(sender=self.request.user, room=room)

class DirectMessageViewSet(viewsets.ModelViewSet):
    serializer_class = DirectMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_user_id = self.request.query_params.get('with_user', None)
        if other_user_id:
            return DirectMessage.objects.filter(
                (Q(sender=user) & Q(recipient_id=other_user_id)) |
                (Q(sender_id=other_user_id) & Q(recipient=user))
            ).select_related('sender', 'recipient').order_by('created_at')
        
        # Default: all messages involving user
        return DirectMessage.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).select_related('sender', 'recipient').order_by('created_at')

    def perform_create(self, serializer):
        recipient_id = self.request.data.get('recipient_id')
        recipient = get_object_or_404(User, id=recipient_id)
        serializer.save(sender=self.request.user, recipient=recipient)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        other_user_id = request.data.get('sender_id')
        if other_user_id:
            DirectMessage.objects.filter(sender_id=other_user_id, recipient=request.user, is_read=False).update(is_read=True)
            return Response({'message': 'Messages marked as read.'})
        return Response({'error': 'Missing sender_id'}, status=status.HTTP_400_BAD_REQUEST)

class CollaborativeDocumentViewSet(viewsets.ModelViewSet):
    queryset = CollaborativeDocument.objects.all().select_related('last_modified_by', 'room')
    serializer_class = CollaborativeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room', None)
        if room_id:
            return CollaborativeDocument.objects.filter(room_id=room_id).select_related('last_modified_by')
        return CollaborativeDocument.objects.all().select_related('last_modified_by')

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        room = get_object_or_404(StudyRoom, id=room_id)
        serializer.save(room=room, last_modified_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(last_modified_by=self.request.user)

class TaskItemViewSet(viewsets.ModelViewSet):
    queryset = TaskItem.objects.all().select_related('assigned_to', 'created_by')
    serializer_class = TaskItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room', None)
        if room_id:
            return TaskItem.objects.filter(room_id=room_id).select_related('assigned_to', 'created_by')
        return TaskItem.objects.all().select_related('assigned_to', 'created_by')

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        room = get_object_or_404(StudyRoom, id=room_id)
        assigned_to_id = self.request.data.get('assigned_to_id')
        assigned_to = User.objects.filter(id=assigned_to_id).first() if assigned_to_id else None
        serializer.save(room=room, created_by=self.request.user, assigned_to=assigned_to)

    def perform_update(self, serializer):
        assigned_to_id = self.request.data.get('assigned_to_id')
        if assigned_to_id is not None:
            assigned_to = User.objects.filter(id=assigned_to_id).first() if assigned_to_id else None
            serializer.save(assigned_to=assigned_to)
        else:
            serializer.save()

class SharedResourceViewSet(viewsets.ModelViewSet):
    queryset = SharedResource.objects.all().select_related('uploaded_by')
    serializer_class = SharedResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room', None)
        if room_id:
            return SharedResource.objects.filter(room_id=room_id).select_related('uploaded_by')
        return SharedResource.objects.all().select_related('uploaded_by')

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        room = get_object_or_404(StudyRoom, id=room_id)
        serializer.save(room=room, uploaded_by=self.request.user)

    @action(detail=True, methods=['post'])
    def increment_download(self, request, pk=None):
        resource = self.get_object()
        resource.download_count += 1
        resource.save(update_fields=['download_count'])
        return Response({'download_count': resource.download_count})

class WhiteboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(StudyRoom, id=room_id)
        whiteboard, _ = WhiteboardState.objects.get_or_create(
            room=room,
            defaults={'elements_json': '[]', 'last_updated_by': request.user}
        )
        return Response(WhiteboardStateSerializer(whiteboard).data)

    def post(self, request, room_id):
        room = get_object_or_404(StudyRoom, id=room_id)
        elements_json = request.data.get('elements_json', '[]')
        whiteboard, _ = WhiteboardState.objects.update_or_create(
            room=room,
            defaults={'elements_json': elements_json, 'last_updated_by': request.user}
        )
        return Response(WhiteboardStateSerializer(whiteboard).data)
