# Deployment Runbook

## 1. Prerequisites
- **Docker & Docker Compose**: v20+ recommended.
- **Node.js**: v20 LTS.
- **Git**.

## 2. Environment Setup
1. Clone the repository.
2. Copy `.env.example` to `.env.production` (or `.env` for local dev) and `.env.test.example` to `.env.test`.
   ```bash
   cp .env.example .env.production
   cp .env.test.example .env.test
   ```
3. **CRITICAL**: Update all secrets in `.env.production` with strong, unique passwords.

## 3. Database Initialization
This project uses PocketBase. Schema is managed via code/migrations (conceptually) or manual initial setup.

### Initial Setup (Scripted)
We have maintenance scripts to help set up the initial state.
```bash
# Install dependencies
npm install

# Run migration/seed scripts (Ensure PocketBase is running first!)
npm run dev:pocketbase # In a separate terminal
# Then loop:
node scripts/maintenance/add-indices.js
node src/apps/edumultiverse/scripts/setup-db.js
```

## 4. Build & Run (Docker)
To spin up the entire stack including PocketBase, Database, and Apps:
```bash
docker-compose up -d --build
```
This will start:
- PocketBase (Port 8090)
- Application (Port varies, usually 3000 or 5173 in dev)
- Auxiliary services (MinIO, etc.)

## 5. Verification
- Visit `http://localhost:8090/_/` to access PocketBase Admin.
- Visit `http://localhost:3000` (or configured port) to access the App.
- Check logs: `docker-compose logs -f`

## 6. Troubleshooting
- **PocketBase Connection Failed**: Ensure `POCKETBASE_URL` in `.env` matches the internal Docker network alias if running inside Docker (usually `http://pocketbase:8090`), or `http://127.0.0.1:8090` if running locally.
- **Auth Errors**: Verify `JWT_SECRET` and Admin credentials in `.env`.
