import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.common.models import TimeStampedModel

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, max_length=1024, default='')
    organization = models.CharField(max_length=255, blank=True, default='')
    job_title = models.CharField(max_length=150, blank=True, default='')

    def __str__(self):
        return f"Profile of {self.user.email}"

class UserSettings(TimeStampedModel):
    THEME_CHOICES = (
        ('dark', 'Dark'),
        ('light', 'Light'),
        ('system', 'System'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='dark')
    preferred_llm_provider = models.CharField(max_length=50, default='ollama')
    preferred_model_name = models.CharField(max_length=100, default='llama3.2')
    temperature = models.FloatField(default=0.2)
    max_tokens_per_response = models.IntegerField(default=2048)
    citation_style = models.CharField(max_length=50, default='academic')
    email_notifications = models.BooleanField(default=True)
    allow_data_collection = models.BooleanField(default=False)

    def __str__(self):
        return f"Settings for {self.user.email}"
