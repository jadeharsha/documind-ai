import os
import uuid
from pathlib import Path
from django.conf import settings

class StorageService:
    def __init__(self):
        self.backend = getattr(settings, 'STORAGE_BACKEND', 'local').lower()
        if self.backend == 's3':
            try:
                from minio import Minio
                self.client = Minio(
                    settings.MINIO_ENDPOINT,
                    access_key=settings.MINIO_ACCESS_KEY,
                    secret_key=settings.MINIO_SECRET_KEY,
                    secure=settings.MINIO_SECURE
                )
                self.bucket = settings.MINIO_BUCKET_NAME
                if not self.client.bucket_exists(self.bucket):
                    self.client.make_bucket(self.bucket)
            except Exception as e:
                # Fallback to local if MinIO connection fails
                self.backend = 'local'
                self.client = None

        if self.backend == 'local':
            self.base_dir = Path(settings.MEDIA_ROOT) / 'documents'
            self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_obj, original_filename: str) -> str:
        """
        Saves uploaded file and returns unique storage_key
        """
        ext = Path(original_filename).suffix.lower()
        unique_id = uuid.uuid4().hex
        storage_key = f"{unique_id}_{Path(original_filename).stem[:50]}{ext}"

        if self.backend == 's3' and self.client:
            file_obj.seek(0)
            file_size = getattr(file_obj, 'size', None)
            if file_size is None:
                content = file_obj.read()
                from io import BytesIO
                self.client.put_object(
                    self.bucket,
                    storage_key,
                    BytesIO(content),
                    length=len(content)
                )
            else:
                self.client.put_object(
                    self.bucket,
                    storage_key,
                    file_obj,
                    length=file_size
                )
            return storage_key
        else:
            dest_path = self.base_dir / storage_key
            file_obj.seek(0)
            with open(dest_path, 'wb') as f:
                for chunk in file_obj.chunks() if hasattr(file_obj, 'chunks') else [file_obj.read()]:
                    f.write(chunk)
            return storage_key

    def get_file_path(self, storage_key: str) -> str:
        """
        Returns local filesystem path for processing. If S3, downloads to cache/temp.
        """
        if self.backend == 'local':
            path = self.base_dir / storage_key
            if not path.exists():
                raise FileNotFoundError(f"Stored file {storage_key} not found at {path}")
            return str(path)
        else:
            temp_cache = Path(settings.MEDIA_ROOT) / 'temp_cache'
            temp_cache.mkdir(parents=True, exist_ok=True)
            local_path = temp_cache / storage_key
            if not local_path.exists():
                self.client.fget_object(self.bucket, storage_key, str(local_path))
            return str(local_path)

    def delete_file(self, storage_key: str) -> bool:
        """
        Safely removes file from storage.
        """
        try:
            if self.backend == 's3' and self.client:
                self.client.remove_object(self.bucket, storage_key)
            else:
                target = self.base_dir / storage_key
                if target.exists():
                    target.unlink()
            return True
        except Exception:
            return False
