from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
    TA = 'TA', 'Teaching Assistant'
    ADMIN = 'ADMIN', 'Administrator'

class User(AbstractUser):
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        db_index=True
    )
    institution = models.CharField(max_length=150, blank=True, default='')
    major_or_department = models.CharField(max_length=150, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.CharField(
        max_length=500,
        blank=True,
        default='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    )
    study_streak_days = models.PositiveIntegerField(default=1)
    total_study_minutes = models.PositiveIntegerField(default=0)
    is_online = models.BooleanField(default=False, db_index=True)
    last_active = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_online']),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
