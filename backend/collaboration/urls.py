from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudyRoomViewSet,
    ChatMessageViewSet,
    DirectMessageViewSet,
    CollaborativeDocumentViewSet,
    TaskItemViewSet,
    SharedResourceViewSet,
    WhiteboardView
)

router = DefaultRouter()
router.register(r'rooms', StudyRoomViewSet, basename='studyroom')
router.register(r'messages', ChatMessageViewSet, basename='chatmessage')
router.register(r'direct-messages', DirectMessageViewSet, basename='directmessage')
router.register(r'documents', CollaborativeDocumentViewSet, basename='document')
router.register(r'tasks', TaskItemViewSet, basename='task')
router.register(r'resources', SharedResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
    path('rooms/<uuid:room_id>/whiteboard/', WhiteboardView.as_view(), name='room_whiteboard'),
]
