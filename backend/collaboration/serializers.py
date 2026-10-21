from rest_framework import serializers
from authentication.serializers import UserProfileSerializer
from .models import (
    StudyRoom,
    GroupMembership,
    ChatMessage,
    DirectMessage,
    CollaborativeDocument,
    TaskItem,
    SharedResource,
    WhiteboardState
)

class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'room', 'role', 'joined_at']

class StudyRoomSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    is_joined = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = StudyRoom
        fields = [
            'id', 'name', 'course_code', 'description', 'category',
            'is_private', 'passcode', 'owner', 'banner_url',
            'members_count', 'max_members', 'created_at', 'updated_at',
            'is_joined', 'my_role'
        ]
        read_only_fields = ['id', 'owner', 'members_count', 'created_at', 'updated_at']

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return GroupMembership.objects.filter(room=obj, user=request.user).exists()

    def get_my_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        membership = GroupMembership.objects.filter(room=obj, user=request.user).first()
        return membership.role if membership else None

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'room', 'sender', 'message_type', 'content',
            'code_language', 'attachment_url', 'attachment_name',
            'created_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at']

class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    recipient = UserProfileSerializer(read_only=True)
    recipient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DirectMessage
        fields = [
            'id', 'sender', 'recipient', 'recipient_id',
            'content', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']

class CollaborativeDocumentSerializer(serializers.ModelSerializer):
    last_modified_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = CollaborativeDocument
        fields = [
            'id', 'room', 'title', 'content', 'last_modified_by',
            'updated_at', 'created_at'
        ]
        read_only_fields = ['id', 'last_modified_by', 'updated_at', 'created_at']

class TaskItemSerializer(serializers.ModelSerializer):
    assigned_to = UserProfileSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = TaskItem
        fields = [
            'id', 'room', 'title', 'description', 'status',
            'priority', 'assigned_to', 'assigned_to_id',
            'created_by', 'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class SharedResourceSerializer(serializers.ModelSerializer):
    uploaded_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = SharedResource
        fields = [
            'id', 'room', 'title', 'description', 'resource_type',
            'file_url', 'file_size_bytes', 'uploaded_by',
            'download_count', 'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'download_count', 'created_at']

class WhiteboardStateSerializer(serializers.ModelSerializer):
    last_updated_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = WhiteboardState
        fields = ['room', 'elements_json', 'last_updated_by', 'updated_at']
        read_only_fields = ['last_updated_by', 'updated_at']
