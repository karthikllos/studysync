from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    CurrentUserProfileView,
    UserListView,
    RecordStudySessionView
)

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', CurrentUserProfileView.as_view(), name='current_user_profile'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('study-session/', RecordStudySessionView.as_view(), name='record_study_session'),
]
