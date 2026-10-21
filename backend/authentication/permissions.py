from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import UserRole

class IsInstructor(BasePermission):
    """
    Allows access only to authenticated users with the INSTRUCTOR role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == UserRole.INSTRUCTOR or request.user.is_staff or request.user.is_superuser)
        )

class IsTeachingAssistantOrInstructor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in [UserRole.INSTRUCTOR, UserRole.TA] or request.user.is_staff)
        )

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == UserRole.STUDENT or request.user.is_staff)
        )

class IsAdminUserOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == UserRole.ADMIN or request.user.is_staff)
        )
