from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_health(request):
    return JsonResponse({
        'status': 'healthy',
        'platform': 'StudySync Academic Collaboration Platform',
        'version': '1.0.0',
        'websockets': 'ASGI Daphne/Channels Active',
        'authentication': 'Stateless SimpleJWT with RBAC'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', api_health, name='api_health'),
    path('api/auth/', include('authentication.urls')),
    path('api/collab/', include('collaboration.urls')),
]
