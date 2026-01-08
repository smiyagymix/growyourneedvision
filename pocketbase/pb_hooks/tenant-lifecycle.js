/**
 * Tenant Lifecycle Automation Hooks
 * Automatically triggers lifecycle workflows on tenant events
 */

// On tenant create
$app.onRecordAfterCreate('tenants', async (e) => {
    const tenant = e.record;
    
    // Trigger tenant.created event
    await $app.dao().runInTransaction(async (txDao) => {
        // Create lifecycle trigger
        await txDao.createRecord('lifecycle_triggers', {
            workflowId: '', // Would find matching workflow
            event: 'tenant.created',
            entityType: 'tenants',
            entityId: tenant.id,
            status: 'pending',
            triggeredAt: new Date().toISOString()
        });
    });
});

// On tenant update (status change)
$app.onRecordAfterUpdate('tenants', async (e) => {
    const oldRecord = e.record;
    const newRecord = e.record;
    
    // Check if status changed
    if (oldRecord.status !== newRecord.status) {
        const event = `tenant.${newRecord.status}`;
        
        await $app.dao().runInTransaction(async (txDao) => {
            await txDao.createRecord('lifecycle_triggers', {
                workflowId: '',
                event: event,
                entityType: 'tenants',
                entityId: newRecord.id,
                status: 'pending',
                triggeredAt: new Date().toISOString()
            });
        });
    }
});

// On subscription change
$app.onRecordAfterUpdate('tenants', async (e) => {
    const oldRecord = e.record;
    const newRecord = e.record;
    
    // Check if subscription plan changed
    if (oldRecord.subscriptionPlan !== newRecord.subscriptionPlan) {
        await $app.dao().runInTransaction(async (txDao) => {
            await txDao.createRecord('lifecycle_triggers', {
                workflowId: '',
                event: 'tenant.subscription_changed',
                entityType: 'tenants',
                entityId: newRecord.id,
                status: 'pending',
                triggeredAt: new Date().toISOString()
            });
        });
    }
});
