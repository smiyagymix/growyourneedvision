/**
 * Cost Attribution Tracking Hooks
 * Tracks resource usage for cost attribution
 */

// Track file uploads (storage cost)
$app.onRecordAfterCreate('file_uploads', async (e) => {
    const file = e.record;
    const size = file.size || 0;
    
    await $app.dao().runInTransaction(async (txDao) => {
        // Update tenant storage usage
        const tenant = await txDao.findRecordById('tenants', file.tenantId);
        const currentStorage = tenant.storageUsed || 0;
        
        await txDao.updateRecord('tenants', {
            id: file.tenantId,
            storageUsed: currentStorage + size
        });
    });
});

// Track API calls (API cost)
$app.onBeforeServe((e) => {
    e.router.addRoute({
        method: 'GET',
        path: '/api/*',
        handler: async (c) => {
            // Track API call
            const tenantId = c.query('tenantId') || c.headers['x-tenant-id'];
            if (tenantId) {
                await $app.dao().runInTransaction(async (txDao) => {
                    // Increment API call count
                    const tenant = await txDao.findRecordById('tenants', tenantId);
                    const currentCalls = tenant.apiCallsThisMonth || 0;
                    
                    await txDao.updateRecord('tenants', {
                        id: tenantId,
                        apiCallsThisMonth: currentCalls + 1
                    });
                });
            }
        }
    });
});
