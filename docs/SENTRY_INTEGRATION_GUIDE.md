# Sentry Integration Guide for Owner Dashboards

## 📋 Overview

Sentry error tracking and performance monitoring has been integrated into Owner dashboards to provide:
- **Automatic error capture** with stack traces
- **Performance monitoring** for slow operations
- **User context** for debugging
- **Breadcrumbs** for user action tracking
- **Session replay** for error reproduction

---

## 🚀 Quick Start

### 1. Install Dependencies

Already installed:
```bash
pnpm install @sentry/react @sentry/tracing
```

### 2. Configure Environment Variables

Add to `.env`:
```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-key@sentry.io/project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

**Get your DSN:**
1. Create account at [sentry.io](https://sentry.io)
2. Create new project (React)
3. Copy DSN from project settings

### 3. Initialize in App

In `src/App.tsx` or `src/main.tsx`:
```typescript
import { initializeSentry, setUserContext } from './lib/sentry';

// Initialize once at app startup
initializeSentry();

// Set user context after login
const { user } = useAuth();
useEffect(() => {
    if (user) {
        setUserContext({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } else {
        setUserContext(null);
    }
}, [user]);
```

---

## 🛡️ Error Boundaries

### Full Page Error Boundary

For entire Owner sections:
```typescript
import { OwnerErrorBoundary } from './components/shared/ui/OwnerErrorBoundary';

function OwnerLayout() {
    return (
        <OwnerErrorBoundary componentName="OwnerLayout" fallbackMode="full">
            <YourContent />
        </OwnerErrorBoundary>
    );
}
```

### Inline Error Boundary

For widgets that can fail independently:
```typescript
<OwnerErrorBoundary componentName="ChurnWidget" fallbackMode="inline">
    <ChurnPredictionWidget />
</OwnerErrorBoundary>
```

### HOC Pattern

Wrap components at definition:
```typescript
import { withOwnerErrorBoundary } from './components/shared/ui/OwnerErrorBoundary';

const TenantDashboard = () => { /* ... */ };

export default withOwnerErrorBoundary(
    TenantDashboard,
    'TenantDashboard',
    'full'
);
```

---

## 📊 Performance Monitoring

### Automatic Hook Monitoring

`useOwnerAnalytics` now automatically tracks performance:
```typescript
// Already integrated - no changes needed
const { data, loading } = useOwnerAnalytics();
```

Sentry will alert if query takes >2 seconds.

### Manual Performance Tracking

For custom operations:
```typescript
import { measurePerformance } from './lib/sentry';

async function bulkOperation(tenantIds: string[]) {
    return measurePerformance(
        'bulkSuspendTenants', // Operation name
        async () => {
            // Your async operation
            return await ownerTenantService.bulkSuspendTenants(tenantIds);
        },
        { 
            tenantCount: tenantIds.length,
            feature: 'bulk-operations'
        }
    );
}
```

### Transaction Tracking

For multi-step operations:
```typescript
import { startTransaction } from './lib/sentry';

async function complexOperation() {
    const transaction = startTransaction('tenant-migration', 'task');
    
    try {
        const span1 = transaction?.startChild({ op: 'export-data' });
        await exportData();
        span1?.finish();
        
        const span2 = transaction?.startChild({ op: 'import-data' });
        await importData();
        span2?.finish();
    } finally {
        transaction?.finish();
    }
}
```

---

## 🐛 Manual Error Capture

### Basic Error Capture

```typescript
import { captureException } from './lib/sentry';

try {
    await riskyOperation();
} catch (error) {
    captureException(error as Error, {
        feature: 'bulk-operations',
        operation: 'suspend',
        tenantIds: selectedTenants
    });
    throw error; // Re-throw if needed
}
```

### Capture Messages

For warnings or info:
```typescript
import { captureMessage } from './lib/sentry';

if (tenantCount > 100) {
    captureMessage('Large bulk operation detected', 'warning', {
        tenantCount,
        user: currentUser.id
    });
}
```

---

## 🍞 Breadcrumbs

Track user actions for debugging:
```typescript
import { addBreadcrumb } from './lib/sentry';

function handleTenantClick(tenantId: string) {
    addBreadcrumb('Tenant clicked', 'user-action', {
        tenantId,
        page: 'tenant-dashboard',
        timestamp: Date.now()
    });
    
    navigate(`/admin/tenants/${tenantId}`);
}

function handleFilterChange(filter: string) {
    addBreadcrumb('Filter applied', 'ui-interaction', {
        filter,
        resultCount: filteredTenants.length
    });
}
```

---

## 🎯 Integration Examples

### Example 1: Bulk Operations with Monitoring

```typescript
import { measurePerformance, captureException, addBreadcrumb } from './lib/sentry';

async function handleBulkSuspend(tenantIds: string[]) {
    addBreadcrumb('Bulk suspend initiated', 'action', {
        tenantCount: tenantIds.length
    });
    
    try {
        const result = await measurePerformance(
            'bulkSuspendTenants',
            async () => {
                return await ownerTenantService.bulkSuspendTenants(
                    tenantIds,
                    'Manual suspension by owner'
                );
            },
            { tenantCount: tenantIds.length }
        );
        
        addBreadcrumb('Bulk suspend completed', 'action', {
            successCount: result.successCount,
            failureCount: result.failureCount
        });
        
        return result;
    } catch (error) {
        captureException(error as Error, {
            feature: 'bulk-operations',
            operation: 'suspend',
            tenantIds,
            tenantCount: tenantIds.length
        });
        throw error;
    }
}
```

### Example 2: Widget Error Isolation

```typescript
function OwnerDashboard() {
    return (
        <div className="dashboard-grid">
            {/* Each widget wrapped independently */}
            <OwnerErrorBoundary componentName="ChurnPrediction" fallbackMode="inline">
                <ChurnPredictionWidget />
            </OwnerErrorBoundary>
            
            <OwnerErrorBoundary componentName="Alerts" fallbackMode="inline">
                <AlertsWidget mode="panel" />
            </OwnerErrorBoundary>
            
            <OwnerErrorBoundary componentName="Revenue" fallbackMode="inline">
                <RevenueChart />
            </OwnerErrorBoundary>
        </div>
    );
}
```

### Example 3: Protected Route

```typescript
import { OwnerErrorBoundary } from './components/shared/ui/OwnerErrorBoundary';

function OwnerRoutes() {
    return (
        <Routes>
            <Route path="/admin/*" element={
                <OwnerErrorBoundary componentName="OwnerRoutes" fallbackMode="full">
                    <OwnerLayout>
                        <Outlet />
                    </OwnerLayout>
                </OwnerErrorBoundary>
            }>
                <Route path="tenants" element={<TenantDashboard />} />
                <Route path="analytics" element={<AdvancedAnalytics />} />
                <Route path="health" element={<SystemHealthDashboard />} />
            </Route>
        </Routes>
    );
}
```

---

## 📈 What Gets Tracked

### Automatically Tracked
✅ **Uncaught errors** in Owner components
✅ **useOwnerAnalytics** performance (measures query time)
✅ **Route navigation** timing
✅ **Network requests** (auto-instrumented)
✅ **Console errors** in production

### Manually Tracked
- Bulk operation performance
- User actions (clicks, filters, selections)
- Business logic errors
- Custom performance metrics

---

## 🔍 Debugging in Sentry Dashboard

### View Error Details
1. Go to **Issues** → Select error
2. See:
   - Stack trace with source maps
   - User context (who experienced error)
   - Breadcrumbs (what they did before error)
   - Device/browser info
   - Session replay (if enabled)

### Performance Insights
1. Go to **Performance** → Select transaction
2. See:
   - Duration breakdown by operation
   - Slow spans highlighted
   - Historical trends
   - P50/P95/P99 percentiles

### Alerts
Configure alerts for:
- Error rate spikes (>10 errors/minute)
- Slow transactions (>5 seconds)
- New error types
- Critical component failures

---

## 🎛️ Configuration Options

### Sample Rates

In `.env`:
```bash
# Send 10% of transactions (save quota)
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Send 100% of error sessions for replay
VITE_SENTRY_ERROR_REPLAY_RATE=1.0
```

### Filtering

Ignored errors configured in `src/lib/sentry.ts`:
```typescript
ignoreErrors: [
    'NetworkError',
    'Failed to fetch',
    'Query was cancelled',
    // Add more as needed
]
```

---

## 🚨 Production Checklist

- [ ] Sentry DSN configured in `.env`
- [ ] `initializeSentry()` called in main app file
- [ ] User context set after login
- [ ] Owner layout wrapped with error boundary
- [ ] Critical widgets wrapped with inline boundaries
- [ ] Bulk operations have performance monitoring
- [ ] Breadcrumbs added for key user actions
- [ ] Alert rules configured in Sentry dashboard
- [ ] Source maps uploaded to Sentry (for production)

---

## 📚 Additional Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

## 💡 Best Practices

1. **Don't over-monitor** - Use 10-20% sample rate for transactions
2. **Add context** - Always include feature/operation in error capture
3. **Use breadcrumbs** - Track user journey leading to errors
4. **Isolate widgets** - Use inline boundaries for dashboard widgets
5. **Monitor slow ops** - Track performance of heavy queries (>2s)
6. **Test error boundaries** - Verify fallback UI renders correctly
7. **Review errors weekly** - Triage and fix high-frequency issues

---

*Integration completed: December 28, 2025*
