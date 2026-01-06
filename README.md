# Grow Your Need - Visionary UI

A comprehensive, AI-powered platform for schools, individuals, and enterprises.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Docker** & **Docker Compose** (for production)
- **Python 3.11+** (for local AI service)

### 🛠️ Local Development

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Configure Environment**
    Copy `.env.example` to `.env` and fill in your API keys.
    ```bash
    cp .env.example .env
    ```

3.  **Start Development Servers**
    This command starts the Frontend, PocketBase, and AI Service concurrently.
    ```bash
    pnpm run dev
    ```
    - Frontend: `http://localhost:3000`
    - PocketBase: `http://localhost:8090`
    - AI Service: `http://localhost:8000`

### 🐳 Production Deployment

1.  **Build & Run with Docker Compose**
    ```bash
    docker-compose up --build -d
    ```

2.  **Initialize Database**
    Run these scripts to set up the schema and seed data:
    ```bash
    node init-collections.js
    node init-users.js
    node seed-crm.js
    ```

## 📂 Project Structure

- `src/` - Frontend source code (React, Vite, Tailwind)
- `ai_service/` - Python-based AI backend (FastAPI, RAG)
- `pocketbase/` - Database binary (auto-downloaded or local)
- `tests/` - Playwright E2E tests

## 🧪 Testing

Run end-to-end tests:
```bash
pnpm run test:e2e
```

## 🛰️ Operations Notes

- The payment/finance server exposes `/api/health` with a metrics snapshot (per-route counts, avg latency, errors) and `/api/metrics` with Prometheus-style counters.
- Admin-only finance exports and PDF receipts require `x-user-role: admin` and `x-tenant-id` headers; CSV exports are audit-logged.
- Optional observability:
    - Set `SENTRY_DSN` (and `SENTRY_TRACES_SAMPLE_RATE` if desired) to enable Sentry tracing/errors.
    - Set `OTEL_EXPORTER_OTLP_ENDPOINT` to emit OpenTelemetry traces via the built-in Node SDK auto-instrumentation. Optional: `OTEL_EXPORTER_OTLP_HEADERS` (comma-separated key=val), `OTEL_EXPORTER_OTLP_AUTH_TOKEN` for bearer auth.
- Metrics include latency histograms, request/error counters, and process uptime/start time gauges at `/api/metrics` (Prometheus format).

## 📝 License

Private - Grow Your Need
