from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, UserSettings

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('bio', 'avatar_url', 'organization', 'job_title', 'updated_at')

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = (
            'theme', 'preferred_llm_provider', 'preferred_model_name',
            'temperature', 'max_tokens_per_response', 'citation_style',
            'email_notifications', 'allow_data_collection'
        )

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    settings = UserSettingsSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'is_verified', 'created_at', 'profile', 'settings')
        read_only_fields = ('id', 'created_at', 'is_active', 'is_verified')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Create profile and default settings automatically
        UserProfile.objects.create(user=user)
        UserSettings.objects.create(user=user)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
