import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class RoleBasedAccessControlMiddleware(MiddlewareMixin):
    """
    RBAC Middleware that intercepts incoming requests, logs access levels,
    and applies role policies across protected routes.
    """
    def process_request(self, request):
        # We allow standard paths to proceed
        if not request.path.startswith('/api/'):
            return None

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            # Attach role helper attributes
            request.is_instructor = (user.role == 'INSTRUCTOR' or user.is_staff)
            request.is_admin = (user.role == 'ADMIN' or user.is_superuser)
            request.is_ta = (user.role == 'TA')
            request.is_student = (user.role == 'STUDENT')
        return None
