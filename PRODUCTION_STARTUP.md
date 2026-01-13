# Production Startup & Troubleshooting Guide

## Quick Start (Windows)

### Step 1: Prerequisites
```powershell
# Ensure you have:
# - Node.js 18+ (pnpm)
# - PocketBase executable in ./pocketbase/ folder
# - .env file configured with required variables
```

### Step 2: Run Production Startup Script
```powershell
# From project root
.\startup-production.ps1
```

This script will:
- ✓ Load environment configuration from `.env`
- ✓ Check if PocketBase is running (start if not)
- ✓ Check if Payment Server is running (start if not)
- ✓ Initialize required collections
- ✓ Run health checks on all services
- ✓ Display endpoints and status

### Step 3: Access the Platform
```
Frontend:     http://localhost:3001
Admin Panel:  http://localhost:8090/_/
API Health:   http://localhost:3001/api/health
Metrics:      http://localhost:3001/api/metrics
```

---

## Manual Service Startup (If Needed)

### Terminal 1: Start PocketBase
```powershell
cd pocketbase
.\pocketbase.exe serve
```
Expected output: "Server started at http://127.0.0.1:8090"

### Terminal 2: Initialize Collections (One-time)
```powershell
node scripts/init-critical-collections.js
```

### Terminal 3: Start Payment Server
```powershell
pnpm run server
```
Expected output: "Server listening on port 3001"

### Terminal 4: Start Frontend (Development)
```powershell
pnpm dev
```
Expected output: "Local: http://localhost:3001"

---

## Environment Configuration

Required in `.env`:
```bash
# PocketBase
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SERVICE_TOKEN=your_service_token_here

# Node Environment
NODE_ENV=production  # or development

# Optional: Frontend
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_AI_SERVICE_URL=http://localhost:8000

# Optional: Observability
SENTRY_DSN=https://your-sentry-dsn
OTEL_EXPORTER_OTLP_ENDPOINT=http://your-otel-collector:4318
```

**To get POCKETBASE_SERVICE_TOKEN:**
1. Open PocketBase admin panel: http://localhost:8090/_/
2. Go to Settings → API Keys
3. Generate a new API key with full access
4. Copy the token to `.env`

---

## Common Issues & Solutions

### Issue 1: "Failed to load resource: net::ERR_CONNECTION_REFUSED" on port 8090

**Cause:** PocketBase is not running

**Solutions:**
```powershell
# Check if PocketBase is running
netstat -ano | findstr :8090

# If not running, start it:
cd pocketbase
.\pocketbase.exe serve

# If port is in use by another process:
# Find the PID and kill it
taskkill /PID <PID> /F
```

### Issue 2: "POST :3001/api/rate-limit/check returns 404"

**Cause:** Payment Server not running or endpoint not available

**Solutions:**
```powershell
# Check if Payment Server is running
netstat -ano | findstr :3001

# Restart the server:
pnpm run server

# Check server logs for errors
```

### Issue 3: "SyntaxError: Failed to execute 'json' on 'Response'"

**Cause:** API endpoint returning non-JSON response or empty body

**Solution:** Now fixed! The rate limit endpoint now:
- Returns proper JSON on all paths
- Handles missing PocketBase gracefully
- Falls back to allowing requests if check fails

### Issue 4: "Cannot authenticate - Login failed"

**Cause:** PocketBase user not initialized

**Solutions:**
```powershell
# Initialize default test users
node scripts/seed-data.js

# Or create users manually in admin panel:
# 1. Go to http://localhost:8090/_/
# 2. Collection: users
# 3. New record with email/password
```

### Issue 5: Rate limit check hangs or times out

**Cause:** PocketBase not responding or network issue

**Solution:** This is now handled gracefully - requests will be allowed even if rate limit check fails. Logs will show:
```
Rate limit check unavailable, allowing request
```

---

## Health Check Endpoints

All endpoints return JSON:

### PocketBase Health
```bash
GET http://localhost:8090/api/health
# Returns: 200 OK with service status
```

### Payment Server Health
```bash
GET http://localhost:3001/api/health
# Returns:
{
  "status": "ok",
  "stripe": true,
  "pocketbase": true,
  "uptimeSeconds": 12345,
  "metrics": { "routes": [...] },
  "audit": { "buffered": 0 }
}
```

### Rate Limit Check
```bash
POST http://localhost:3001/api/rate-limit/check
Content-Type: application/json

{
  "tenantId": "tenant-xyz",
  "ipAddress": "192.168.1.1"
}

# Returns:
{
  "allowed": true,
  "reason": "Request allowed",
  "limit": 100,
  "remaining": 95
}
```

---

## Production Readiness Checklist

- [ ] All environment variables configured in `.env`
- [ ] PocketBase running and accessible on :8090
- [ ] Payment Server running and accessible on :3001
- [ ] Collections initialized (run `init-critical-collections.js`)
- [ ] Health checks all passing
- [ ] Default admin user created
- [ ] Sentry DSN configured (optional but recommended)
- [ ] Rate limiting initialized in admin panel (optional)
- [ ] Stripe keys configured for payment testing
- [ ] AI Service running (optional for full features)

---

## Monitoring & Logs

### PocketBase Logs
View in the PocketBase console window where `pocketbase.exe serve` is running

### Payment Server Logs
View in the terminal where `pnpm run server` is running
```
Example: [Server] Started on http://127.0.0.1:3001
```

### Frontend Logs
Browser console: Press F12 → Console tab
```
Example: Error checking rate limit: [Error details...]
```

### Check Running Processes
```powershell
# All Node.js processes
Get-Process node

# All Python processes (AI Service)
Get-Process python

# PocketBase executable
Get-Process pocketbase -ErrorAction SilentlyContinue
```

---

## Database Initialization

Collections automatically created on first run:
- `users` - User accounts
- `tenants` - Organization/School records
- `platform_settings` - Global configuration
- `feature_flags` - Feature toggles
- `ip_rate_limits` - Rate limit configuration
- `ip_violations` - Rate limit tracking
- `audit_logs` - Security audit trail

**Manual initialization:**
```powershell
node scripts/init-critical-collections.js
```

---

## Performance Tuning

### Disable Request Cancellation (Production)
Already configured in `src/lib/pocketbase.ts`:
```typescript
pb.autoCancellation(false);
```
This prevents parallel requests from canceling each other.

### Rate Limiting Configuration
Via admin panel or directly in `ip_rate_limits` collection:
```json
{
  "tenantId": "school-1",
  "requestsPerHour": 100,
  "requestsPerDay": 1000,
  "violationThreshold": 3,
  "enabled": true
}
```

### Caching
Payment Server includes in-memory cache:
```
Cache Key: user:123:profile
TTL: 300 seconds (5 minutes)
```

---

## Shutdown Procedures

### Clean Shutdown (Recommended)
```powershell
# Press Ctrl+C in each terminal window:
# 1. PocketBase terminal
# 2. Payment Server terminal  
# 3. Frontend dev server

# Wait ~5 seconds for graceful shutdown
```

### Force Shutdown (If Needed)
```powershell
# Kill all processes
taskkill /F /IM pocketbase.exe
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

---

## Advanced Configuration

### Enable Observability

**Sentry Integration:**
```bash
# In .env
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_RELEASE=1.0.0
```

**OpenTelemetry Tracing:**
```bash
# In .env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_HEADERS=x-api-key=secret
```

### Enable Detailed Logging

Create/update `pocketbase/pb_hooks/main.pb.js`:
```javascript
// Log all API calls
routerAdd("*", "/*", (c) => {
  console.log(`[${c.request.Method}] ${c.request.RequestURI} - IP: ${c.request.RemoteAddr}`);
  return c.JSON(200, null);
}, "/*");
```

---

## Debugging Authentication Issues

### Step 1: Verify User Exists
```bash
# In PocketBase admin:
# 1. Go to Collections → users
# 2. Check if test user exists
# 3. Verify email is correct case
```

### Step 2: Check Rate Limit Block
```bash
# Inspect browser console:
# Should NOT see: "Too many attempts from this IP"
# If blocked, wait 60 minutes or reset via admin
```

### Step 3: Verify Server Responds
```powershell
# Test endpoint directly:
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/rate-limit/check" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"tenantId":"test"}'

# Should return JSON without errors
```

### Step 4: Check Network
```bash
# In browser console:
# Check Network tab for failed requests
# Look for:
# - 8090 connection refused → Start PocketBase
# - 3001 connection refused → Start Payment Server
# - 404 on /api/rate-limit/check → Server issue
```

---

## Next Steps

1. ✓ All services running and healthy
2. ✓ Test login with demo account
3. ✓ Create tenant (School)
4. ✓ Invite users
5. ✓ Configure feature flags in admin panel
6. ✓ Set up payment methods (if using Stripe)
7. ✓ Enable observability (Sentry/OTEL)
8. ✓ Deploy to production servers

---

## Support

For issues not covered here:
1. Check service logs for error messages
2. Run health checks: `.\startup-production.ps1`
3. Verify `.env` configuration
4. Check browser console for JavaScript errors
5. Review PocketBase admin panel for data/permissions issues
