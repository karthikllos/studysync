from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims embedded inside JWT payload
        token['email'] = user.email
        token['username'] = user.username
        token['full_name'] = user.get_full_name() or user.username
        token['role'] = user.role
        token['avatar_url'] = user.avatar_url
        token['institution'] = user.institution
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra user info in response body for frontend state
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'full_name': self.user.get_full_name() or self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'avatar_url': self.user.avatar_url,
            'institution': self.user.institution,
            'major_or_department': self.user.major_or_department,
            'study_streak_days': self.user.study_streak_days,
            'total_study_minutes': self.user.total_study_minutes,
        }
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'institution',
            'major_or_department', 'bio', 'avatar_url'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'institution', 'major_or_department', 'bio',
            'avatar_url', 'study_streak_days', 'total_study_minutes',
            'is_online', 'last_active'
        ]
        read_only_fields = ['id', 'email', 'study_streak_days', 'total_study_minutes', 'last_active']
