import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function fixNotificationsSchema() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        console.log('Fetching notifications collection...');
        const collection = await pb.collections.getOne('notifications');
        
        // Check if we should use 'fields' or 'schema'
        const isFields = !!collection.fields;
        let schema = collection.fields || collection.schema || [];
        
        console.log(`Using ${isFields ? 'fields' : 'schema'} property.`);

        // Find 'read' field
        const readField = schema.find(f => f.name === 'read');
        if (readField) {
            console.log('Renaming "read" to "is_read"...');
            readField.name = 'is_read';
            
            const data = {};
            if (isFields) {
                data.fields = schema;
            } else {
                data.schema = schema;
            }

            await pb.collections.update(collection.id, data);
            console.log('Notifications schema updated successfully.');
        } else {
            console.log('"read" field not found. Checking for "is_read"...');
            if (schema.find(f => f.name === 'is_read')) {
                console.log('"is_read" already exists.');
            } else {
                console.log('Neither "read" nor "is_read" found. Adding "is_read"...');
                schema.push({
                    name: 'is_read',
                    type: 'bool',
                    required: false
                });
                await pb.collections.update(collection.id, { schema });
                console.log('Added "is_read" field.');
            }
        }
        
    } catch (err) {
        console.error('Error:', err);
    }
}

fixNotificationsSchema();
