import urllib.parse
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        UntypedToken(token_string)
        decoded_data = jwt.decode(token_string, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_data.get("user_id")
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, jwt.DecodeError, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom WebSocket middleware that authenticates users via query string token.
    e.g. ws://localhost:8000/ws/rooms/<room_id>/?token=<JWT_ACCESS_TOKEN>
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
