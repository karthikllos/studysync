from django.urls import re_path
from .consumers import StudyRoomConsumer, DirectChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/rooms/(?P<room_id>[0-9a-f-]+)/$', StudyRoomConsumer.as_asgi()),
    re_path(r'ws/direct/(?P<user_id>\d+)/$', DirectChatConsumer.as_asgi()),
]
