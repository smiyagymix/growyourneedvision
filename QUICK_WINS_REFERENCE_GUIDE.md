# 🚀 Quick Wins - Implementation Reference Guide

## 📖 Quick Reference for Developers

### 1. Stripe Webhook Handlers

**Auto-Processed Events (No Code Needed):**
```javascript
// These events are automatically handled by server/index.js:
✅ customer.updated
✅ customer.deleted  
✅ charge.disputed
✅ charge.dispute.closed
✅ invoice.finalized
✅ invoice.marked_uncollectible
✅ invoice.voided
✅ customer.subscription.paused
✅ customer.subscription.resumed
✅ payment_method.automatically_updated
✅ billing_portal.session.created
✅ payment_intent.canceled
✅ checkout.session.completed
✅ checkout.session.expired
```

**Testing Webhooks:**
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3002/api/webhooks/stripe

# Trigger specific events
stripe trigger customer.updated
stripe trigger charge.disputed
stripe trigger invoice.marked_uncollectible
```

---

### 2. Email Automation Functions

**Import:**
```typescript
import { emailTemplateService } from '../services/emailTemplateService';
```

**Send Welcome Email:**
```typescript
await emailTemplateService.sendTenantWelcome({
    name: 'Acme Corporation',
    admin_email: 'admin@acme.com',
    plan: 'pro',
    trial_ends_at: '2025-01-14T00:00:00Z',
    subdomain: 'acme'
});
```

**Send Trial Reminder:**
```typescript
// 7 days before expiry
await emailTemplateService.sendTrialReminder(tenant, 7);

// 1 day before expiry
await emailTemplateService.sendTrialReminder(tenant, 1);
```

**Send Suspension Notice:**
```typescript
await emailTemplateService.sendSuspensionNotice(
    {
        name: 'Acme Corp',
        admin_email: 'admin@acme.com'
    },
    'Payment failure',
    'Unpaid invoices for 3 consecutive months. Please update payment method.'
);
```

**Send Payment Failure Alert:**
```typescript
await emailTemplateService.sendPaymentFailureNotice(
    {
        name: 'Acme Corp',
        admin_email: 'admin@acme.com',
        plan: 'pro',
        id: 'tenant123'
    },
    {
        amount: 29900, // cents
        currency: 'usd',
        paymentMethod: 'Visa ending in 4242',
        errorMessage: 'Your card was declined',
        retryDate: '2025-01-05T00:00:00Z'
    }
);
```

**Trigger Emails from Owner Dashboard:**
```typescript
// In TenantDashboard.tsx
import { emailTemplateService } from '../services/emailTemplateService';

const handleSuspend = async (tenantId: string) => {
    const tenant = await tenantService.getTenantById(tenantId);
    
    // Suspend tenant
    await tenantService.updateTenant(tenantId, { status: 'suspended' });
    
    // Send notification
    await emailTemplateService.sendSuspensionNotice(
        tenant,
        'Manual suspension',
        'Suspended by admin for policy violation'
    );
};
```

---

### 3. Bulk Operations

**Import:**
```typescript
import { tenantService } from '../services/tenantService';
```

**Bulk Suspend:**
```typescript
const result = await tenantService.bulkSuspend(
    ['tenant1', 'tenant2', 'tenant3'],
    'Payment failure',
    'All tenants have unpaid invoices for 90+ days',
    currentUser.id
);

// Handle results
console.log(`✅ Success: ${result.successCount}`);
console.log(`❌ Failed: ${result.failureCount}`);

result.results.forEach(r => {
    if (r.success) {
        console.log(`✅ ${r.tenantName} suspended`);
    } else {
        console.error(`❌ ${r.tenantName}: ${r.error}`);
    }
});
```

**Bulk Resume:**
```typescript
const result = await tenantService.bulkResume(
    ['tenant1', 'tenant2'],
    currentUser.id
);
```

**Bulk Plan Update:**
```typescript
const result = await tenantService.bulkUpdatePlan(
    ['tenant1', 'tenant2', 'tenant3'],
    'pro', // new plan
    currentUser.id
);

// Plan options: 'free' | 'basic' | 'pro' | 'enterprise'
```

**UI Integration Example:**
```tsx
// In TenantDashboard.tsx
function TenantBulkActions() {
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleBulkSuspend = async () => {
        setLoading(true);
        try {
            const result = await tenantService.bulkSuspend(
                selectedTenants,
                'Manual bulk suspension',
                'Suspended via Owner dashboard bulk action',
                user!.id
            );
            
            addToast(
                `Suspended ${result.successCount} tenant(s)`,
                result.failureCount > 0 ? 'warning' : 'success'
            );
            
            if (result.failureCount > 0) {
                console.error('Failed suspensions:', result.results.filter(r => !r.success));
            }
            
            refetch(); // Refresh tenant list
        } catch (error) {
            addToast('Bulk suspend failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button 
                onClick={handleBulkSuspend}
                disabled={selectedTenants.length === 0 || loading}
                className="btn btn-danger"
            >
                {loading ? 'Processing...' : `Suspend ${selectedTenants.length} tenant(s)`}
            </button>
        </div>
    );
}
```

---

### 4. Owner Analytics Hook

**Import:**
```typescript
import { useOwnerAnalytics } from '../hooks/useOwnerAnalytics';
```

**Basic Usage:**
```tsx
function OwnerDashboard() {
    const { data, loading, error, refetch } = useOwnerAnalytics('30d');
    
    if (loading) return <Skeleton count={5} />;
    if (error) return <ErrorDisplay error={error} />;
    
    return (
        <div className="grid grid-cols-4 gap-4">
            {/* Platform Metrics */}
            <MetricCard 
                title="Total MRR" 
                value={`$${data!.platformMetrics.totalMRR.toLocaleString()}`}
                trend={`+${data!.revenueMetrics.mrrGrowth}%`}
                icon={<DollarSign />}
            />
            
            <MetricCard 
                title="Active Tenants" 
                value={data!.platformMetrics.activeTenants}
                subtitle={`${data!.platformMetrics.trialTenants} on trial`}
                icon={<Users />}
            />
            
            <MetricCard 
                title="Churn Rate" 
                value={`${data!.platformMetrics.churnRate}%`}
                trend={data!.platformMetrics.churnRate > 5 ? 'danger' : 'success'}
                icon={<TrendingDown />}
            />
            
            <MetricCard 
                title="Growth Rate" 
                value={`${data!.platformMetrics.growthRate}%`}
                trend="success"
                icon={<TrendingUp />}
            />
        </div>
    );
}
```

**Time Range Options:**
```typescript
// Default: 30 days
const { data } = useOwnerAnalytics();

// 7 days
const { data } = useOwnerAnalytics('7d');

// 90 days
const { data } = useOwnerAnalytics('90d');
```

**Accessing Data:**
```typescript
const { data } = useOwnerAnalytics();

// Platform Metrics
const totalMRR = data.platformMetrics.totalMRR;
const activeTenants = data.platformMetrics.activeTenants;
const churnRate = data.platformMetrics.churnRate;

// Usage Metrics
const apiCalls = data.usageMetrics.totalAPICallsToday;
const storage = data.usageMetrics.totalStorageUsedGB;
const activeUsers = data.usageMetrics.activeUsersToday;

// Revenue Metrics
const mrrGrowth = data.revenueMetrics.mrrGrowth;
const newMRR = data.revenueMetrics.newMRR;
const churnedMRR = data.revenueMetrics.churnedMRR;

// Top Tenants
data.topTenants.forEach(tenant => {
    console.log(`${tenant.tenantName}: $${tenant.mrr} MRR`);
});

// Recent Activity
data.recentActivity.forEach(activity => {
    console.log(`${activity.timestamp}: ${activity.message}`);
});
```

**Manual Refresh:**
```typescript
const { refetch } = useOwnerAnalytics();

// Trigger manual refresh
const handleRefresh = async () => {
    await refetch();
};
```

---

### 5. PocketBase Collections (Query Examples)

**Platform Settings:**
```typescript
import pb from '../lib/pocketbase';

// Get setting
const maintenanceMode = await pb.collection('platform_settings').getFirstListItem(
    'key = "maintenance_mode"'
);

// Update setting
await pb.collection('platform_settings').update(maintenanceMode.id, {
    value: { enabled: true, message: 'System upgrade in progress' }
});
```

**Feature Rollouts:**
```typescript
// Create gradual rollout
await pb.collection('feature_rollouts').create({
    featureId: 'new_dashboard',
    tenantId: null, // All tenants
    enabled: true,
    rolloutPercentage: 25, // Start at 25%
    startDate: new Date().toISOString(),
    status: 'active'
});

// Check if tenant has feature
const rollouts = await pb.collection('feature_rollouts').getFullList({
    filter: `featureId = "new_dashboard" && (tenantId = "${tenantId}" || tenantId = null)`
});
```

**Tenant Migrations:**
```typescript
// Track clone operation
const migration = await pb.collection('tenant_migrations').create({
    sourceTenantId: 'source123',
    targetTenantId: 'target456',
    status: 'in_progress',
    migrationType: 'clone',
    dataTypes: ['users', 'courses', 'assignments'],
    progress: 0,
    startedAt: new Date().toISOString(),
    initiatedBy: currentUser.id
});

// Update progress
await pb.collection('tenant_migrations').update(migration.id, {
    progress: 50,
    migratedRecords: 1250
});
```

**Compliance Records:**
```typescript
// Create compliance record
await pb.collection('compliance_records').create({
    tenantId: 'tenant123',
    standard: 'GDPR',
    status: 'compliant',
    certificateUrl: 'https://...',
    expiryDate: '2025-12-31',
    lastAuditDate: new Date().toISOString(),
    score: 95
});

// Get expiring certifications
const expiring = await pb.collection('compliance_records').getFullList({
    filter: 'expiryDate < "2025-02-01" && status = "compliant"'
});
```

**SLA Metrics:**
```typescript
// Record daily uptime
await pb.collection('sla_metrics').create({
    tenantId: 'tenant123',
    metricType: 'uptime',
    target: 99.9,
    actual: 99.95,
    unit: 'percentage',
    period: 'daily',
    startDate: '2025-01-01',
    endDate: '2025-01-01',
    breached: false
});
```

**Cost Attribution:**
```typescript
// Track monthly costs
await pb.collection('cost_attribution').create({
    tenantId: 'tenant123',
    resourceType: 'compute',
    cost: 45.67,
    currency: 'USD',
    usageAmount: 720,
    usageUnit: 'hours',
    billingPeriod: '2025-01-01',
    providerName: 'AWS'
});

// Calculate tenant profit
const costs = await pb.collection('cost_attribution').getFullList({
    filter: `tenantId = "${tenantId}" && billingPeriod >= "2025-01-01"`
});
const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
const revenue = tenant.mrr; // From tenant record
const profit = revenue - totalCost;
```

**Abuse Reports:**
```typescript
// Create abuse report
await pb.collection('abuse_reports').create({
    reportedTenantId: 'tenant123',
    reportedUserId: 'user456',
    reportedBy: currentUser.id,
    abuseType: 'spam',
    severity: 'high',
    description: '<p>User is sending bulk spam emails...</p>',
    status: 'open'
});

// Resolve report
await pb.collection('abuse_reports').update(reportId, {
    status: 'resolved',
    resolution: '<p>Account suspended for 7 days...</p>',
    actionTaken: 'temporary_suspension',
    resolvedAt: new Date().toISOString()
});
```

**Tenant Communications:**
```typescript
// Schedule platform announcement
await pb.collection('tenant_communications').create({
    targetTenants: ['all'], // or specific tenant IDs
    subject: 'New Feature: Advanced Analytics',
    body: '<h1>Exciting News!</h1><p>We\'ve launched...</p>',
    sendAt: '2025-01-15T09:00:00Z',
    status: 'scheduled',
    channelType: 'email',
    priority: 'medium',
    createdBy: currentUser.id,
    totalRecipients: 0 // Will be calculated on send
});
```

---

## 🔗 Integration Patterns

### Combine Email + Bulk Operations:
```typescript
// Suspend tenants and notify
const suspendAndNotify = async (tenantIds: string[], reason: string) => {
    const result = await tenantService.bulkSuspend(
        tenantIds,
        reason,
        'Automated suspension due to policy violation',
        'system'
    );
    
    // Emails are automatically sent by bulkSuspend function
    console.log(`Suspended ${result.successCount} tenants with email notifications`);
};
```

### Webhook → Email Flow:
```typescript
// In server webhook handler
case 'invoice.marked_uncollectible':
    const invoice = event.data.object;
    
    // 1. Update tenant status
    await pbUpdate('tenants', tenantId, { 
        status: 'suspended',
        suspension_reason: 'uncollectible_debt'
    });
    
    // 2. Send email notification (already implemented in webhook handler)
    // Email automatically sent via emailTemplateService
    
    break;
```

### Analytics → Bulk Actions:
```typescript
// Identify at-risk tenants and take action
const { data } = useOwnerAnalytics();

const atRiskTenants = data.topTenants.filter(t => 
    t.status === 'trial' && 
    t.apiCalls < 100 // Low usage
);

if (atRiskTenants.length > 0) {
    // Send re-engagement emails
    for (const tenant of atRiskTenants) {
        await emailTemplateService.sendTrialReminder(tenant, 3);
    }
}
```

---

## 🛠️ Troubleshooting

### Webhook Not Processing:
```bash
# Check webhook signature
echo $STRIPE_WEBHOOK_SECRET

# Test locally
stripe listen --forward-to localhost:3002/api/webhooks/stripe

# Check server logs
tail -f logs/server.log | grep webhook
```

### Email Not Sending:
```typescript
// Check SMTP configuration
console.log(process.env.SMTP_HOST);
console.log(process.env.SMTP_PORT);

// Test email service
const result = await emailTemplateService.sendTenantWelcome(testTenant);
if (!result.success) {
    console.error('Email failed:', result.error);
}
```

### Bulk Operation Failures:
```typescript
const result = await tenantService.bulkSuspend(tenantIds, reason, details, userId);

// Check individual failures
result.results
    .filter(r => !r.success)
    .forEach(r => {
        console.error(`Failed to suspend ${r.tenantName}: ${r.error}`);
    });
```

### Analytics Not Loading:
```typescript
const { data, loading, error } = useOwnerAnalytics();

if (error) {
    console.error('Analytics error:', error);
    // Check PocketBase connection
    // Check user permissions
}
```

---

## 📚 Related Documentation

- **Full Gap Analysis:** `OWNER_DASHBOARD_GAP_ANALYSIS.md`
- **Complete Implementation:** `QUICK_WINS_IMPLEMENTATION_COMPLETE.md`
- **Platform Guide:** `.github/copilot-instructions.md`
- **Stripe Docs:** https://stripe.com/docs/webhooks
- **PocketBase Docs:** https://pocketbase.io/docs

---

**Last Updated:** December 31, 2025  
**Version:** 1.0.0
