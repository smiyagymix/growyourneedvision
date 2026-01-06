# Copilot Instructions for Grow Your Need Platform

## Architecture Overview

This is a **multi-tenant SaaS platform** with four main services:

- **Frontend** (React/Vite at `:3001`) - Role-based dashboards with overlay app system
- **PocketBase** (`:8090`) - Backend/database with collections and real-time subscriptions
- **AI Service** (Python/FastAPI at `:8000`) - RAG-powered concierge with ChromaDB
- **Payment Server** (Express/Node at `:3001`) - Stripe integration with audit logging

**Critical**: Frontend dev server uses port 3001 (configured in `vite.config.ts`), not 3000.

### Role-Based Access Pattern

Six user roles with dedicated layouts in `src/components/layout/`:

- `Owner` → `/admin` (platform-wide management)
- `SchoolAdmin` → `/school-admin` (tenant administration)
- `Teacher` → `/teacher`, `Student` → `/student`, `Parent` → `/parent`
- `Individual` → `/individual` (personal use)

Route protection uses `ProtectedRoute` + `RoleBasedRedirect` components.

## Key Conventions

### Configuration-Driven UI

Navigation and apps are **data-driven** via `src/data/AppConfigs.ts`:

- `NAV_CONFIG` - Owner sidebar modules with tabs/subnav
- `SCHOOL_ADMIN_CONFIG`, `TEACHER_CONFIG`, etc. - Role-specific nav
- `OVERLAY_CONFIG` - Dock app configurations (tabs + subnav structure)

**When adding features, update these configs first** rather than hardcoding navigation.

### Service Layer Pattern

All backend calls go through `src/services/*Service.ts`:

```typescript
import pb from "../lib/pocketbase";
import { isMockEnv } from "../utils/mockData";

// 1. Define interface extending RecordModel for type safety
export interface MyRecord extends RecordModel {
  name: string;
  tenantId?: string;
}

// 2. Provide MOCK_DATA for E2E tests
const MOCK_DATA: MyRecord[] = [
  /* ... */
];

// 3. Check isMockEnv() first, then call PocketBase
export const myService = {
  async fetchData(tenantId?: string) {
    if (isMockEnv()) return MOCK_DATA;
    return pb.collection("myCollection").getFullList<MyRecord>({
      filter: tenantId ? `tenantId = "${tenantId}"` : "",
      requestKey: null, // Prevent auto-cancellation issues
    });
  },
};
```

### Data Query Hooks

Use `useDataQuery<T>` or `usePocketBase<T>` for reactive data fetching with built-in pagination, sorting, and realtime support:

```typescript
const { items, loading, setFilter, refresh } = useDataQuery<Student>(
  "students",
  {
    filter: `tenantId = "${tenantId}"`,
    sort: "-created",
    realtime: true,
  }
);
```

### Overlay Apps (Dock Applications)

Apps launched from the dock live in `src/apps/` and receive standard props:

```typescript
interface AppProps {
  activeTab: string;
  activeSubNav: string;
  onNavigate: (tab: string, subNav?: string) => void;
}
```

Register new apps in: 1) `OVERLAY_CONFIG` 2) `AppOverlay.tsx` switch statement.

### UI Component Patterns

- Use `cn()` from `src/lib/utils.ts` for Tailwind class merging
- Import shared components from `src/components/shared/ui/CommonUI.tsx`
- Custom colors use `gyn-*`, `hud-*`, `material-*` prefixes (see `tailwind.config.js`)
- Dark mode: Use `dark:` prefix, controlled via `ThemeContext`

## Development Commands

```powershell
pnpm dev              # Start all services (frontend + PocketBase + AI + server)
pnpm test:e2e         # Run Playwright tests (uses mock auth when PB unavailable)
pnpm test:e2e --ui    # Debug tests visually
pnpm lint             # ESLint check
pnpm build            # Production build (outputs to dist/)
```

### Production Deployment

**Docker Compose** (recommended):

```powershell
docker-compose up --build -d      # Build and start all containers
docker-compose -f docker-compose.prod.yml up -d  # Production profile
```

**Manual Production Start**:

```powershell
.\start-production.ps1            # Windows production launcher
pnpm prod:check                   # Validate production readiness
```

Services in production:

- Frontend served via Nginx (port 80/443)
- PocketBase with persistent volume at `/pb_data`
- AI Service with ChromaDB persistence
- Payment Server with health checks at `/api/health`

**Production Validation**: Server enforces required env vars via `productionValidator.js` on startup.

### Windows PowerShell Scripts

```powershell
.\launch.ps1          # Full stack launcher (recommended for first-time setup)
.\init-pocketbase.ps1 # Initialize PocketBase with migrations
.\setup-users.ps1     # Create test users for all roles
.\launch-ai.ps1       # Start AI service with venv activation
.\stop-servers.ps1    # Gracefully stop all background services
```

### Database Scripts (PocketBase Collections)

```powershell
node scripts/init-schema.js        # Core collections (messages, wellness_logs, classes)
node scripts/init-school-schema.js # School-specific (students, teachers, grades)
node scripts/seed-data.js          # Seed test data for all roles
# Pattern: init-{feature}-schema.js + seed-{feature}-data.js
```

**Auth for scripts:** Uses `_superusers` collection with `owner@growyourneed.com`.

## Multi-Tenancy Pattern

All tenant-scoped data includes a `tenantId` field:

```typescript
// Services MUST filter by tenant to prevent cross-tenant data leaks
const records = await pb.collection("courses").getFullList({
  filter: `tenantId = "${user.tenantId}"`,
});
```

- `SchoolProvider` (`src/apps/school/SchoolContext.tsx`) provides tenant context
- Owner role sees all tenants; other roles are scoped to their `tenantId`
- PocketBase rules enforce tenant isolation at database level

## Testing Conventions

E2E tests use **synthetic login via `isMockEnv()`** when `navigator.webdriver === true`:

- Test users: `teacher@school.com` (pw: `123456789`), `student@school.com`, `admin@school.com` (pw: `12345678`)
- Use `data-testid` attributes for test selectors (e.g., `data-testid="welcome-msg"`)
- App launcher button selector: `button.w-16.h-16.rounded-full`
- Test server runs on port **3001** (configured in `playwright.config.ts`)
- Tests run serially (`workers: 1`) to avoid race conditions with PocketBase
- Uses `.env.test` for test-specific environment variables

## Context Providers

Wrap order matters (`App.tsx`):

```
AuthProvider > OSProvider > ThemeProvider > RealtimeProvider > ModalProvider > ToastProvider
```

- `OSContext` - Overlay apps, sidebar state, window management
- `AuthContext` - Login, logout, impersonation, role checking
- `RealtimeContext` - PocketBase subscriptions, notifications, presence
- `SchoolProvider` - Tenant-scoped user/stats data

## File Organization

| Directory                          | Purpose                                     |
| ---------------------------------- | ------------------------------------------- |
| `src/apps/{appName}/`              | Feature app with components subdirectory    |
| `src/services/{feature}Service.ts` | API/data layer with mock fallbacks          |
| `src/data/*.ts`                    | Static configs, constants, role definitions |
| `src/hooks/use*.ts`                | Reusable React hooks (70+ available)        |
| `src/components/shared/ui/`        | 90+ reusable UI components                  |
| `scripts/init-*.js`                | PocketBase schema initialization            |
| `scripts/seed-*.js`                | Data seeding scripts                        |

## AI Service Notes

- Uses ChromaDB for vector storage (`ai_service/chroma_db/`)
- Ingests `docs/` folder on startup for RAG context
- Model routing via `model_router.py` (OpenAI/Gemini)
- Endpoints: `/chat`, `/search`, `/ingest`

## Observability (Optional)

Server (`server/index.js`) supports:

- Sentry: Set `SENTRY_DSN` env var
- OpenTelemetry: Set `OTEL_EXPORTER_OTLP_ENDPOINT`
- Metrics at `/api/metrics` (Prometheus format)
- Audit logging for finance exports

## Environment Configuration

Use `src/config/environment.ts` for all env vars (never hardcode URLs):

```typescript
import env from "../config/environment";
const pbUrl = env.get("pocketbaseUrl");
if (env.isFeatureEnabled("payments")) {
  /* ... */
}
```

**Required `.env` variables:**

```bash
# Frontend (VITE_ prefix required for Vite access)
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_OPENAI_API_KEY=sk-...

# Backend (Server)
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SERVICE_TOKEN=your_service_token
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Observability
SENTRY_DSN=https://...
OTEL_EXPORTER_OTLP_ENDPOINT=http://...
```

**Important**: Frontend vars need `VITE_` prefix; server-side scripts use `POCKETBASE_URL` (no prefix).

## EduMultiverse (Gamified Learning)

Located in `src/apps/edumultiverse/` - a gamified learning system with:

- **MultiverseHUD** - XP, levels, streaks overlay
- **Screens**: MultiverseMap, ConceptFusion, GlitchHunter, QuantumQuiz, TimeLoopMission
- Uses `useGamification()` hook for progress tracking
- Routes under `/apps/edumultiverse/*`

## Creator Studio

Full-featured content creation suite (`src/apps/CreatorStudio.tsx`):

- **Designer** - Polotno-based design editor
- **Video** - Video editing with timeline
- **Coder** - Monaco-based code editor
- **Office** - Word/Excel/PowerPoint tools
- AI content generation via `AIContentGeneratorModal`

## Stripe Integration

Payments use `StripeContext` + `StripeProvider`:

- Feature-flagged via `env.isFeatureEnabled('payments')`
- Server handles webhooks at `/api/stripe/webhook`
- Uses `Elements` wrapper from `@stripe/react-stripe-js`

## Concierge AI System

Role-aware AI assistant (`src/apps/concierge_ai/`):

- **AIAssistant** - Chat interface with voice input/output (`useSpeechRecognition`, `useSpeechSynthesis`)
- **LocalIntelligence** - Role-based query processing with context-aware responses
- **useChat hook** - Manages conversation history with smart caching (24h expiry, 50 message limit)
- System prompts vary by role (Owner gets debugging help, Student gets learning focus, etc.)

### AI Endpoints

```typescript
// Frontend calls AI service
const response = await fetch(`${env.get("aiServiceUrl")}/chat`, {
  method: "POST",
  body: JSON.stringify({ query, context, role }),
});
```

## Video Editor (Remotion)

Full video editing in `src/apps/media/`:

- Uses `@remotion/player` for preview, `@remotion/renderer` for export
- Templates: Educational, Corporate, Minimal (`src/apps/media/templates/`)
- Components: `MediaUploader`, `AudioSelector`, `Timeline`
- Export formats: MP4, WebM via `VideoExportService`

## CRM Module

Platform CRM (`src/apps/crm/`) and School CRM (`src/apps/school/crm/`):

- **ContactsManager** - Lead/contact management
- **DealAssignment** - Sales pipeline with stages
- **CRMAnalytics** - Conversion tracking, forecasts
- **EmailIntegration** - Bulk messaging, templates

## Project Knowledge Base

Role-specific AI knowledge in `src/data/projectKnowledge.ts`:

```typescript
import { getRoleKnowledge } from "../data/projectKnowledge";
const knowledge = getRoleKnowledge(user.role); // Returns role-appropriate context
```

Used by AI to understand platform features per role.

## Key Hooks Reference

| Hook                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `useGamification()`            | XP, levels, streaks for EduMultiverse |
| `useChat(context)`             | AI conversation with caching          |
| `useDataQuery<T>(collection)`  | Paginated PocketBase queries          |
| `usePocketBase<T>(collection)` | Simple reactive fetching              |
| `useSpeechRecognition()`       | Voice input for AI chat               |
| `useRealtime()`                | PocketBase subscription management    |
| `useFileUpload()`              | S3/PocketBase file uploads            |
| `useForm()`                    | Form state with validation            |

## Role-Specific Dashboards

### Owner (`src/apps/owner/`)

- **TenantDashboard** - Manage schools/organizations
- **FeatureFlags** - Toggle platform features by plan/rollout percentage
- **SystemHealthDashboard** - Server metrics, uptime
- **AuditLogs** - Track admin actions
- **WebhookManager** - Configure integrations
- **BackupManager** - Database backups

### Teacher (`src/apps/teacher/`)

- **LessonPlanner** - AI-assisted lesson creation
- **GradeBook** - Student assessment with mastery view
- **AttendanceMarking** - Daily attendance
- **Classes** - Class management
- **Communication** - Parent messaging

### Student (`src/apps/student/`)

- **Dashboard** - Course overview, upcoming assignments
- **Courses** - Enrolled courses with materials
- **Assignments** - Submit work, view feedback
- **Schedule** - Timetable view
- **StudentConcierge** - AI study assistant

### Individual (`src/apps/individual/`)

- **Projects** - Kanban-style project management
- **Goals** - Personal goal tracking
- **Learning** - Course access
- **Skills** - Skill development tracking
- **Marketplace** - Template/asset store

## Wellness Module

Full wellness tracking (`src/apps/Wellness.tsx`):

- **Activity tracking** - Steps, calories, sleep
- **Mood logging** - Daily mood tracking
- **Meal planning** - AI-generated meal plans via `AIContentGeneratorModal`
- **Reports** - Export wellness data via `reportService`

## File Upload Pattern

Use `FileUploadService` for PocketBase uploads:

```typescript
import { fileUploadService } from "../services/fileUploadService";

// Single file upload
const result = await fileUploadService.uploadFile(
  file,
  "collection",
  recordId,
  "fieldName"
);

// Multiple files
const result = await fileUploadService.uploadFiles(
  files,
  "collection",
  recordId,
  "fieldName"
);
```

## Feature Flags System

Owner can control features via `src/apps/owner/FeatureFlags.tsx`:

- Categories: `core`, `ai`, `payment`, `communication`, `analytics`, `overlay`
- Rollout percentage support (0-100%)
- Plan restrictions (e.g., Premium-only features)
- All changes are audit-logged

## Parent Dashboard (`src/apps/parent/`)

- **Dashboard** - Child overview with grades, attendance
- **Academic** - View child's courses and assignments
- **Grades** - Grade reports and transcripts
- **Attendance** - Absence tracking
- **Finance** - Tuition payments, invoices
- **Communication** - Message teachers
- **Schedule** - School calendar view

## School Finance Module (`src/apps/school/finance/`)

- **FinancialReports** - Revenue, expenses, P&L
- **FeeStructure** - Define tuition and fee types
- **InvoiceList** - Generate/send invoices to parents
- **ExpenseManager** - Track school expenses
- **Payroll** - Staff salary management

## Report Export Service

`src/services/reportService.ts` provides PDF/Excel exports:

```typescript
import { reportService } from "../services/reportService";

// Export to PDF with table
reportService.exportToPDF(
  "Title",
  ["Col1", "Col2"],
  [["row1", "data"]],
  "filename"
);

// Export to Excel
reportService.exportToExcel(dataArray, "SheetName", "filename");
```

Uses `jsPDF` + `jspdf-autotable` for PDF, `xlsx` for Excel.

## AI Content Generation Modal

Reusable modal for AI-generated content (`src/components/shared/modals/AIContentGeneratorModal.tsx`):

```typescript
<AIContentGeneratorModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(content) => handleAIContent(content)}
  title="Generate Lesson Plan"
  promptTemplate="Create a lesson plan for..."
  contextData={{ subject: "Math", grade: "10" }}
/>
```

Used in: Lesson Planner, Grade Feedback, Meal Planning, Finance Reports.

## AI Service Pattern

`src/services/aiService.ts` provides unified AI access:

- Falls back to local heuristic engine if no API key configured
- Supports OpenAI endpoint (configurable)
- API key from `VITE_OPENAI_API_KEY` or localStorage

## Common Modals (`src/components/shared/modals/`)

| Modal                     | Purpose                       |
| ------------------------- | ----------------------------- |
| `AIContentGeneratorModal` | AI-powered content generation |
| `AssignmentModal`         | Create/edit assignments       |
| `GradeSubmissionModal`    | Enter student grades          |
| `EnrollmentModal`         | Student enrollment forms      |
| `BroadcastMessageModal`   | Send bulk messages            |
| `SubmitAssignmentModal`   | Student assignment submission |

## Overlay Apps Reference

### MediaApp (`src/apps/MediaApp.tsx`)

- Browse movies, series, documentaries
- **Live TV** - M3U playlist support, channel syncing
- Video player component with HLS support
- Playlist management per user

### MarketApp (`src/apps/MarketApp.tsx`)

- E-commerce with product catalog
- Shopping cart with variant support
- Multi-step checkout (Shipping → Payment → Confirm)
- Medusa.js integration for backend

### ReligionApp (`src/apps/ReligionApp.tsx`)

- **Dashboard** - Daily verse, hadith, prayer times
- **Quran** - Full reader with surah list, translations
- **Prayer** - Times, Qibla finder, tracker
- **Tools** - Tasbih counter, Zakat calculator, Inheritance calculator
- **Soul Prescription** - AI mood-based verse recommendations

### SportApp (`src/apps/SportApp.tsx`)

- Live match scores with real-time updates
- Team/league management
- Activity logging per user
- Multiple sports: Football, Basketball, Tennis, etc.

### ActivitiesApp (`src/apps/ActivitiesApp.tsx`)

- Community events discovery
- Filtering by category, location, date
- List/table view toggle
- Pagination support

## Form Handling

Use `useForm<T>` hook for controlled forms:

```typescript
import { useForm } from "../hooks/useForm";

const { values, handleChange, resetForm, setFieldValue } = useForm({
  name: "",
  email: "",
  agreed: false,
});

<input name="name" value={values.name} onChange={handleChange} />;
```

## Toast Notifications

Use `useToast` hook for user feedback:

```typescript
import { useToast } from "../hooks/useToast";

const { addToast, showToast } = useToast();
addToast("Success message", "success"); // success | error | warning | info
```

## Loading States

Prefer skeleton loaders from `src/components/shared/ui/`:

- `<Skeleton />` - Basic skeleton element
- `<SkeletonCard />` - Card-shaped skeleton
- `<LoadingScreen />` - Full page loader

## Production Infrastructure

### Rate Limiting & Security

Server implements multi-tier rate limiting (`server/index.js`):

```javascript
// General API limiter: 100 requests per 15 minutes per IP
app.use("/api/", limiter);

// Payment limiter: 10 requests per hour for payment intents
app.use("/api/payments/create", paymentLimiter);
```

Security headers via `helmet` in production:

- HSTS enabled with preload
- Content Security Policy
- X-Frame-Options, X-Content-Type-Options

### Tenant Isolation (`server/tenantIsolation.js`)

**Critical security pattern** - all queries must be tenant-scoped:

```javascript
// Middleware adds tenant context to all requests
app.use(tenantIsolationMiddleware);

// Use TenantScopedPocketBase for automatic filtering
const scopedPb = new TenantScopedPocketBase(tenantId, isOwner);
const records = await scopedPb.getList("students"); // Auto-filtered by tenant

// Or build filters manually
const filter = buildTenantFilter(tenantId, 'status = "active"');
// Result: 'tenantId = "xyz" && (status = "active")'
```

**Never query without tenant filter** unless user is Owner role with `canAccessAllTenants = true`.

### Usage Tracking (`server/usageTrackingService.js`)

Production tracks tenant metrics for billing/analytics:

```javascript
// Track API calls with response time
await trackAPICall(tenantId, endpoint, method, responseTime);

// Track storage usage (bytes)
await trackStorageUsage(tenantId, bytes, "add"); // or 'remove'

// Track active users for DAU/MAU metrics
await trackActiveUsers(tenantId, userId);
```

Data stored in `tenant_usage` collection with daily aggregation.

### Caching Strategy (`server/cacheService.js`)

In-memory cache with TTL (recommend Redis for production scale):

```javascript
import cacheService from "./cacheService";

// Set with 5-minute TTL
cacheService.set("user:123:profile", userData, 300);

// Get with auto-expiration check
const cached = cacheService.get("user:123:profile");

// Cache statistics
const stats = cacheService.getStats(); // hits, misses, evictions
```

**Pattern**: Cache expensive PocketBase queries, AI responses, report data.

### Health Checks

Two health endpoints for monitoring:

1. **`GET /api/health`** - Quick health snapshot with metrics

   ```json
   {
     "status": "ok",
     "stripe": true,
     "pocketbase": true,
     "uptimeSeconds": 12345,
     "metrics": { "routes": [...] },
     "audit": { "buffered": 0 }
   }
   ```

2. **`GET /health`** - Comprehensive service checks (for load balancers)

Use in Docker healthcheck and monitoring systems (Datadog, New Relic, etc.).

### Audit Logging (`server/auditLogger.js`)

All sensitive operations logged to PocketBase `audit_logs`:

```javascript
import { logAudit } from "./auditLogger";

// Log with severity levels: info, warning, error, critical
logAudit(
  "User",
  userId,
  "finance_export",
  "exported Q3 revenue report",
  "info",
  {
    reportType: "quarterly",
    tenantId,
  }
);
```

**Auto-logged**: Payment operations, admin actions, data exports, role changes.

### Automated Scheduler (`server/schedulerService.js`)

Background jobs for production operations:

```javascript
schedulerService.start();

// Built-in jobs:
// - Trial reminders (every 6 hours)
// - Churn prediction (daily at midnight)
// - Trial expirations (hourly)
// - Weekly performance reports (Sunday 9 AM)
// - Monthly revenue reports (1st of month, 8 AM)
```

Jobs use PocketBase collections for state management. Add custom jobs via `scheduleDaily()`, `scheduleWeekly()`, or `scheduleMonthly()`.

## Realtime Features

### PocketBase Subscriptions (`src/context/RealtimeContext.tsx`)

Platform uses realtime for:

- **Notifications** - User-specific alerts with unread tracking
- **Presence** - Online users via heartbeat (updates every 60s)
- **Chat** - Live messaging
- **Collaborative features** - Shared documents, whiteboard

```typescript
const { isConnected, notifications, onlineUsers } = useRealtimeContext();

// Subscribe to custom collection
pb.collection("messages").subscribe("*", (e) => {
  if (e.action === "create") handleNewMessage(e.record);
});
```

**Performance note**: Subscriptions debounced to prevent render thrashing. Auto-reconnect on connection loss.

### Impersonation System (`pocketbase/pb_hooks/impersonation.js`)

Owner/Admin can impersonate users for support:

```javascript
// Frontend sends header
headers: { 'X-Impersonate-User': userId }

// Backend hook logs and validates
// RLS rules respect impersonated context
```

All impersonation events audit-logged for security compliance.

## Error Handling & Monitoring

### Error Boundaries

Three-tier error handling:

1. **`GlobalErrorBoundary`** - App-level crash recovery with Sentry integration
2. **`WidgetErrorBoundary`** - Component-level isolation (widgets can fail independently)
3. **`ErrorBoundary`** - Generic reusable boundary

```typescript
import { GlobalErrorBoundary } from "./components/shared/ui/GlobalErrorBoundary";

// Automatically captures to Sentry in production
<GlobalErrorBoundary fallback={<CustomError />}>
  <App />
</GlobalErrorBoundary>;
```

### Performance Monitoring (`src/utils/performance.ts`, `src/reportWebVitals.ts`)

Production tracks Core Web Vitals:

```typescript
import { performanceMonitor } from "./utils/performance";

// Mark operation start
performanceMonitor.mark("data-fetch-start");

// Measure duration
const duration = performanceMonitor.measure("data-fetch");

// Metrics: CLS, FCP, LCP, TTFB, INP automatically logged
```

**Integration**: Connect to Google Analytics, Datadog RUM, or custom backend via `reportWebVitals` callback.

### Observability Stack

Production supports:

1. **Sentry** - Error tracking with source maps

   ```bash
   SENTRY_DSN=https://...
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

2. **OpenTelemetry** - Distributed tracing

   ```bash
   OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318
   OTEL_EXPORTER_OTLP_HEADERS=x-api-key=secret
   ```

3. **Prometheus** - Metrics at `/api/metrics` (histograms, counters, gauges)

## PocketBase Configuration

### Auto-Cancellation Disabled

`src/lib/pocketbase.ts` disables request cancellation globally:

```typescript
pb.autoCancellation(false);
```

**Reason**: Dashboard makes many parallel requests; default behavior cancels in-flight requests on component unmount, causing data inconsistency.

**Alternative**: Use `requestKey: null` in individual queries if needed.

### Collection Hooks (`pocketbase/pb_hooks/`)

Server-side hooks for business logic:

- **impersonation.js** - X-Impersonate-User header handling
- Add custom hooks for: validation, triggers, computed fields

Hooks run in PocketBase Go runtime, not Node.js.

## Database Schema Patterns

### Schema Initialization Scripts

All collections defined in `scripts/init-*-schema.js`:

```javascript
// Pattern: Check if collection exists, create/update schema
const collections = await pb.collections.getFullList();
const exists = collections.find((c) => c.name === "my_collection");

if (!exists) {
  await pb.collections.create({
    name: "my_collection",
    type: "base",
    schema: [
      { name: "tenantId", type: "text", required: true },
      {
        name: "status",
        type: "select",
        options: { values: ["active", "inactive"] },
      },
    ],
  });
}
```

**Critical fields**:

- `tenantId` (text, indexed) - Required for all tenant-scoped data
- `created`, `updated` - Auto-managed by PocketBase
- `user` (relation) - Link to `users` collection for ownership

### Migration Pattern

1. Create `scripts/init-{feature}-schema.js` for new collections
2. Run locally: `node scripts/init-{feature}-schema.js`
3. Add to deployment pipeline
4. **Never delete collections in production** - add `deprecated: true` flag instead

## Payment Server Advanced Features

Beyond basic Stripe integration:

### Billing Lifecycle

- **Trial Management** (`trialManagementService.js`) - Auto-convert trials, send reminders
- **Proration** (`prorationService.js`) - Handle plan upgrades/downgrades mid-cycle
- **Retry Logic** (`billingRetryService.js`) - Smart failed payment recovery
- **Coupons** (`couponService.js`) - Discount codes, promotional campaigns

### Analytics & Reporting

- **Churn Prediction** (`churnPredictionService.js`) - ML-based at-risk customer detection
- **Revenue Analysis** (`revenueAnalysisService.js`) - MRR, ARR, cohort analysis
- **Customer Health** (`customerHealthService.js`) - Engagement scores, health metrics
- **Export Center** (`exportCenterService.js`) - CSV/PDF financial reports with audit trails

### Webhooks

Server processes Stripe webhooks at `/api/stripe/webhook`:

- `payment_intent.succeeded` - Payment confirmation
- `customer.subscription.updated` - Plan changes
- `invoice.payment_failed` - Failed payment handling

**Security**: Validates webhook signature via `STRIPE_WEBHOOK_SECRET`.

## Developer Platform (`src/apps/owner/`)

Owner dashboard includes API/webhook management:

- **API Keys** - Generate tenant-scoped API keys
- **Webhook Manager** - Configure outbound webhooks for events
- **Usage Analytics** - Track API consumption per tenant
- **Rate Limits** - Configure per-tenant throttling

Webhooks stored in `webhooks` collection with delivery tracking in `webhook_deliveries`.

## PWA & Offline Support

Platform is a Progressive Web App (via `vite-plugin-pwa`):

- Service worker auto-updates
- Offline fallback page
- Install prompt for mobile
- 192x192 and 512x512 icons required in `/public`

Manifest configured in `vite.config.ts`.

## Advanced Hooks Available

70+ production hooks in `src/hooks/`:

| Hook                     | Use Case                          |
| ------------------------ | --------------------------------- |
| `useApiError()`          | Centralized API error handling    |
| `useFileStorage()`       | S3-compatible file operations     |
| `useKeyboardShortcuts()` | Global hotkey registration        |
| `useWebWorker()`         | Offload compute to worker threads |
| `useMediaStream()`       | Camera/mic access                 |
| `useBattery()`           | Battery status (mobile)           |
| `useNetwork()`           | Online/offline detection          |
| `useIdle()`              | User inactivity detection         |

See `src/hooks/index.ts` for full export list.

## Mobile Development (Capacitor)

Project configured for mobile via `@capacitor/core`:

```bash
npx cap add ios
npx cap add android
npx cap sync
```

See `MOBILE_SETUP.md` for platform-specific instructions.

## Validation & Data Integrity

### Zod Schema Validation (`src/validation/schemas.ts`)

Centralized validation for all business entities:

```typescript
import {
  userSchema,
  courseSchema,
  tenantSettingsSchema,
} from "../validation/schemas";

// Validate form data
const result = userSchema.safeParse(formData);
if (!result.success) {
  const errors = extractValidationErrors(result.error);
  // errors = { email: 'Invalid email', name: 'Too short' }
}

// Async validation with additional checks
const validated = await validateAsync(loginSchema, formData, async (data) => {
  const exists = await checkUserExists(data.email);
  return exists ? null : "User not found";
});
```

**Available schemas**: user, login, register, passwordUpdate, tenant, course, assignment, payment, webhook, notification, apiKey.

**Password requirements** (enforced by `passwordUpdateSchema`):

- Minimum 8 characters
- Uppercase + lowercase letters
- Numbers
- Special characters (@$!%\*?&#)

### Client-Side Validators (`src/utils/validators.ts`)

Lightweight validators for forms without Zod overhead:

```typescript
import { validateEmail, validatePhone, validateURL } from "../utils/validators";

const emailCheck = validateEmail(input);
if (!emailCheck.isValid) {
  console.error(emailCheck.error); // "Invalid email format"
}
```

**Pattern**: Use Zod for API boundaries and complex forms; use `validators.ts` for simple UI feedback.

## Permissions & Authorization

### Role Hierarchy (`src/services/userService.ts`)

```typescript
const roleHierarchy = {
  Owner: 100,
  SchoolAdmin: 80,
  Teacher: 60,
  Parent: 40,
  Student: 20,
  Individual: 10,
};

// Check permission
userService.hasPermission(currentUserRole, requiredRole);
// Owner can access all; Teacher cannot access SchoolAdmin features
```

### Permission-Based Access (`src/services/securitySettingsService.ts`)

Granular permissions per role:

```typescript
const rolePermissions = {
  Owner: ["all"],
  SchoolAdmin: ["manage_users", "view_analytics", "export_reports"],
  Developer: ["view_api_docs", "manage_webhooks"],
  // ...
};

// Check specific permission
const canExport = user.permissions.includes("export_reports");
```

**API Key Permissions** (`src/services/settingsService.ts`):

```typescript
const apiKey = await settingsService.createAPIKey(userId, "Mobile App", [
  "read",
  "write",
]);
// Keys are scoped to tenant and have granular permissions
```

### Route Protection Pattern

```typescript
// In route component
const { user } = useAuth();
if (!userService.hasPermission(user.role, "Teacher")) {
  return <Navigate to="/unauthorized" />;
}
```

**Protected routes** use `<ProtectedRoute requiredRole="Teacher">` wrapper.

## Email & Communication

### Email Service (`server/index.js`)

Production email via SMTP (SendGrid, AWS SES, etc.):

```javascript
// Required env vars
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<api-key>
SMTP_FROM=noreply@yourdomain.com
```

**Email templates** stored in PocketBase `email_templates` collection with handlebars syntax.

### Communication Patterns

- **Notifications** - In-app via `RealtimeContext` + PocketBase subscriptions
- **Email** - Transactional via SMTP (payment receipts, password resets)
- **Broadcast** - Bulk messaging via `BroadcastMessageModal` (throttled, rate-limited)
- **Webhooks** - Outbound events to external systems

### Notification System

```typescript
// Create notification
await pb.collection("notifications").create({
  user: userId,
  message: "Assignment graded",
  type: "success",
  is_read: false,
});

// User receives via RealtimeContext subscription
const { notifications } = useRealtimeContext();
```

## File Storage & Assets

### Upload Pattern

```typescript
import { fileUploadService } from "../services/fileUploadService";

// Single file to PocketBase
const result = await fileUploadService.uploadFile(
  file,
  "course_materials",
  courseId,
  "attachments"
);

// Multiple files
const result = await fileUploadService.uploadFiles(
  files,
  collection,
  recordId,
  field
);
```

**Supported**: PocketBase internal storage, AWS S3 (via `@aws-sdk/client-s3`).

**File size limits**: Configured in PocketBase settings (default 5GB per file).

### Image Optimization

- Frontend serves optimized images via PocketBase thumbnail API
- Format: `/api/files/{collection}/{record}/{filename}?thumb=100x100`
- Automatic WebP conversion in modern browsers

### Media Storage (`src/apps/media/`)

- **Video**: HLS streaming via `hls.js`, M3U8 playlists
- **Audio**: MP3, AAC with metadata extraction
- **Documents**: PDF viewer, Office file preview
- **Images**: Lazy loading, responsive srcset

## Debugging & Development Tools

### Mock Environment Detection

```typescript
import { isMockEnv } from "../utils/mockData";

// Automatically true when navigator.webdriver === true (E2E tests)
if (isMockEnv()) {
  return MOCK_DATA; // Skip API calls
}
```

**Use in**: All service files to provide test data without backend.

### PocketBase Admin Panel

Access at `http://localhost:8090/_/` with admin credentials:

- View all collections and records
- Real-time data changes
- Collection schema editor
- API rule tester

### Browser DevTools Patterns

- **Performance marks**: `performanceMonitor.mark('operation-start')`
- **Web Vitals**: Automatic console logging with color-coded ratings
- **React DevTools**: All context providers visible in component tree
- **Network throttling**: Test app under 3G/4G conditions

### Common Debug Scenarios

**Issue**: PocketBase connection fails  
**Fix**: Check `VITE_POCKETBASE_URL` env var, ensure PocketBase running on correct port

**Issue**: Infinite re-renders  
**Fix**: Check `useEffect` dependencies, use `useCallback` for handlers

**Issue**: Tenant data leak  
**Fix**: Verify all queries include `tenantId` filter, check PocketBase API rules

**Issue**: Build fails  
**Fix**: Clear `node_modules`, `pnpm-lock.yaml`, run `pnpm install --force`

## Owner Role - Complete Feature Matrix

The Owner role has **30+ specialized dashboards** for platform-wide management. All features are accessible via `src/apps/owner/`.

### **Core Owner Dashboards**

| Dashboard                 | Purpose                          | Key Hooks                                                               | Service Dependencies               |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| **TenantDashboard**       | Manage all schools/organizations | `useOwnerDashboard`                                                     | `tenantService`, `billingService`  |
| **SystemHealthDashboard** | Monitor service uptime           | `useSystemHealth`, `useOverallHealth`                                   | `systemHealthService`              |
| **FeatureFlags**          | Toggle features per tenant/plan  | -                                                                       | `featureFlagService`               |
| **UserManagement**        | Cross-tenant user administration | `useApiError`, `useAuth`                                                | `userService`                      |
| **WebhookManager**        | Configure outbound webhooks      | `useWebhooks`, `useTestWebhook`, `useCreateWebhook`                     | `webhookService`                   |
| **AuditLogs**             | Security/compliance logging      | -                                                                       | `auditAdminService`, `auditLogger` |
| **BackupManager**         | Database backup/restore          | `useBackups`, `useBackupStats`, `useInitiateBackup`, `useRestoreBackup` | `backupService`                    |
| **SystemSettings**        | Global configuration             | -                                                                       | `settingsService`                  |
| **IntegrationSettings**   | External API integrations        | -                                                                       | `integrationConfigService`         |
| **SecuritySettings**      | MFA, IP whitelist, staff roles   | -                                                                       | `securitySettingsService`          |

### **Billing & Revenue Management**

| Dashboard                 | Purpose                       | Key Features                               |
| ------------------------- | ----------------------------- | ------------------------------------------ |
| **SubscriptionPlans**     | Define pricing tiers          | Create/edit plans with Stripe integration  |
| **SubscriptionLifecycle** | Monitor subscription health   | Trial conversions, cancellations, renewals |
| **TrialManagement**       | Trial monitoring & conversion | Auto-reminders, extension, conversion      |
| **RevenueAnalysis**       | MRR, ARR, cohort analysis     | Predictive revenue, customer LTV           |
| **ChurnPrediction**       | ML-based at-risk detection    | Customer health scoring                    |
| **CustomerHealth**        | Engagement scoring            | Usage patterns, support tickets            |
| **ExportCenter**          | Financial reports             | CSV/PDF exports with audit trails          |
| **ReportBuilder**         | Custom report creation        | Drag-drop report designer                  |
| **ReportScheduler**       | Automated report delivery     | Email/webhook scheduled reports            |

### **Analytics & Business Intelligence**

| Dashboard              | Purpose                | Data Sources                      |
| ---------------------- | ---------------------- | --------------------------------- |
| **AdvancedAnalytics**  | Deep-dive metrics      | Multi-tenant aggregation          |
| **AnalyticsDashboard** | Real-time KPIs         | React Query with 30s polling      |
| **SystemOverview**     | Service health metrics | Auto-refresh with `useCallback`   |
| **SupportDashboard**   | Ticket management      | `supportService`, `ticketService` |

### **Content Management (12 Specialized Managers)**

All located in `src/apps/owner/content-managers/`:

| Manager                        | Collections                        | Purpose                      |
| ------------------------------ | ---------------------------------- | ---------------------------- |
| **CalendarContentManager**     | `calendar_events`                  | Platform-wide events         |
| **EventsContentManager**       | `events`                           | Community/educational events |
| **GamificationContentManager** | `badges`, `achievements`           | XP, levels, rewards          |
| **HelpContentManager**         | `help_articles`, `faqs`            | Support documentation        |
| **HobbiesContentManager**      | `hobby_categories`                 | User interest categories     |
| **MarketplaceContentManager**  | `marketplace_items`                | App/template marketplace     |
| **MediaContentManager**        | `media_items`, `playlists`         | Movies, TV, music            |
| **MessagingContentManager**    | `message_templates`                | Email/SMS templates          |
| **ReligionContentManager**     | `prayer_times`, `religious_events` | Islamic/multi-faith content  |
| **ServicesContentManager**     | `service_offerings`                | Platform services catalog    |
| **SportContentManager**        | `sports`, `teams`, `matches`       | Sports data management       |
| **StudioContentManager**       | `design_templates`                 | Creator assets               |

### **Developer Platform Features**

Owner manages developer ecosystem via:

- **API Keys** - `developerPlatformService.createAPIKey()`

  - Scoped permissions: `read:users`, `write:assignments`, etc.
  - Rate limiting per key
  - Usage tracking and analytics

- **Plugin Marketplace** - `Plugin`, `PluginInstall` types

  - Revenue share configuration
  - Approval workflow
  - Version management

- **Webhook Deliveries** - `webhook_deliveries` collection

  - Retry logic for failed deliveries
  - Signature validation

- **API Documentation** - `APIDocumentationViewer`
  - Auto-generated from OpenAPI specs
  - Interactive testing sandbox

### **Missing Implementations & Integration Gaps**

#### **Critical Missing Hooks**

```typescript
// NEEDED: Owner-specific hooks currently using generic useState patterns
export const useOwnerAnalytics = () => {
  /* Multi-tenant aggregation */
};
export const useTenantMetrics = (tenantId: string) => {
  /* Tenant-specific KPIs */
};
export const useRevenueForecasting = () => {
  /* ML-based predictions */
};
export const useChurnAnalysis = () => {
  /* At-risk tenant detection */
};
export const useSystemAlerts = () => {
  /* Real-time monitoring alerts */
};
export const usePlatformUsage = () => {
  /* Cross-tenant usage analytics */
};
export const useComplianceReports = () => {
  /* GDPR, SOC2 reporting */
};
export const useBillingReconciliation = () => {
  /* Stripe ↔ PocketBase sync */
};
```

#### **Data Gaps**

**Missing Collections** (referenced but not initialized):

- `platform_settings` - Global configuration storage
- `feature_rollouts` - Gradual feature deployment tracking
- `tenant_migrations` - Schema migration history per tenant
- `compliance_records` - GDPR/privacy compliance documentation
- `sla_metrics` - Service-level agreement tracking
- `cost_attribution` - Infrastructure cost per tenant
- `abuse_reports` - Platform abuse/spam detection
- `tenant_communications` - Broadcast announcements to tenants

**Data Integrity Issues**:

- No validation for tenant subdomain uniqueness
- Missing cascade deletes for tenant removal
- No archival strategy for deleted tenant data
- Stripe subscription ID not enforced as unique

#### **Integration Gaps**

**External Services Not Integrated**:

1. **Email Delivery** - SMTP configured but templates not fully implemented

   - Missing: Welcome emails, trial reminders, suspension notices
   - Add: `emailTemplateService.sendTenantWelcome(tenant)`

2. **Observability** - Sentry/OTEL configured but not utilized in Owner dashboards

   - Add: Error boundary reporting for Owner components
   - Add: Performance tracking for heavy analytics queries

3. **Data Export** - Export center exists but missing:

   - Scheduled data exports to S3/GCS
   - GDPR data portability (user data export)
   - Bulk tenant data migrations

4. **Billing Sync** - Partial Stripe integration

   - Missing: Webhook event handlers for `customer.deleted`, `charge.disputed`
   - Missing: Automatic failed payment handling beyond retry
   - Missing: Proration preview before plan changes

5. **AI Intelligence** - AI service not integrated for Owner insights
   - Add: Churn prediction using AI service
   - Add: Anomaly detection for usage spikes
   - Add: Natural language queries for analytics

#### **Functional Gaps**

**Tenant Management**:

- ❌ No bulk operations (suspend multiple tenants)
- ❌ No tenant cloning/templating
- ❌ No automated tier upgrades based on usage
- ❌ No white-label domain management UI
- ❌ No tenant data migration tools

**User Management**:

- ❌ No impersonation time limits or session logging
- ❌ No bulk user operations (mass email, role changes)
- ❌ No user merge functionality for duplicates
- ❌ No inactive user cleanup automation

**Security**:

- ❌ No IP-based rate limiting per tenant
- ❌ No DDoS protection configuration
- ❌ No security incident response workflows
- ❌ No penetration test scheduling/tracking

**Compliance**:

- ❌ No GDPR right-to-be-forgotten automation
- ❌ No data retention policy enforcement
- ❌ No automated compliance report generation
- ❌ No consent management for tenant users

**Analytics**:

- ❌ No custom dashboard builder (drag-drop widgets)
- ❌ No alerting on anomalies (revenue drops, usage spikes)
- ❌ No comparative analytics (tenant vs tenant)
- ❌ No predictive maintenance for infrastructure

#### **UI/UX Improvements Needed**

**TenantDashboard**:

- Add: Quick actions dropdown per tenant
- Add: Tenant health score visualization
- Add: Timeline view of tenant lifecycle events

**SystemHealthDashboard**:

- Add: Historical uptime trends (7d/30d/90d)
- Add: Incident timeline with RCA notes
- Add: Service dependency graph visualization

**FeatureFlags**:

- Add: A/B test integration
- Add: Feature usage analytics
- Add: Automatic rollback on error rate increase

**RevenueAnalysis**:

- Add: Cohort comparison (month-over-month)
- Add: Customer segment analysis
- Add: Revenue attribution by feature

### **Owner Role Implementation Checklist**

#### **High Priority**

- [ ] Implement `useOwnerAnalytics()` hook with realtime subscriptions
- [ ] Add tenant subdomain uniqueness validation
- [ ] Complete Stripe webhook handlers (all 20+ events)
- [ ] Build GDPR data export functionality
- [ ] Add bulk tenant operations UI
- [ ] Integrate AI service for churn prediction
- [ ] Implement alert system for critical metrics

#### **Medium Priority**

- [ ] Build custom dashboard builder
- [ ] Add tenant cloning feature
- [ ] Implement automated compliance reports
- [ ] Add incident response workflows
- [ ] Build comparative analytics UI
- [ ] Add email template editor with preview

#### **Low Priority**

- [ ] Add tenant lifecycle automation (trial → paid)
- [ ] Build plugin approval workflow UI
- [ ] Add cost attribution reporting
- [ ] Implement user merge functionality
- [ ] Add penetration test tracking

### **Owner Service Architecture**

```typescript
// Current: ownerService.getDashboardData() - monolithic
// Recommended: Break into specialized services

export const ownerAnalyticsService = {
  getMultiTenantKPIs: async () => {
    /* Aggregate across all tenants */
  },
  getRevenueForecasting: async (months: number) => {
    /* ML predictions */
  },
  getChurnRisk: async () => {
    /* At-risk tenant list */
  },
  getUsageTrends: async (period: string) => {
    /* Platform-wide usage */
  },
};

export const ownerTenantService = {
  bulkSuspend: async (tenantIds: string[]) => {
    /* Mass operations */
  },
  cloneTenant: async (sourceId: string, newName: string) => {
    /* Template */
  },
  migrateTenantData: async (fromId: string, toId: string) => {
    /* Merge */
  },
  getTenantHealth: async (tenantId: string) => {
    /* Health score */
  },
};

export const ownerComplianceService = {
  exportUserData: async (userId: string) => {
    /* GDPR export */
  },
  deleteUserData: async (userId: string) => {
    /* Right to be forgotten */
  },
  generateComplianceReport: async (type: string) => {
    /* SOC2, GDPR */
  },
  getDataRetentionStatus: async () => {
    /* Policy enforcement */
  },
};
```

### **Data Flow for Owner Actions**

1. **Tenant Suspension**:

   ```
   Owner → TenantDashboard → tenantService.updateStatus()
   → PocketBase API rule checks Owner role
   → Update `tenants` collection
   → Trigger webhook: tenant.suspended
   → Email notification to tenant admin
   → Audit log entry created
   ```

2. **Feature Flag Toggle**:

   ```
   Owner → FeatureFlags → featureFlagService.toggleFlag()
   → Update `feature_flags` collection
   → Realtime subscription notifies all affected tenants
   → Frontend re-checks feature availability
   → Analytics track feature adoption
   ```

3. **Revenue Analysis**:
   ```
   Owner → RevenueAnalysis → ownerService.getRevenueData()
   → Query Stripe API for invoices
   → Query PocketBase `tenant_usage` for usage data
   → Aggregate and calculate MRR, ARR, LTV
   → Cache results for 5 minutes
   → Return to dashboard with charts
   ```

# MULTIVERSE-Ω CONTROL

RULES:

- No TODOs
- No placeholders
- No mock data
- No UI-only logic
- No skipped files
- Production-ready only

ARCHITECTURE:

- Vite + SaaS + Monorepo
- apps/web, apps/api, packages/\*

PROCESS:

1. Examiner
2. Planner
3. Implement
4. Integrate
5. Verify

If anything is missing → implement it fully.
