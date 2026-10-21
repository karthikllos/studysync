import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import StudyRoom, ChatMessage, DirectMessage, CollaborativeDocument, WhiteboardState

User = get_user_model()

# In-memory tracking of active room users for instant presence
ROOM_PRESENCE = {}

class StudyRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'study_room_{self.room_id}'
        self.user = self.scope.get('user')

        # Accept connection
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if self.user and self.user.is_authenticated:
            # Mark user online in DB
            await self.set_user_online(self.user, True)

            # Add to room presence tracker
            if self.room_id not in ROOM_PRESENCE:
                ROOM_PRESENCE[self.room_id] = {}
            ROOM_PRESENCE[self.room_id][self.user.id] = {
                'id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.get_full_name() or self.user.username,
                'avatar_url': self.user.avatar_url,
                'role': self.user.role
            }

            # Broadcast updated presence
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'active_users': list(ROOM_PRESENCE[self.room_id].values())
                }
            )

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            if self.room_id in ROOM_PRESENCE and self.user.id in ROOM_PRESENCE[self.room_id]:
                del ROOM_PRESENCE[self.room_id][self.user.id]
                # Broadcast updated presence
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'presence_update',
                        'active_users': list(ROOM_PRESENCE[self.room_id].values())
                    }
                )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'chat_message':
                content = data.get('content', '')
                message_type = data.get('message_type', 'TEXT')
                code_language = data.get('code_language', '')
                attachment_url = data.get('attachment_url', '')
                attachment_name = data.get('attachment_name', '')

                if not self.user or not self.user.is_authenticated:
                    return

                # Save message to indexed database asynchronously
                msg_obj = await self.save_message(
                    room_id=self.room_id,
                    user=self.user,
                    content=content,
                    message_type=message_type,
                    code_language=code_language,
                    attachment_url=attachment_url,
                    attachment_name=attachment_name
                )

                # Broadcast to group with sub-100ms latency
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_broadcast',
                        'message': msg_obj
                    }
                )

            elif action == 'typing':
                is_typing = data.get('is_typing', False)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_broadcast',
                        'user_id': self.user.id if self.user.is_authenticated else None,
                        'username': self.user.get_full_name() or self.user.username if self.user.is_authenticated else 'Anonymous',
                        'is_typing': is_typing
                    }
                )

            elif action == 'doc_update':
                doc_id = data.get('doc_id')
                content = data.get('content', '')
                title = data.get('title', '')
                await self.save_doc_state(doc_id, content, title, self.user)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'doc_broadcast',
                        'doc_id': doc_id,
                        'content': content,
                        'title': title,
                        'user_id': self.user.id if self.user.is_authenticated else None,
                        'username': self.user.get_full_name() or self.user.username if self.user.is_authenticated else 'Anonymous'
                    }
                )

            elif action == 'draw_stroke':
                stroke_data = data.get('stroke')
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'draw_broadcast',
                        'stroke': stroke_data,
                        'user_id': self.user.id if self.user.is_authenticated else None
                    }
                )

            elif action == 'clear_board':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'clear_board_broadcast'
                    }
                )
        except Exception as e:
            pass

    # Group message handlers
    async def chat_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'action': 'chat_message',
            'message': event['message']
        }))

    async def typing_broadcast(self, event):
        # Don't echo typing to self
        if self.user and self.user.is_authenticated and event.get('user_id') == self.user.id:
            return
        await self.send(text_data=json.dumps({
            'action': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing']
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'presence_update',
            'active_users': event['active_users']
        }))

    async def doc_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'action': 'doc_update',
            'doc_id': event['doc_id'],
            'content': event['content'],
            'title': event['title'],
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def draw_broadcast(self, event):
        # Don't echo stroke to the sender
        if self.user and self.user.is_authenticated and event.get('user_id') == self.user.id:
            return
        await self.send(text_data=json.dumps({
            'action': 'draw_stroke',
            'stroke': event['stroke']
        }))

    async def clear_board_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'action': 'clear_board'
        }))

    @database_sync_to_async
    def set_user_online(self, user, online_status):
        try:
            u = User.objects.get(id=user.id)
            u.is_online = online_status
            u.save(update_fields=['is_online'])
        except Exception:
            pass

    @database_sync_to_async
    def save_message(self, room_id, user, content, message_type, code_language, attachment_url, attachment_name):
        room = StudyRoom.objects.get(id=room_id)
        msg = ChatMessage.objects.create(
            room=room,
            sender=user,
            content=content,
            message_type=message_type,
            code_language=code_language,
            attachment_url=attachment_url,
            attachment_name=attachment_name
        )
        return {
            'id': str(msg.id),
            'room': str(room.id),
            'sender': {
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'avatar_url': user.avatar_url,
                'role': user.role
            },
            'content': msg.content,
            'message_type': msg.message_type,
            'code_language': msg.code_language,
            'attachment_url': msg.attachment_url,
            'attachment_name': msg.attachment_name,
            'created_at': msg.created_at.isoformat()
        }

    @database_sync_to_async
    def save_doc_state(self, doc_id, content, title, user):
        if doc_id:
            try:
                doc = CollaborativeDocument.objects.get(id=doc_id)
                doc.content = content
                if title:
                    doc.title = title
                if user and user.is_authenticated:
                    doc.last_modified_by = user
                doc.save()
            except CollaborativeDocument.DoesNotExist:
                pass


class DirectChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.target_user_id = int(self.scope['url_route']['kwargs']['user_id'])
        # Create unique paired group name for 2 users
        user_ids = sorted([self.user.id, self.target_user_id])
        self.room_group_name = f'direct_chat_{user_ids[0]}_{user_ids[1]}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'direct_message':
                content = data.get('content', '')
                if not content.strip():
                    return

                msg_obj = await self.save_direct_message(
                    sender=self.user,
                    recipient_id=self.target_user_id,
                    content=content
                )

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'dm_broadcast',
                        'message': msg_obj
                    }
                )
        except Exception:
            pass

    async def dm_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'action': 'direct_message',
            'message': event['message']
        }))

    @database_sync_to_async
    def save_direct_message(self, sender, recipient_id, content):
        recipient = User.objects.get(id=recipient_id)
        msg = DirectMessage.objects.create(
            sender=sender,
            recipient=recipient,
            content=content
        )
        return {
            'id': str(msg.id),
            'sender': {
                'id': sender.id,
                'username': sender.username,
                'full_name': sender.get_full_name() or sender.username,
                'avatar_url': sender.avatar_url,
                'role': sender.role
            },
            'recipient': {
                'id': recipient.id,
                'username': recipient.username,
                'full_name': recipient.get_full_name() or recipient.username,
                'avatar_url': recipient.avatar_url
            },
            'content': msg.content,
            'is_read': msg.is_read,
            'created_at': msg.created_at.isoformat()
        }
