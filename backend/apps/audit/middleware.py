import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {'password', 'password_confirm', 'old_password', 'new_password', 'token', 'access', 'refresh', 'api_key', 'secret'}

class AuditLoggingMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Only log mutating actions or API calls
        if not request.path.startswith('/api/'):
            return response

        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            try:
                user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
                ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
                if ip and ',' in ip:
                    ip = ip.split(',')[0].strip()

                action = f"{request.method} {request.path}"
                AuditLog.objects.create(
                    user=user,
                    ip_address=ip or '127.0.0.1',
                    request_method=request.method,
                    path=request.path[:512],
                    status_code=response.status_code,
                    action=action[:150],
                    details={"content_type": response.get('Content-Type', '')}
                )
            except Exception as e:
                logger.debug("Audit log recording skipped: %s", str(e))

        return response
