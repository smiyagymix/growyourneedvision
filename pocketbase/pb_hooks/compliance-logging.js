/**
 * Compliance Audit Logging Hooks
 * Automatically logs compliance-relevant events
 */

// Log user data access
$app.onRecordAfterView('users', async (e) => {
    await $app.dao().runInTransaction(async (txDao) => {
        await txDao.createRecord('audit_logs', {
            action: 'user.data_access',
            userId: e.record.id,
            metadata: {
                accessedBy: e.httpContext.user?.id,
                timestamp: new Date().toISOString()
            },
            severity: 'info'
        });
    });
});

// Log data deletion
$app.onRecordAfterDelete('users', async (e) => {
    await $app.dao().runInTransaction(async (txDao) => {
        await txDao.createRecord('audit_logs', {
            action: 'user.deleted',
            userId: e.record.id,
            metadata: {
                deletedBy: e.httpContext.user?.id,
                timestamp: new Date().toISOString()
            },
            severity: 'warning'
        });
    });
});

// Log tenant data access
$app.onRecordAfterView('tenants', async (e) => {
    await $app.dao().runInTransaction(async (txDao) => {
        await txDao.createRecord('audit_logs', {
            action: 'tenant.data_access',
            tenantId: e.record.id,
            metadata: {
                accessedBy: e.httpContext.user?.id,
                timestamp: new Date().toISOString()
            },
            severity: 'info'
        });
    });
});
