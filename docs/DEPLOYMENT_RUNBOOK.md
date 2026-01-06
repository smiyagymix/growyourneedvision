# 🚀 Deployment Runbook

This guide covers the deployment process for the "Grow Your Need" Visionary UI Platform.

## 📋 Prerequisites
- **Docker**: v20+ installed on the target server.
- **Git**: Installed and authenticated to access the repository.
- **Domain**: Configured with DNS records pointing to the server IP.
- **Environment Variables**: A secure list of secrets (Project ID, API Keys).

## 🐳 Deployment Method 1: Docker Compose (Recommended)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/grow-your-need-vision.git
    cd grow-your-need-vision
    ```

2.  **Configure Environment**
    Copy the example prod environment file:
    ```bash
    cp .env.production.example .env.production
    nano .env.production
    ```
    *Fill in `VITE_POCKETBASE_URL`, `PB_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, etc.*

3.  **Build and Start**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```
    *This will build the React App, and start PocketBase and AI Service.*

4.  **Verify Deployment**
    - **Frontend**: Navigate to `http://your-server-ip` (or configured domain).
    - **Backend**: `http://your-server-ip:8090/_/` (PocketBase Admin).
    - **Health Check**: `curl http://localhost:80/`

## 🔄 Method 2: CI/CD (GitHub Actions)
The repository includes a GitHub Actions workflow `.github/workflows/main.yml`.

1.  **Push to Main**: Any push to `main` triggers the pipeline.
2.  **Build**: The pipeline runs tests and builds the Docker image.
3.  **Registry**: The image is pushed to `ghcr.io/your-org/grow-your-need-vision`.
4.  **Server Update** (On your server):
    ```bash
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml up -d
    ```

## 🚨 Disaster Recovery

### Database Backup
PocketBase stores data in `./pocketbase/pb_data`.
**Automated Backup**:
Add a cron job to run:
```bash
docker-compose exec pocketbase ./pocketbase admin backup create
```
Copy the `pb_data/backups` folder to offsite storage (S3/MinIO).

### Restore
1. Stop the service: `docker-compose stop pocketbase`
2. Restore `pb_data` directory from backup.
3. Start service: `docker-compose start pocketbase`

## 🛠 Troubleshooting
- **Logs**: `docker-compose logs -f webapp`
- **Rebuild**: `docker-compose build --no-cache`
- **Port Conflicts**: Check if port 80 or 8090 is in use. Modify `docker-compose.prod.yml` ports mapping.
