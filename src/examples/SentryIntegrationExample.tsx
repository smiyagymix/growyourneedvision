/**
 * Example: Integrating Sentry with Owner Dashboards
 * 
 * This file demonstrates how to wrap Owner components with error boundaries
 * and performance monitoring using Sentry.
 */

// 1. Initialize Sentry in main.tsx or App.tsx
import { initializeSentry, setUserContext } from './lib/sentry';

// Call once at app startup
initializeSentry();

// Set user context when user logs in
const user = { id: '123', email: 'admin@example.com', role: 'Owner' };
setUserContext(user);

// 2. Wrap individual Owner components with error boundaries
import { withOwnerErrorBoundary } from './components/shared/ui/OwnerErrorBoundary';
import { TenantDashboard } from './apps/owner/TenantDashboard';
import { SystemHealthDashboard } from './apps/owner/SystemHealthDashboard';
import { RevenueAnalysis } from './apps/owner/RevenueAnalysis';

// Inline error fallback for widgets
export const SafeTenantDashboard = withOwnerErrorBoundary(
    TenantDashboard,
    'TenantDashboard',
    'full' // or 'inline' for widget errors
);

export const SafeSystemHealth = withOwnerErrorBoundary(
    SystemHealthDashboard,
    'SystemHealthDashboard',
    'full'
);

// 3. Use in routes
import { Routes, Route } from 'react-router-dom';

function OwnerRoutes() {
    return (
        <Routes>
            <Route path="/admin/tenants" element={<SafeTenantDashboard />} />
            <Route path="/admin/health" element={<SafeSystemHealth />} />
        </Routes>
    );
}

// 4. Wrap entire Owner layout with error boundary
import { OwnerErrorBoundary } from './components/shared/ui/OwnerErrorBoundary';

function OwnerLayout({ children }: { children: React.ReactNode }) {
    return (
        <OwnerErrorBoundary componentName="OwnerLayout" fallbackMode="full">
            <div className="owner-layout">
                {/* Navbar, Sidebar, etc. */}
                {children}
            </div>
        </OwnerErrorBoundary>
    );
}

// 5. Manual error capture in try-catch blocks
import { captureException, measurePerformance, addBreadcrumb } from './lib/sentry';

async function bulkSuspendTenants(tenantIds: string[]) {
    try {
        addBreadcrumb('Starting bulk suspend', 'action', { count: tenantIds.length });
        
        // Measure performance of expensive operation
        const result = await measurePerformance(
            'bulkSuspendTenants',
            async () => {
                // Your bulk operation logic
                return await ownerTenantService.bulkSuspendTenants(tenantIds, 'Manual suspension');
            },
            { tenantCount: tenantIds.length, feature: 'bulk-operations' }
        );
        
        return result;
    } catch (error) {
        // Capture with context
        captureException(error as Error, {
            feature: 'bulk-operations',
            operation: 'suspend',
            tenantIds,
            tenantCount: tenantIds.length
        });
        throw error;
    }
}

// 6. Breadcrumbs for user actions
import { addBreadcrumb } from './lib/sentry';

function handleTenantClick(tenantId: string) {
    addBreadcrumb('Tenant clicked', 'user-action', {
        tenantId,
        page: 'tenant-dashboard'
    });
    
    // Navigate to tenant details...
}

// 7. Performance monitoring for API calls
import { measurePerformance } from './lib/sentry';

async function fetchTenantAnalytics(tenantId: string) {
    return measurePerformance(
        `fetchTenantAnalytics-${tenantId}`,
        async () => {
            const response = await fetch(`/api/tenants/${tenantId}/analytics`);
            return response.json();
        },
        { tenantId, endpoint: 'analytics' }
    );
}

// 8. Hook error boundaries (for widget errors)
function OwnerDashboard() {
    return (
        <div className="grid grid-cols-3 gap-4">
            <OwnerErrorBoundary componentName="ChurnPredictionWidget" fallbackMode="inline">
                <ChurnPredictionWidget />
            </OwnerErrorBoundary>
            
            <OwnerErrorBoundary componentName="AlertsWidget" fallbackMode="inline">
                <AlertsWidget mode="badge" />
            </OwnerErrorBoundary>
            
            <OwnerErrorBoundary componentName="RevenueChart" fallbackMode="inline">
                <RevenueChart />
            </OwnerErrorBoundary>
        </div>
    );
}

// 9. Clear user context on logout
import { setUserContext } from './lib/sentry';

function handleLogout() {
    setUserContext(null); // Clear Sentry user context
    // ... rest of logout logic
}

// 10. Environment variables required
/*
Add to .env:

VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
*/

export {}; // Make this a module
