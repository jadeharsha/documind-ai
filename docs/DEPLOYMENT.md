# DocuMind AI — Production Deployment Guide

## 1. Prerequisites

- Linux / Ubuntu 22.04 LTS or macOS / Windows Server
- Docker Engine v24+ & Docker Compose v2.20+
- Minimum 4 GB RAM (8 GB recommended for local embedding generation)
- Domain with TLS certificates (for production HTTPS)

---

## 2. Production Docker Deployment

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/jadeharsha/documind-ai.git
cd documind-ai

# Create production environment file
cp .env.example .env
```

Ensure production values are set in `.env`:
```ini
DEBUG=False
SECRET_KEY=generate-a-strong-random-64-char-secret-key
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
DB_PASSWORD=your-secure-mysql-password
MYSQL_ROOT_PASSWORD=your-secure-mysql-root-password
MINIO_SECRET_KEY=your-secure-minio-key
STORAGE_BACKEND=s3
DEFAULT_LLM_PROVIDER=ollama
```

### Step 2: Build and Launch Containers
```bash
docker-compose up -d --build
```

### Step 3: Run Database Migrations
```bash
docker-compose exec backend python manage.py migrate
```

### Step 4: Create Admin Superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 3. Production Monitoring & Health Checks

Verify that all services are healthy:
```bash
docker-compose ps
```

Health check endpoints:
- **API Health**: `https://api.yourdomain.com/health/`
- **Qdrant Health**: `http://localhost:6333/healthz`
- **MinIO Health**: `http://localhost:9000/minio/health/live`
