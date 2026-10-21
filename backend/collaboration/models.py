import uuid
from django.db import models
from django.conf import settings

class GroupRole(models.TextChoices):
    LEADER = 'LEADER', 'Group Leader'
    MODERATOR = 'MODERATOR', 'Moderator'
    MEMBER = 'MEMBER', 'Member'

class RoomCategory(models.TextChoices):
    COMPUTER_SCIENCE = 'CS', 'Computer Science & Software'
    ARTIFICIAL_INTELLIGENCE = 'AI', 'AI & Machine Learning'
    MATHEMATICS = 'MATH', 'Mathematics & Statistics'
    PHYSICS_ENGINEERING = 'ENG', 'Physics & Engineering'
    BIOLOGY_CHEMISTRY = 'SCI', 'Biology & Chemistry'
    GENERAL_STUDY = 'GEN', 'General Study & Exam Prep'

class StudyRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    course_code = models.CharField(max_length=30, db_index=True)
    description = models.TextField(blank=True, default='')
    category = models.CharField(
        max_length=10,
        choices=RoomCategory.choices,
        default=RoomCategory.COMPUTER_SCIENCE,
        db_index=True
    )
    is_private = models.BooleanField(default=False)
    passcode = models.CharField(max_length=32, blank=True, default='')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_rooms',
        db_index=True
    )
    banner_url = models.CharField(
        max_length=500,
        blank=True,
        default='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80'
    )
    members_count = models.PositiveIntegerField(default=1)
    max_members = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course_code']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
            models.Index(fields=['owner', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.course_code}] {self.name}"

class GroupMembership(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='room_memberships',
        db_index=True
    )
    room = models.ForeignKey(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='memberships',
        db_index=True
    )
    role = models.CharField(
        max_length=20,
        choices=GroupRole.choices,
        default=GroupRole.MEMBER
    )
    joined_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'room')
        indexes = [
            models.Index(fields=['user', 'room']),
            models.Index(fields=['room', 'role']),
            models.Index(fields=['joined_at']),
        ]

    def __str__(self):
        return f"{self.user.username} in {self.room.name} ({self.role})"

class MessageType(models.TextChoices):
    TEXT = 'TEXT', 'Text Message'
    CODE = 'CODE', 'Code Snippet'
    FILE = 'FILE', 'File Attachment'
    SYSTEM = 'SYSTEM', 'System Notification'
    POLL = 'POLL', 'Study Poll'

class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_room_messages',
        db_index=True
    )
    message_type = models.CharField(
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.TEXT,
        db_index=True
    )
    content = models.TextField()
    code_language = models.CharField(max_length=30, blank=True, default='')
    attachment_url = models.CharField(max_length=500, blank=True, default='')
    attachment_name = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['room', '-created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['message_type']),
        ]

    def __str__(self):
        return f"{self.sender.username} in {self.room.course_code}: {self.content[:30]}"

class DirectMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_direct_messages',
        db_index=True
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_direct_messages',
        db_index=True
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['sender', 'recipient', 'created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:30]}"

class CollaborativeDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='documents',
        db_index=True
    )
    title = models.CharField(max_length=200, default='Untitled Study Notes')
    content = models.TextField(blank=True, default='# Study Session Notes\n\n- Key concepts:\n- References:\n')
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_documents'
    )
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['room', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.room.course_code})"

class TaskStatus(models.TextChoices):
    TODO = 'TODO', 'To Do'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    DONE = 'DONE', 'Completed'

class TaskPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High / Urgent'

class TaskItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='tasks',
        db_index=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
        db_index=True
    )
    priority = models.CharField(
        max_length=10,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['status', '-updated_at']
        indexes = [
            models.Index(fields=['room', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title}"

class SharedResource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='resources',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    resource_type = models.CharField(max_length=50, default='PDF Document')
    file_url = models.CharField(max_length=500)
    file_size_bytes = models.PositiveIntegerField(default=102400)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_resources'
    )
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.resource_type})"

class WhiteboardState(models.Model):
    room = models.OneToOneField(
        StudyRoom,
        on_delete=models.CASCADE,
        related_name='whiteboard',
        primary_key=True
    )
    elements_json = models.TextField(default='[]')
    last_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Whiteboard for {self.room.name}"
