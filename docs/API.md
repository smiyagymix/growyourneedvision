# Internal API & Service Documentation

## Overview
The application uses a **Service Layer Pattern** to interact with the PocketBase backend. All direct PocketBase calls should be encapsulated within these services located in `src/services/`.

## Core Services

### 1. `OwnerService` (`src/services/ownerService.ts`)
Handles logic for the **Owner Dashboard**, including analytics, tenant management, and system health.
- `getDashboardData()`: Aggregates KPIs, revenue history, and alerts.
- `getSystemHealth()`: Fetches latest system diagnostics.
- `getAuditLogs(page, perPage)`: Paginated audit logs.

### 2. `TenantService` (`src/services/tenantService.ts`)
Manages School and Organization tenants.
- `createTenant(data)`: Provisions a new school/org.
- `suspendTenant(id)`: Deactivates a tenant.

### 3. `BillingService` (`src/services/billingService.ts`)
Handles invoices and subscription logic.
- `createInvoice(data)`: Generates a new invoice.
- `processPayment(invoiceId)`: Marks invoice as paid (integration with Stripe/Hyperswitch).

### 4. `AuthService` (`src/context/AuthContext.tsx`)
Manages user session and authentication state using PocketBase `authStore`.

## Database Schema Highlights
- **Users**: Central identity. Field `role` determines access (`Owner`, `SchoolAdmin`, etc.).
- **Tenants**: Organizations/Schools.
- **Invoices**: Billing records.
- **System_Alerts**: Critical system notifications.

## Best Practices
- **Singleton Pattern**: Always import the `pb` instance from `@/lib/pocketbase` to ensure a shared auth state.
- **React Query**: Use `useQuery` hooks in components for data fetching to leverage caching.
- **Environment Variables**: Never hardcode credentials. Use `import.meta.env` (client) or `process.env` (scripts/server).
