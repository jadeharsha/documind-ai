from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, CurrentUserView, UserProfileView,
    UserSettingsView, ChangePasswordView, PasswordResetRequestView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_current_user'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
    path('settings/', UserSettingsView.as_view(), name='auth_settings'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset'),
]
