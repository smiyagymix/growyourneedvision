import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initNotifications() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authentication successful.');

        console.log('Checking notifications collection...');
        
        let collection;
        try {
            collection = await pb.collections.getOne('notifications');
            console.log('Notifications collection exists. Updating schema...');
        } catch (e) {
            console.log('Notifications collection does not exist. Creating...');
        }

        const schema = [
            {
                name: 'message',
                type: 'text',
                required: true,
                options: { min: 1, max: 500 }
            },
            {
                name: 'type',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['info', 'success', 'warning', 'error']
                }
            },
            {
                name: 'read',
                type: 'bool',
                required: false,
                options: {}
            },
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['email']
                }
            }
        ];

        const rules = {
            listRule: "user = @request.auth.id",
            viewRule: "user = @request.auth.id",
            createRule: "user = @request.auth.id", 
            updateRule: "user = @request.auth.id",
            deleteRule: "user = @request.auth.id",
        };

        if (collection) {
            await pb.collections.update(collection.id, {
                schema: schema,
                ...rules
            });
            console.log('Notifications collection updated successfully.');
        } else {
            await pb.collections.create({
                name: 'notifications',
                type: 'base',
                schema: schema,
                ...rules
            });
            console.log('Notifications collection created successfully.');
        }

    } catch (err) {
        console.error('Error initializing notifications:', err);
    }
}

initNotifications();
