# Environment Variables Configuration

This document describes all environment variables required for the Grow Your Need platform.

## Quick Setup

Create a `.env` file in the project root with the following variables:

```bash
# ===========================================
# Grow Your Need - Environment Configuration
# ===========================================

# ===========================================
# Application URLs
# ===========================================
VITE_APP_URL=http://localhost:3001
VITE_API_URL=http://localhost:3002
VITE_FRONTEND_URL=http://localhost:3001

# ===========================================
# PocketBase Configuration
# ===========================================
VITE_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SERVICE_TOKEN=

# ===========================================
# AI Service Configuration
# ===========================================
VITE_AI_SERVICE_URL=http://localhost:8000
AI_PROVIDER=ollama

# Ollama (Local AI)
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5:1.5b

# OpenAI
VITE_OPENAI_API_KEY=
OPENAI_API_KEY=

# OpenRouter
OPENROUTER_API_KEY=

# Groq
GROQ_API_KEY=

# Google Gemini
GEMINI_API_KEY=

# ===========================================
# Payment Processing (Stripe)
# ===========================================
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_PAYMENT_SERVER_URL=http://localhost:3002

# ===========================================
# Feature Flags
# ===========================================
VITE_ENABLE_PAYMENTS=false
VITE_ENABLE_2FA=false
VITE_ENABLE_EMAIL_VERIFICATION=false
FEATURE_PAYMENTS=false

# ===========================================
# Security
# ===========================================
# IMPORTANT: Generate a strong random string (32+ characters)
JWT_SECRET=your-32-character-minimum-secret-key-change-this
SESSION_SECRET=another-32-character-minimum-secret-key-change-this
VITE_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# ===========================================
# External Services
# ===========================================
# Email (Resend)
VITE_RESEND_API_KEY=
RESEND_API_KEY=

# Error Tracking (Sentry)
VITE_SENTRY_DSN=
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1

# OpenTelemetry (Optional)
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_EXPORTER_OTLP_HEADERS=
OTEL_EXPORTER_OTLP_AUTH_TOKEN=

# ===========================================
# Redis (Upstash)
# ===========================================
VITE_UPSTASH_REDIS_REST_URL=
VITE_UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=

# ===========================================
# AWS S3 Storage (Optional)
# ===========================================
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# ===========================================
# CORS Configuration
# ===========================================
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# ===========================================
# Email Service (SMTP)
# ===========================================
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@growyourneed.com

# ===========================================
# SSL/TLS (Production)
# ===========================================
SSL_CERT_PATH=
SSL_KEY_PATH=

# ===========================================
# Development Settings
# ===========================================
NODE_ENV=development
VITE_E2E_MOCK=false

# ===========================================
# Default Application Settings
# ===========================================
VITE_DEFAULT_SCHOOL_NAME=School
VITE_DEFAULT_ACADEMIC_YEAR=2025-2026
```

## Variable Categories

### Frontend Variables (VITE_ prefix)

Variables prefixed with `VITE_` are accessible in the frontend code via `import.meta.env.VITE_*`.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_POCKETBASE_URL` | PocketBase backend URL | Yes | `http://127.0.0.1:8090` |
| `VITE_AI_SERVICE_URL` | AI service endpoint | No | `http://localhost:8000` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No* | - |
| `VITE_ENABLE_PAYMENTS` | Enable payment features | No | `false` |
| `VITE_ENABLE_2FA` | Enable 2FA authentication | No | `false` |

*Required if `VITE_ENABLE_PAYMENTS=true`

### Server Variables

These are used by the Node.js server (`server/index.js`).

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes | - |
| `SESSION_SECRET` | Session encryption secret | Yes | - |
| `POCKETBASE_URL` | PocketBase URL for server | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | No* | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No* | - |

### AI Service Variables

Used by the Python AI service (`ai_service/main.py`).

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AI_PROVIDER` | AI provider (openai/ollama/gemini) | No | `ollama` |
| `OPENAI_API_KEY` | OpenAI API key | No* | - |
| `GEMINI_API_KEY` | Google Gemini API key | No* | - |
| `OLLAMA_BASE_URL` | Ollama server URL | No | `http://localhost:11434/v1` |

*Required based on selected `AI_PROVIDER`

## Security Best Practices

1. **Never commit `.env` files** - Add `.env` to `.gitignore`
2. **Use strong secrets** - Generate JWT_SECRET and SESSION_SECRET with:
   ```bash
   openssl rand -base64 32
   ```
3. **Rotate keys regularly** in production
4. **Use different keys** for development/staging/production
5. **Validate in production** - Server validates required vars on startup

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
VITE_E2E_MOCK=true
```

### Staging
```bash
NODE_ENV=staging
VITE_POCKETBASE_URL=https://staging-pb.yourdomain.com
```

### Production
```bash
NODE_ENV=production
VITE_POCKETBASE_URL=https://pb.yourdomain.com
VITE_ENABLE_PAYMENTS=true
```

## Validation

The application validates environment variables on startup. See:
- Frontend: `src/utils/env-validation.ts`
- Server: `server/productionValidator.js`
- Config: `src/config/environment.ts`
