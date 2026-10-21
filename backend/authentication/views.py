from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Generate tokens immediately upon registration
        token_serializer = CustomTokenObtainPairSerializer()
        token_data = token_serializer.get_token(user)
        refresh = str(token_data)
        access = str(token_data.access_token)

        return Response({
            'user': UserProfileSerializer(user).data,
            'access': access,
            'refresh': refresh,
            'message': 'Account successfully created!'
        }, status=status.HTTP_201_CREATED)

class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-is_online', 'first_name')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(username__icontains=search) | queryset.filter(first_name__icontains=search) | queryset.filter(email__icontains=search)
        return queryset

class RecordStudySessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        minutes = int(request.data.get('minutes', 25))
        user = request.user
        user.total_study_minutes += minutes
        user.save(update_fields=['total_study_minutes'])
        return Response({
            'total_study_minutes': user.total_study_minutes,
            'added_minutes': minutes,
            'message': f'Recorded {minutes} minutes of focused study!'
        }, status=status.HTTP_200_OK)
